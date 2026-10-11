const fetch = require('node-fetch');
const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Cari info anime dari database MyAnimeList')
    .addStringOption(opt =>
      opt.setName('judul')
        .setDescription('Judul anime yang ingin dicari (contoh: Naruto, Frieren)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('judul');
    await interaction.deferReply();

    try {
      const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.data || !json.data.length) {
        return interaction.editReply(`❌ Anime dengan judul **"${query}"** tidak ditemukan di MyAnimeList.`);
      }

      const anime = json.data[0];
      const title = anime.title_english || anime.title;
      const score = anime.score ? `⭐ ${anime.score}/10` : 'Belum Ada Rating';
      const episodes = anime.episodes ? `${anime.episodes} Episode` : 'Masih Berlanjut / Belum Diketahui';
      const status = anime.status || 'Tidak Diketahui';
      const genres = anime.genres?.map((g) => g.name).join(', ') || 'Umum';
      const studio = anime.studios?.map((s) => s.name).join(', ') || 'Tidak Diketahui';

      let synopsis = anime.synopsis || 'Tidak ada sinopsis tersedia.';
      if (synopsis.length > 300) {
        synopsis = synopsis.slice(0, 297) + '...';
      }

      const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

      const embed = new EmbedBuilder()
        .setColor(0x2E51A2)
        .setTitle(`⛩️ ${title}`)
        .setURL(anime.url)
        .setDescription(synopsis)
        .addFields(
          { name: '⭐ Rating', value: `\`${score}\``, inline: true },
          { name: '📺 Episode', value: `\`${episodes}\``, inline: true },
          { name: '📡 Status', value: `\`${status}\``, inline: true },
          { name: '🏢 Studio', value: studio, inline: true },
          { name: '🏷️ Genre', value: genres, inline: true },
          { name: '📅 Musim', value: anime.season ? `${anime.season.toUpperCase()} ${anime.year || ''}` : '-', inline: true }
        )
        .setImage(posterUrl)
        .setFooter({ text: 'Data dari MyAnimeList (Jikan API)', iconURL: 'https://cdn.myanimelist.net/images/favicon.ico' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Lihat di MyAnimeList')
          .setURL(anime.url)
          .setStyle(ButtonStyle.Link)
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[AnimeAPI] Error:', err);
      return interaction.editReply('❌ Terjadi kesalahan saat mencari anime ke MyAnimeList API.');
    }
  }
};
