const fs = require('fs');
const path = require('path');
const { 
  SlashCommandBuilder, 
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');
const { 
  joinVoiceChannel, 
  getVoiceConnection, 
  VoiceConnectionStatus, 
  entersState,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType
} = require('@discordjs/voice');
const { Readable } = require('stream');

const CONFIG_FILE = path.join(__dirname, '../afk_voice_config.json');

// Helper untuk membaca konfigurasi multi-server
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const data = JSON.parse(raw);

      // Migrasi otomatis jika masih berformat single-guild lama
      if (data && data.channelId && data.guildId && !data.guilds) {
        const migrated = {
          guilds: {
            [data.guildId]: {
              channelId: data.channelId,
              guildId: data.guildId,
              channelName: 'Voice Channel',
              guildName: 'Guild',
              enabled: true,
              updatedAt: data.updatedAt || new Date().toISOString()
            }
          }
        };
        saveConfig(migrated);
        return migrated;
      }

      if (data && typeof data.guilds === 'object' && data.guilds !== null) {
        return data;
      }
    }
  } catch (e) {
    console.error('[AFK Voice] Gagal membaca afk_voice_config.json:', e.message);
  }
  return { guilds: {} };
}

// Helper untuk menyimpan konfigurasi
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('[AFK Voice] Gagal menyimpan afk_voice_config.json:', e.message);
  }
}

// Simpan atau perbarui channel AFK untuk server tertentu
function saveGuildAfk(guildId, channelId, meta = {}) {
  const config = loadConfig();
  config.guilds = config.guilds || {};
  config.guilds[guildId] = {
    channelId,
    guildId,
    channelName: meta.channelName || null,
    guildName: meta.guildName || null,
    enabled: true,
    updatedAt: new Date().toISOString()
  };
  saveConfig(config);
}

// Hapus channel AFK hanya untuk server tertentu
function removeGuildAfk(guildId) {
  const config = loadConfig();
  if (config.guilds && config.guilds[guildId]) {
    delete config.guilds[guildId];
    saveConfig(config);
  }
}

// Stream hening (Opus Silence Frame) agar Discord tidak mendiskoneksi bot karena idle
class SilenceStream extends Readable {
  _read() {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}

// State tracking per server (guild)
const manualDisconnects = new Set();
const reconnectTimers = new Map();
const audioPlayers = new Map();

// Fungsi untuk menghubungkan bot ke voice channel tertentu
function connectToVoice(channel, client) {
  if (!channel || !channel.id || !channel.guild) return null;
  const guildId = channel.guild.id;

  manualDisconnects.delete(guildId);
  saveGuildAfk(guildId, channel.id, {
    channelName: channel.name,
    guildName: channel.guild.name
  });

  if (reconnectTimers.has(guildId)) {
    clearTimeout(reconnectTimers.get(guildId));
    reconnectTimers.delete(guildId);
  }

  // Jika sudah terhubung di channel yang sama dengan status Ready, tidak perlu connect ulang
  const existingConn = getVoiceConnection(guildId);
  if (
    existingConn &&
    existingConn.joinConfig?.channelId === channel.id &&
    existingConn.state.status === VoiceConnectionStatus.Ready
  ) {
    return existingConn;
  }

  // Jika koneksi lama ada di channel lain atau statusnya rusak, bersihkan dulu
  if (existingConn && existingConn.joinConfig?.channelId !== channel.id) {
    try { existingConn.destroy(); } catch {}
  }

  // Bersihkan audio player lama untuk guild ini
  if (audioPlayers.has(guildId)) {
    try { audioPlayers.get(guildId).stop(true); } catch {}
    audioPlayers.delete(guildId);
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false
  });

  // Keepalive silence player
  try {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });
    const resource = createAudioResource(new SilenceStream(), {
      inputType: StreamType.Opus
    });
    player.play(resource);
    connection.subscribe(player);
    audioPlayers.set(guildId, player);

    player.on('error', () => {});
  } catch (err) {
    console.error(`[AFK Voice] Gagal inisialisasi audio keepalive di server ${channel.guild.name}:`, err.message);
  }

  // Cegah unhandled error pada koneksi voice (misal: DNS lookup glitch atau Cloudflare 521/522)
  connection.on('error', (err) => {
    console.warn(`[AFK Voice] Connection error di [${channel.guild.name}]:`, err.message);
  });

  const handleReconnect = () => {
    if (manualDisconnects.has(guildId)) return;
    scheduleReconnect(guildId, client);
  };

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    if (manualDisconnects.has(guildId)) return;
    try {
      // Tunggu hingga 5 detik jika hanya pergantian server Discord (voice server switch)
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch {
      try { connection.destroy(); } catch {}
      handleReconnect();
    }
  });

  connection.on(VoiceConnectionStatus.Failed, () => {
    if (manualDisconnects.has(guildId)) return;
    try { connection.destroy(); } catch {}
    handleReconnect();
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    if (audioPlayers.has(guildId)) {
      try { audioPlayers.get(guildId).stop(true); } catch {}
      audioPlayers.delete(guildId);
    }
  });

  return connection;
}

