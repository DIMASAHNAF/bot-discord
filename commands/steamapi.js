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
    .setName('steam')
    .setDescription('Cari harga dan info game Steam Store')
    .addStringOption(opt =>
      opt.setName('game')
        .setDescription('Judul game Steam yang ingin dicari (contoh: Dota 2, Cyberpunk 2077)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const gameName = interaction.options.getString('game');
    await interaction.deferReply();

    try {
      const searchRes = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`);
      const searchData = await searchRes.json();

      if (!Array.isArray(searchData) || !searchData.length) {
        return interaction.editReply(`❌ Game **"${gameName}"** tidak ditemukan di Steam.`);
      }

      const appId = searchData[0].appid;

      const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=ID&l=indonesian`);
      const detailData = await detailRes.json();

      if (!detailData[appId] || !detailData[appId].success || !detailData[appId].data) {
        return interaction.editReply('❌ Gagal mengambil detail informasi game dari Steam API.');
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

      let cleanDesc = (gameData.short_description || 'Tidak ada deskripsi singkat.')
        .replace(/<[^>]*>?/gm, '');
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.slice(0, 247) + '...';
      }

      const embed = new EmbedBuilder()
        .setColor(0x1B2838)
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

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[SteamAPI] Error:', err);
      return interaction.editReply('❌ Terjadi kendala saat menghubungi Steam API.');
    }
  }
};
