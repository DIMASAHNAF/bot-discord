const fetch = require('node-fetch');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith('!steam')) return;

    const args = message.content.trim().split(/\s+/).slice(1);
    if (!args.length) {
      return message.reply('❌ Masukkan judul game Steam yang ingin dicari. Contoh: `!steam Dota 2` atau `!steam Cyberpunk 2077`');
    }

    const gameName = args.join(' ');

    try {
      const searchRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`);
      const searchData = await searchRes.json();

      if (!Array.isArray(searchData) || !searchData.length) {
        return message.reply(`❌ Game **"${gameName}"** tidak ditemukan di Steam.`);
      }

      const appId = searchData[0].appid;

      const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=ID&l=indonesian`);
      const detailData = await detailRes.json();

      if (!detailData[appId] || !detailData[appId].success || !detailData[appId].data) {
        return message.reply('❌ Gagal mengambil detail informasi game dari Steam API.');
      }

      const gameData = detailData[appId].data;

      let harga = 'Gratis';
      if (!gameData.is_free) {
        harga = gameData.price_overview ? gameData.price_overview.final_formatted : 'Harga Belum Tersedia';
      }

      const genres = gameData.genres?.map(g => g.description).join(', ') || 'Umum';
      const developers = gameData.developers?.join(', ') || 'Tidak Diketahui';
      const releaseDate = gameData.release_date?.date || 'Belum Dirilis';
      const storeUrl = `https://store.steampowered.com/app/${appId}`;

      // Potong deskripsi jika terlalu panjang
      let cleanDesc = (gameData.short_description || 'Tidak ada deskripsi singkat.')
        .replace(/<[^>]*>?/gm, '');
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.slice(0, 247) + '...';
      }

      const embed = new EmbedBuilder()
        .setColor(0x1B2838) // Steam dark blue theme
        .setTitle(`🎮 ${gameData.name}`)
        .setURL(storeUrl)
        .setDescription(cleanDesc)
        .addFields(
          { name: '💰 Harga', value: `\`${harga}\``, inline: true },
          { name: '🏷️ Genre', value: genres, inline: true },
          { name: '📅 Tanggal Rilis', value: releaseDate, inline: true },
          { name: '👨‍💻 Pengembang', value: developers, inline: true },
          { name: '🆔 App ID', value: `\`${appId}\``, inline: true }
        )
        .setImage(gameData.header_image)
        .setFooter({ text: 'Data dari Steam Store API', iconURL: 'https://cdn-icons-png.flaticon.com/512/220/220223.png' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Lihat di Steam Store')
          .setURL(storeUrl)
          .setStyle(ButtonStyle.Link)
      );

      return message.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[SteamAPI] Error:', err);
      return message.reply('❌ Terjadi kendala saat menghubungi Steam API.');
    }
  });
};