// Jadwalkan reconnect otomatis per guild
function scheduleReconnect(guildId, client, delayMs = 3000) {
  if (manualDisconnects.has(guildId)) return;
  if (reconnectTimers.has(guildId)) return;

  const timer = setTimeout(async () => {
    reconnectTimers.delete(guildId);
    if (manualDisconnects.has(guildId)) return;

    const config = loadConfig();
    const gData = config.guilds[guildId];
    if (!gData || !gData.channelId) return;

    try {
      const channel = await client.channels.fetch(gData.channelId).catch(() => null);
      if (channel && channel.isVoiceBased()) {
        connectToVoice(channel, client);
        console.log(`🔄 [AFK Voice] Berhasil auto-reconnect ke [${channel.guild.name}] #${channel.name}`);
      } else {
        console.warn(`⚠️ [AFK Voice] Channel target ${gData.channelId} tidak ditemukan di server ${guildId}`);
      }
    } catch (e) {
      console.error(`[AFK Voice] Gagal reconnect di server ${guildId}:`, e.message);
    }
  }, delayMs);

  reconnectTimers.set(guildId, timer);
}

// Slash Command: /afkvoice
const afkVoiceCommand = {
  data: new SlashCommandBuilder()
    .setName('afkvoice')
    .setDescription('Membuat bot standby di voice channel 24/7 nonstop di server ini')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target voice channel (kosongkan jika ingin channel tempat kamu berada saat ini)')
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        .setRequired(false)
    ),
  async execute(interaction, client) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Perintah ini hanya bisa digunakan di dalam server (Guild)!',
        ephemeral: true
      });
    }

    let targetChannel = interaction.options.getChannel('channel');

    if (!targetChannel) {
      targetChannel = interaction.member?.voice?.channel;
    }

    if (!targetChannel || !targetChannel.isVoiceBased()) {
      return interaction.reply({
        content: '❌ **Voice channel tidak ditemukan!**\nSilakan tentukan channel pada opsi `/afkvoice channel:<pilih>` atau masuk ke salah satu voice channel terlebih dahulu.',
        ephemeral: true
      });
    }

    manualDisconnects.delete(interaction.guild.id);
    connectToVoice(targetChannel, client);

    return interaction.reply({
      content: `✅ **Bot aktif standby 24/7 di server:** \`${interaction.guild.name}\`\n` +
               `🔊 **Voice Channel:** \`${targetChannel.name}\`\n` +
               `💾 **Status:** Tersimpan permanen. Bot akan otomatis reconnect saat server/VM mati atau restart tanpa memengaruhi server lain.`
    });
  }
};

// Slash Command: /stopafk
const stopAfkCommand = {
  data: new SlashCommandBuilder()
    .setName('stopafk')
    .setDescription('Menonaktifkan mode AFK 24/7 di server ini dan mengeluarkan bot dari voice channel'),
  async execute(interaction, client) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Perintah ini hanya bisa digunakan di dalam server (Guild)!',
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;
    manualDisconnects.add(guildId);
    removeGuildAfk(guildId);

    if (reconnectTimers.has(guildId)) {
      clearTimeout(reconnectTimers.get(guildId));
      reconnectTimers.delete(guildId);
    }

    const conn = getVoiceConnection(guildId);
    if (conn) {
      try { conn.destroy(); } catch {}
    }

    return interaction.reply({
      content: `⏹️ **Mode AFK Voice 24/7 dinonaktifkan di server [${interaction.guild.name}].**\nBot telah keluar dari voice channel dan tidak akan auto-reconnect lagi di server ini.`
    });
  }
};

