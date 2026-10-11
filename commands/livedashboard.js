const fs = require('fs');
const path = require('path');
const os = require('os');
const { 
  SlashCommandBuilder,
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
} = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

const LIVE_CONFIG_FILE = path.join(__dirname, '../livedashboard_config.json');

function loadLiveConfig() {
  try {
    if (fs.existsSync(LIVE_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(LIVE_CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[LiveDashboard] Error reading config:', e);
  }
  return {};
}

function saveLiveConfig(config) {
  try {
    fs.writeFileSync(LIVE_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('[LiveDashboard] Error saving config:', e);
  }
}

// Fungsi pembuatan Embed Dashboard Real-time
function generateDashboardEmbed(client, guild) {
  const uptimeSec = Math.floor(process.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeStr = `${days}h ${hours}m ${minutes}s ${seconds}dtk`;

  // Memory
  const ramBotMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const totalSysMemMB = (os.totalmem() / 1024 / 1024).toFixed(0);
  const freeSysMemMB = (os.freemem() / 1024 / 1024).toFixed(0);
  const usedSysMemMB = (totalSysMemMB - freeSysMemMB);
  const ramUsagePercent = ((usedSysMemMB / totalSysMemMB) * 100).toFixed(1);

  // Ping
  const pingWs = client.ws.ping;
  const pingStatus = pingWs < 100 ? '🟢 Sangat Baik' : pingWs < 200 ? '🟡 Stabil' : '🔴 Tinggi';

  // Voice Status
  let voiceStatusText = '❌ Tidak Tersambung';
  if (guild) {
    const conn = getVoiceConnection(guild.id);
    if (conn && conn.joinConfig && conn.joinConfig.channelId) {
      const vChan = guild.channels.cache.get(conn.joinConfig.channelId);
      voiceStatusText = `🟢 Online di **${vChan ? vChan.name : conn.joinConfig.channelId}**`;
    }
  }

  // Member stats
  const totalMembers = guild ? guild.memberCount : client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0);
  const totalGuilds = client.guilds.cache.size;

  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle(`⚡ LIVE MONITORING DASHBOARD: ${client.user.username.toUpperCase()}`)
    .setDescription('Panel ini terupdate secara **real-time otomatis** untuk memantau performa bot dan sistem VPS 24/7.')
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { 
        name: '📡 Koneksi & Latency', 
        value: `• WebSocket: \`${pingWs} ms\` (${pingStatus})\n• Gateway Status: \`Online 24/7\``, 
        inline: true 
      },
      { 
        name: '⏱️ Uptime 24 Jam', 
        value: `• Durasi Aktif: \`${uptimeStr}\`\n• Auto-Restart: \`Aktif (PM2)\``, 
        inline: true 
      },
      { 
        name: '🎙️ Status AFK Voice', 
        value: `${voiceStatusText}`, 
        inline: false 
      },
      { 
        name: '💾 Penggunaan RAM Bot', 
        value: `• RAM Bot: \`${ramBotMB} MB\`\n• Limit PM2: \`500 MB\``, 
        inline: true 
      },
      { 
        name: '🖥️ Status Host VPS', 
        value: `• RAM VPS: \`${usedSysMemMB} MB / ${totalSysMemMB} MB\` (${ramUsagePercent}%)\n• CPU Core: \`${os.cpus().length} Core\``, 
        inline: true 
      },
      { 
        name: '🌐 Cakupan Komunitas', 
        value: `• Member Server: \`${totalMembers} Pengguna\`\n• Total Server: \`${totalGuilds} Server\``, 
        inline: false 
      }
    )
    .setFooter({ text: `Auto-Update Real-time • Terakhir diperbarui` })
    .setTimestamp();

  return embed;
}

function generateButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_dashboard_refresh')
      .setLabel('🔄 Refresh Sekarang')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_dashboard_ping')
      .setLabel('🏓 Cek Latency')
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('livedashboard')
    .setDescription('Membuat panel live monitoring status bot & VPS real-time 24/7 di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const embed = generateDashboardEmbed(client, interaction.guild);
    const buttons = generateButtons();

    const panelMessage = await interaction.channel.send({
      embeds: [embed],
      components: [buttons]
    });

    const config = loadLiveConfig();
    config[interaction.guild.id] = {
      channelId: interaction.channel.id,
      messageId: panelMessage.id,
      createdAt: new Date().toISOString()
    };
    saveLiveConfig(config);

    return interaction.reply({
      content: '✅ **Live Dashboard berhasil dipasang!** Panel akan terupdate otomatis setiap 10 detik.',
      ephemeral: true
    });
  },
  init(client) {
    const updateDashboards = async () => {
      const config = loadLiveConfig();
      const entries = Object.entries(config);
      if (!entries.length) return;

      for (const [guildId, panelData] of entries) {
        try {
          const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
          if (!guild) continue;

          const channel = guild.channels.cache.get(panelData.channelId) || await guild.channels.fetch(panelData.channelId).catch(() => null);
          if (!channel || !channel.isTextBased()) continue;

          const message = await channel.messages.fetch(panelData.messageId).catch(() => null);
          if (!message) {
            delete config[guildId];
            saveLiveConfig(config);
            continue;
          }

          const embed = generateDashboardEmbed(client, guild);
          const buttons = generateButtons();
          await message.edit({ embeds: [embed], components: [buttons] });
        } catch (err) {}
      }
    };

    client.once('clientReady', () => {
      setInterval(updateDashboards, 10000);
      console.log('✅ Real-time Live Dashboard watcher aktif!');
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'btn_dashboard_refresh') {
        const embed = generateDashboardEmbed(client, interaction.guild);
        const buttons = generateButtons();
        await interaction.update({ embeds: [embed], components: [buttons] }).catch(() => {});
      }

      if (interaction.customId === 'btn_dashboard_ping') {
        const pingWs = client.ws.ping;
        await interaction.reply({
          content: `🏓 **Ping WebSocket Discord:** \`${pingWs} ms\` | **Status:** ${pingWs < 150 ? '🟢 Normal' : '🟡 Agak Lambat'}`,
          ephemeral: true
        });
      }
    });
  }
};
