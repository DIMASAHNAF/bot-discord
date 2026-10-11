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
    .setName('meme')
    .setDescription('Menampilkan meme lucu dan kocak terbaru dari Reddit'),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch('https://meme-api.com/gimme');
      const data = await res.json();

      if (!data || !data.url) {
        return interaction.editReply('❌ Gagal mengambil meme saat ini. Coba lagi dalam beberapa saat.');
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle(`🎭 ${data.title}`)
        .setURL(data.postLink || data.url)
        .setImage(data.url)
        .setFooter({ text: `r/${data.subreddit} • 👍 ${data.ups.toLocaleString()} Upvotes` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Post Asli di Reddit')
          .setURL(data.postLink || data.url)
          .setStyle(ButtonStyle.Link)
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[MemeAPI] Error:', err);
      return interaction.editReply('❌ Terjadi kesalahan saat memuat meme.');
    }
  }
};
