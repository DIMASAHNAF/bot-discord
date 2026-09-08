const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!gempa') {
      try {
        const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        const json = await res.json();

        if (!json || !json.Infogempa || !json.Infogempa.gempa) {
          return message.reply('❌ Gagal mendapatkan data gempa terkini dari server BMKG.');
        }

        const g = json.Infogempa.gempa;
        const shakemapUrl = `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`;

        const embed = new EmbedBuilder()
          .setColor(0xFF3333)
          .setTitle('🌋 Info Gempa Bumi Terkini — BMKG Indonesia')
          .setDescription(`**Wilayah:** ${g.Wilayah}`)
          .addFields(
            { name: '💥 Magnitudo', value: `\`${g.Magnitude} SR\``, inline: true },
            { name: '🌊 Kedalaman', value: `\`${g.Kedalaman}\``, inline: true },
            { name: '📍 Koordinat', value: `\`${g.Coordinates}\``, inline: true },
            { name: '📅 Waktu Gempa', value: `${g.Tanggal} — ${g.Jam}`, inline: true },
            { name: '⚠️ Potensi', value: `**${g.Potensi}**`, inline: true },
            { name: '👥 Dirasakan (MMI)', value: g.Dirasakan || 'Tidak ada laporan spesifik', inline: true }
          )
          .setImage(shakemapUrl)
          .setFooter({ text: 'Sumber Resmi: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)', iconURL: 'https://bmkg.go.id/asset/img/logo/logo-bmkg.png' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (err) {
        console.error('[GempaAPI] Error:', err);
        return message.reply('❌ Terjadi kendala saat menghubungi server data BMKG.');
      }
    }
  });
};
