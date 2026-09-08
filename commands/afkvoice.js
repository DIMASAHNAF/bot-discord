const { 
  joinVoiceChannel, 
  getVoiceConnection, 
  VoiceConnectionStatus, 
  entersState 
} = require('@discordjs/voice');

// Menyimpan status jika user sengaja mematikan bot lewat !stopafk
const manualDisconnects = new Set();

module.exports = (client) => {
  // Fungsi untuk join channel dan auto-reconnect 24/7 jika terputus
  function connectToVoice(channel) {
    manualDisconnects.delete(channel.guild.id);

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true, // deafen bot agar hemat kuota dan beban VPS
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      // Jika sengaja di-stop lewat !stopafk, jangan reconnect otomatis
      if (manualDisconnects.has(channel.guild.id)) return;

      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        try { connection.destroy(); } catch {}
        console.log(`[AFK Voice] Koneksi ke ${channel.name} terputus. Mencoba reconnect dalam 5 detik...`);
        setTimeout(() => {
          if (!manualDisconnects.has(channel.guild.id)) {
            connectToVoice(channel);
          }
        }, 5000);
      }
    });

    return connection;
  }

  // Auto-join saat bot online jika AFK_VOICE_CHANNEL_ID diisi di .env
  const autoJoinFromEnv = async () => {
    const channelId = process.env.AFK_VOICE_CHANNEL_ID;
    if (!channelId) return;

    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel && channel.isVoiceBased()) {
        connectToVoice(channel);
        console.log(`✅ [AFK Voice 24/7] Berhasil auto-join ke voice channel: ${channel.name}`);
      } else {
        console.log(`⚠️ [AFK Voice] Channel ID ${channelId} tidak ditemukan atau bukan voice channel.`);
      }
    } catch (err) {
      console.error('[AFK Voice] Error auto-join:', err);
    }
  };

  if (client.isReady()) {
    autoJoinFromEnv();
  } else {
    client.once('clientReady', autoJoinFromEnv);
  }

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Command: !afkvoice [ID_CHANNEL / MENTION / NAMA]
    if (message.content.startsWith('!afkvoice')) {
      const args = message.content.trim().split(/\s+/);
      const targetParam = args[1];

      let targetChannel = null;

      if (targetParam) {
        const cleanId = targetParam.replace(/[<#>]/g, '');
        // Coba cari via ID atau fetch langsung
        targetChannel = message.guild.channels.cache.get(cleanId);
        if (!targetChannel) {
          try {
            targetChannel = await message.guild.channels.fetch(cleanId).catch(() => null);
          } catch {}
        }

        // Jika tidak ketemu via ID, cari berdasarkan nama voice channel
        if (!targetChannel) {
          const searchName = args.slice(1).join(' ').toLowerCase();
          targetChannel = message.guild.channels.cache.find(
            (c) => c.isVoiceBased && c.isVoiceBased() && c.name.toLowerCase() === searchName
          );
        }
      } else {
        // Jika tanpa argumen, ambil channel tempat user berada saat ini
        targetChannel = message.member?.voice?.channel;
      }

      if (!targetChannel || !targetChannel.isVoiceBased()) {
        return message.reply(
          '❌ **Voice channel tidak ditemukan!**\n' +
          'Silakan gunakan salah satu cara berikut:\n' +
          '1. `!afkvoice <ID_CHANNEL>` (tidak perlu kamu join ke voice channel)\n' +
          '2. `!afkvoice <NAMA_CHANNEL>`\n' +
          '3. Masuk ke salah satu voice channel, lalu ketik `!afkvoice`\n' +
          '*(Opsional: Isi `AFK_VOICE_CHANNEL_ID` di file .env agar otomatis join saat bot nyala)*'
        );
      }

      connectToVoice(targetChannel);
      return message.reply(`✅ Bot berhasil standby 24/7 di channel **${targetChannel.name}**.`);
    }

    // Command: !stopafk untuk mengeluarkan bot dari voice channel
    if (message.content.startsWith('!stopafk')) {
      const conn = getVoiceConnection(message.guild.id);
      if (!conn) return message.reply('❌ Bot sedang tidak berada di voice channel mana pun.');

      manualDisconnects.add(message.guild.id);
      conn.destroy();
      return message.reply('⏹️ Bot berhasil diputus dari voice channel.');
    }
  });
};