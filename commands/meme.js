const fetch = require('node-fetch');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!meme') {
      try {
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();

        if (!data || !data.url) {
          return message.reply('❌ Gagal mengambil meme saat ini. Coba lagi dalam beberapa saat.');
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

        return message.reply({ embeds: [embed], components: [row] });
      } catch (err) {
        console.error('[MemeAPI] Error:', err);
        return message.reply('❌ Terjadi kesalahan saat memuat meme.');
      }
    }
  });
};
