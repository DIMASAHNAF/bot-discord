const fetch = require('node-fetch');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!steam')) return;

    const args = message.content.split(' ').slice(1);
    if (!args.length) return message.reply('❌ Masukkan nama game yang ingin dicari.');

    const gameName = args.join(' ');

    try {
      const searchRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`);
      const searchData = await searchRes.json();

      if (!searchData.length) return message.reply('❌ Game tidak ditemukan di Steam.');

      const appId = searchData[0].appid;

      const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=ID`);
      const detailData = await detailRes.json();
      const gameData = detailData[appId].data;

      if (!gameData) return message.reply('❌ Gagal mengambil detail game.');

      const harga = gameData.is_free ? 'Gratis' :
        gameData.price_overview ? gameData.price_overview.final_formatted : 'Tidak tersedia';

      const embed = {
        color: 0x0099ff,
        title: `${gameData.name}`,
        url: `https://store.steampowered.com/app/${appId}`,
        description: gameData.short_description || 'Tidak ada deskripsi.',
        thumbnail: { url: gameData.header_image },
        fields: [
          { name: 'Harga', value: harga, inline: true },
          { name: 'Genre', value: gameData.genres?.map(g => g.description).join(', ') || 'Tidak diketahui', inline: true },
        ],
      };

      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply('❌ Terjadi kesalahan saat mengambil data dari Steam.');
    }
  });
};
