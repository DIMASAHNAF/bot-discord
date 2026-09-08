const { EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Command: !ping
    if (message.content === '!ping') {
      const sent = await message.reply('🏓 Mengukur latency...');
      const pingRoundtrip = sent.createdTimestamp - message.createdTimestamp;
      const pingWs = client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor(pingWs < 150 ? 0x00FF88 : 0xFFA500)
        .setTitle('🏓 Pong! Status Latency')
        .addFields(
          { name: '📡 Bot Latency', value: `\`${pingRoundtrip} ms\``, inline: true },
          { name: '💓 WebSocket Discord', value: `\`${pingWs} ms\``, inline: true }
        )
        .setTimestamp();

      return sent.edit({ content: null, embeds: [embed] });
    }

    // Command: !botinfo
    if (message.content === '!botinfo') {
      // Hitung Uptime
      const uptimeSec = Math.floor(process.uptime());
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeStr = `${days}h ${hours}j ${minutes}m ${seconds}s`;

      // Memory VPS
      const ramUsedMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
      const totalSysMemMB = (os.totalmem() / 1024 / 1024).toFixed(0);
      const freeSysMemMB = (os.freemem() / 1024 / 1024).toFixed(0);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🤖 Informasi Sistem: ${client.user.username}`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '⏱️ Uptime Bot', value: `\`${uptimeStr}\``, inline: true },
          { name: '📶 WebSocket Ping', value: `\`${client.ws.ping} ms\``, inline: true },
          { name: '💾 RAM Bot', value: `\`${ramUsedMB} MB\``, inline: true },
          { name: '🖥️ RAM VPS Host', value: `\`${(totalSysMemMB - freeSysMemMB)} MB / ${totalSysMemMB} MB\``, inline: true },
          { name: '🌐 Server Dilayani', value: `\`${client.guilds.cache.size} Server\``, inline: true },
          { name: '👥 Total User', value: `\`${client.guilds.cache.reduce((a, b) => a + (b.memberCount || 0), 0)} User\``, inline: true },
          { name: '⚙️ Node.js', value: `\`${process.version}\``, inline: true },
          { name: '📦 Discord.js', value: `\`v${djsVersion}\``, inline: true },
          { name: '🐧 OS VPS', value: `\`${os.type()} (${os.arch()})\``, inline: true }
        )
        .setFooter({ text: 'Dibuat untuk melayani Tuan Muda Hotwill' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  });
};
