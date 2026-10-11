const fetch = require('node-fetch');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cuaca')
    .setDescription('Cek prakiraan cuaca kota di Indonesia atau dunia')
    .addStringOption(opt =>
      opt.setName('kota')
        .setDescription('Nama kota yang ingin dicek (contoh: Jakarta, Surabaya, Tokyo)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const city = interaction.options.getString('kota');
    await interaction.deferReply();

    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DiscordBot' }
      });
      const data = await res.json();

      if (!data || !data.current_condition || !data.current_condition.length) {
        return interaction.editReply(`❌ Data cuaca untuk kota **"${city}"** tidak ditemukan.`);
      }

      const curr = data.current_condition[0];
      const area = data.nearest_area?.[0];
      const areaName = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || '';

      const tempC = curr.temp_C;
      const feelsLikeC = curr.FeelsLikeC;
      const humidity = curr.humidity;
      const windSpeed = curr.windspeedKmph;
      const desc = curr.weatherDesc?.[0]?.value || 'Cerah/Normal';

      const embed = new EmbedBuilder()
        .setColor(0x00A2FF)
        .setTitle(`🌦️ Informasi Cuaca: ${areaName}, ${country}`)
        .setDescription(`Kondisi saat ini: **${desc}**`)
        .addFields(
          { name: '🌡️ Suhu', value: `\`${tempC}°C\` (Terasa \`${feelsLikeC}°C\`)`, inline: true },
          { name: '💧 Kelembaban', value: `\`${humidity}%\``, inline: true },
          { name: '💨 Kecepatan Angin', value: `\`${windSpeed} km/h\``, inline: true }
        )
        .setFooter({ text: 'Data cuaca global real-time' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[CuacaAPI] Error:', err);
      return interaction.editReply('❌ Gagal mengambil data cuaca. Periksa kembali ejaan nama kota.');
    }
  }
};
