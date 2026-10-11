const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version: djsVersion } = require('discord.js');
const os = require('os');

function createBotInfoEmbed(client) {
  const uptimeSec = Math.floor(process.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeStr = `${days}h ${hours}j ${minutes}m ${seconds}s`;

  // Memory VPS & Bot
  const ramUsedMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const totalSysMemMB = (os.totalmem() / 1024 / 1024).toFixed(0);
  const freeSysMemMB = (os.freemem() / 1024 / 1024).toFixed(0);
  const vpsRamUsed = (totalSysMemMB - freeSysMemMB);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🤖 Informasi Sistem: ${client.user.username}`)
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '⏱️ Uptime Bot', value: `\`${uptimeStr}\``, inline: true },
      { name: '📶 WebSocket Ping', value: `\`${client.ws.ping} ms\``, inline: true },
      { name: '💾 RAM Bot', value: `\`${ramUsedMB} MB\``, inline: true },
      { name: '🖥️ RAM VPS Host', value: `\`${vpsRamUsed} MB / ${totalSysMemMB} MB\``, inline: true },
      { name: '🌐 Server Dilayani', value: `\`${client.guilds.cache.size} Server\``, inline: true },
      { name: '👥 Total User', value: `\`${client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0)} User\``, inline: true },
      { name: '⚙️ Node.js', value: `\`${process.version}\``, inline: true },
      { name: '📦 Discord.js', value: `\`v${djsVersion}\``, inline: true },
      { name: '🐧 OS VPS', value: `\`${os.type()} (${os.arch()})\``, inline: true }
    )
    .setFooter({ text: 'Dibuat untuk melayani Tuan Muda Hotwill • Klik refresh untuk data terkini' })
    .setTimestamp();

  return embed;
}

const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek latency bot dan kecepatan WebSocket Discord'),
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Mengukur latency...', fetchReply: true });
    const pingRoundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const pingWs = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(pingWs < 150 ? 0x00FF88 : 0xFFA500)
      .setTitle('🏓 Pong! Status Latency')
      .addFields(
        { name: '📡 Bot Latency', value: `\`${pingRoundtrip} ms\``, inline: true },
        { name: '💓 WebSocket Discord', value: `\`${pingWs} ms\``, inline: true }
      )
      .setTimestamp();

    return interaction.editReply({ content: null, embeds: [embed] });
  }
};

const botinfoCommand = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Melihat uptime bot, spesifikasi, dan pemakaian RAM VPS secara real-time'),
  async execute(interaction, client) {
    const embed = createBotInfoEmbed(client);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_botinfo_refresh')
        .setLabel('🔄 Refresh Info')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};

module.exports = {
  commands: [pingCommand, botinfoCommand],
  init(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === 'btn_botinfo_refresh') {
        const embed = createBotInfoEmbed(client);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_botinfo_refresh')
            .setLabel('🔄 Refresh Info')
            .setStyle(ButtonStyle.Primary)
        );
        await interaction.update({ embeds: [embed], components: [row] }).catch(() => {});
      }
    });
  }
};
