const fetch = require('node-fetch');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gempa')
    .setDescription('Data gempa bumi terkini di Indonesia resmi dari BMKG lengkap dengan peta'),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      const json = await res.json();

      if (!json || !json.Infogempa || !json.Infogempa.gempa) {
        return interaction.editReply('❌ Gagal mendapatkan data gempa terkini dari server BMKG.');
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

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[GempaAPI] Error:', err);
      return interaction.editReply('❌ Terjadi kendala saat menghubungi server data BMKG.');
    }
  }
};
