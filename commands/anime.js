const fetch = require('node-fetch');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!anime')) {
      const query = message.content.trim().split(/\s+/).slice(1).join(' ');
      if (!query) {
        return message.reply('❌ Masukkan judul anime yang ingin dicari. Contoh: `!anime Naruto` atau `!anime Frieren`');
      }

      try {
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json.data || !json.data.length) {
          return message.reply(`❌ Anime dengan judul **"${query}"** tidak ditemukan di database MyAnimeList.`);
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
          .setColor(0x2E51A2) // MyAnimeList Blue
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

        return message.reply({ embeds: [embed], components: [row] });
      } catch (err) {
        console.error('[AnimeAPI] Error:', err);
        return message.reply('❌ Terjadi kesalahan saat mencari anime ke MyAnimeList API.');
      }
    }
  });
};