// Slash Command: /afkstatus
const afkStatusCommand = {
  data: new SlashCommandBuilder()
    .setName('afkstatus')
    .setDescription('Melihat status fitur AFK Voice 24/7 di server ini dan server lainnya'),
  async execute(interaction, client) {
    const config = loadConfig();
    const guildId = interaction.guild?.id;
    const currentGuildAfk = guildId ? config.guilds[guildId] : null;

    const totalConfigured = Object.keys(config.guilds).length;
    let activeConnectionsCount = 0;
    for (const gid of Object.keys(config.guilds)) {
      const c = getVoiceConnection(gid);
      if (c && c.state.status === VoiceConnectionStatus.Ready) {
        activeConnectionsCount++;
      }
    }

    let thisServerStatus = '❌ Tidak aktif';
    if (currentGuildAfk) {
      const conn = getVoiceConnection(guildId);
      const isReady = conn && conn.state.status === VoiceConnectionStatus.Ready;
      thisServerStatus = isReady 
        ? `🟢 **Aktif (Connected)** di <#${currentGuildAfk.channelId}>` 
        : `🟡 **Aktif (Reconnecting/Standby)** di <#${currentGuildAfk.channelId}>`;
    }

    return interaction.reply({
      content: `📊 **Status AFK Voice 24/7 Multi-Server:**\n` +
               `• **Server Ini (${interaction.guild?.name || 'Guild'}):** ${thisServerStatus}\n` +
               `• **Total Server Menggunakan AFK Voice:** \`${totalConfigured}\` server\n` +
               `• **Koneksi Voice Berjalan Bersamaan:** \`${activeConnectionsCount}\` server`
    });
  }
};

module.exports = {
  commands: [afkVoiceCommand, stopAfkCommand, afkStatusCommand],
  init(client) {
    // 1. Voice State Update Listener: Deteksi jika bot terputus atau dikeluarkan
    client.on('voiceStateUpdate', (oldState, newState) => {
      if (newState.id !== client.user.id) return;
      const guildId = newState.guild.id;

      // Jika bot terputus dari voice channel (channelId menjadi null)
      if (!newState.channelId) {
        if (manualDisconnects.has(guildId)) return;

        const config = loadConfig();
        if (config.guilds[guildId]) {
          scheduleReconnect(guildId, client, 2000);
        }
      }
    });

    // 2. Auto-join ke SEMUA server yang tersimpan saat bot start (Reboot/Restart VM)
    const autoJoinAll = async () => {
      const config = loadConfig();

      // Fallback opsional jika file baru dan ada env var AFK_VOICE_CHANNEL_ID
      if (Object.keys(config.guilds).length === 0 && process.env.AFK_VOICE_CHANNEL_ID) {
        try {
          const envChannel = await client.channels.fetch(process.env.AFK_VOICE_CHANNEL_ID).catch(() => null);
          if (envChannel && envChannel.isVoiceBased()) {
            saveGuildAfk(envChannel.guild.id, envChannel.id, {
              channelName: envChannel.name,
              guildName: envChannel.guild.name
            });
            config.guilds[envChannel.guild.id] = {
              channelId: envChannel.id,
              guildId: envChannel.guild.id
            };
          }
        } catch (e) {}
      }

      const guildEntries = Object.entries(config.guilds);
      if (guildEntries.length === 0) return;

      console.log(`📡 [AFK Voice] Memulai auto-join untuk ${guildEntries.length} server tersimpan...`);

      for (const [guildId, gData] of guildEntries) {
        if (manualDisconnects.has(guildId)) continue;

        try {
          const channel = await client.channels.fetch(gData.channelId).catch(() => null);
          if (channel && channel.isVoiceBased()) {
            connectToVoice(channel, client);
            console.log(`✅ [AFK Voice 24/7] Auto-connected di [${channel.guild.name}] #${channel.name}`);
          } else {
            console.warn(`⚠️ [AFK Voice 24/7] Channel ${gData.channelId} di server ${guildId} tidak ditemukan.`);
          }
        } catch (err) {
          console.error(`❌ [AFK Voice] Error saat auto-join di server ${guildId}:`, err.message);
        }
      }
    };

    if (client.isReady()) {
      autoJoinAll();
    } else {
      client.once('clientReady', autoJoinAll);
    }

    // 3. Periodic Watchdog (Heartbeat) setiap 30 detik untuk memastikan semua server tetap 24/7
    setInterval(async () => {
      if (!client.isReady()) return;
      const config = loadConfig();

      for (const [guildId, gData] of Object.entries(config.guilds)) {
        if (manualDisconnects.has(guildId)) continue;

        try {
          const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
          if (!guild) continue;

          const currentChannelId = guild.members.me?.voice?.channelId;
          const conn = getVoiceConnection(guildId);

          const isConnected = conn && 
            conn.state.status === VoiceConnectionStatus.Ready && 
            currentChannelId === gData.channelId;

          if (!isConnected) {
            const channel = await client.channels.fetch(gData.channelId).catch(() => null);
            if (channel && channel.isVoiceBased()) {
              connectToVoice(channel, client);
            }
          }
        } catch (e) {
          // Abaikan error watchdog agar interval tetap jalan
        }
      }
    }, 30000);
  }
};