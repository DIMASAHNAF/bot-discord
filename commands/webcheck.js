const fetch = require('node-fetch');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('webcheck')
    .setDescription('Memeriksa status online, latency, dan kesehatan website project kamu')
    .addStringOption(opt =>
      opt.setName('url')
        .setDescription('URL website yang ingin dicek (contoh: https://google.com atau domain.com)')
        .setRequired(true)
    ),
  async execute(interaction) {
    let inputUrl = interaction.options.getString('url').trim();
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = 'https://' + inputUrl;
    }

    await interaction.deferReply();

    const startTime = Date.now();
    try {
      const response = await fetch(inputUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'DiscordBot-WebUptimeMonitor/1.0'
        },
        timeout: 10000 // 10 detik timeout
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;
      const statusText = response.statusText;
      const isOk = statusCode >= 200 && statusCode < 400;

      const embed = new EmbedBuilder()
        .setColor(isOk ? 0x00FF88 : 0xFF3366)
        .setTitle(isOk ? '🌐 Website Berjalan Normal (UP)' : '⚠️ Website Mengalami Masalah (DOWN/WARN)')
        .setDescription(`Hasil pemantauan kesehatan untuk URL:\n> **${inputUrl}**`)
        .addFields(
          { 
            name: '📡 Status Kode HTTP', 
            value: `\`${statusCode} ${statusText}\``, 
            inline: true 
          },
          { 
            name: '⚡ Waktu Respons', 
            value: `\`${responseTime} ms\` (${responseTime < 300 ? '🟢 Cepat' : responseTime < 1000 ? '🟡 Cukup' : '🔴 Lambat'})`, 
            inline: true 
          },
          { 
            name: '🔒 Protokol Keamanan', 
            value: inputUrl.startsWith('https://') ? '`HTTPS (Terenkripsi SSL)`' : '`HTTP (Tidak Terenkripsi)`', 
            inline: true 
          }
        )
        .setFooter({ text: `Diperiksa untuk ${interaction.user.username} • Uptime Monitor` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isTimeout = error.type === 'request-timeout' || error.message.includes('timeout');

      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF3333)
        .setTitle('🚨 Peringatan: Website Tidak Dapat Dijangkau (DOWN)')
        .setDescription(`Target URL gagal dihubungi:\n> **${inputUrl}**`)
        .addFields(
          { name: '❌ Pesan Kendala', value: `\`${isTimeout ? 'Request Timeout (10 Detik)' : error.message.slice(0, 200)}\``, inline: false },
          { name: '⏱️ Durasi Pengecekan', value: `\`${responseTime} ms\``, inline: true }
        )
        .setFooter({ text: 'Segera periksa web server atau konfigurasi DNS kamu' })
        .setTimestamp();

      return interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
