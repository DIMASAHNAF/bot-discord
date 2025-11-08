module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!send')) return;

    const allowedRoleId = '1431543439895560319'; // Ganti dengan role ID kamu

    if (!message.member.roles.cache.has(allowedRoleId)) {
      return message.reply('❌ Kamu tidak memiliki izin untuk menggunakan perintah ini.');
    }

    const args = message.content.trim().split(' ');
    const channelArg = args[1];
    const text = args.slice(2).join(' ');

    if (!channelArg || !text) {
      return message.reply('❌ Format salah. Gunakan: `!send #channel Halo semua!`');
    }

    const targetChannel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(channelArg) ||
      message.guild.channels.cache.find(
        ch => ch.name === channelArg && ch.type === 0
      );

    if (!targetChannel || targetChannel.type !== 0) {
      return message.reply('❌ Channel tidak ditemukan atau bukan channel teks.');
    }

    try {
      await targetChannel.send(text);
      await message.reply(`✅ Pesan berhasil dikirim ke **#${targetChannel.name}**.`);
    } catch (error) {
      console.error(error);
      await message.reply('❌ Gagal mengirim pesan ke channel.');
    }
  });
};
