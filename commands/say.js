module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!say')) {
      const args = message.content.split(' ').slice(1).join(' ');
      if (!args) {
        return message.reply('❌ Kamu harus memberikan pesan untuk dikirim. Contoh: `!say Halo semua!`');
      }

      await message.channel.send(args);
    }
  });
};
