const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!cuaca') || message.content.startsWith('!weather')) {
      const city = message.content.trim().split(/\s+/).slice(1).join(' ');
      if (!city) {
        return message.reply('❌ Masukkan nama kota yang ingin dicek cuacanya. Contoh: `!cuaca Jakarta` atau `!cuaca Surabaya`');
      }

      try {
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'DiscordBot' }
        });
        const data = await res.json();

        if (!data || !data.current_condition || !data.current_condition.length) {
          return message.reply(`❌ Data cuaca untuk kota **"${city}"** tidak ditemukan.`);
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

        return message.reply({ embeds: [embed] });
      } catch (err) {
        console.error('[CuacaAPI] Error:', err);
        return message.reply('❌ Gagal mengambil data cuaca. Periksa kembali ejaan nama kota.');
      }
    }
  });
};
