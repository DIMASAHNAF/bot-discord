const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith('!send')) return;

    const allowedRoleId = '1431543439895560319'; // Role khusus admin / broadcast

    const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                          message.member.roles.cache.has(allowedRoleId);

    if (!hasPermission) {
      return message.reply('❌ Kamu tidak memiliki izin (Administrator / Role Admin) untuk menggunakan perintah broadcast ini.');
    }

    const args = message.content.trim().split(/\s+/);
    const channelArg = args[1];
    const text = args.slice(2).join(' ');

    if (!channelArg || !text) {
      return message.reply('❌ **Format salah!**\nContoh penggunaan: `!send #pengumuman Halo warga server!` atau `!send <ID_CHANNEL> Teks pesan`');
    }

    const cleanChannelId = channelArg.replace(/[<#>]/g, '');

    const targetChannel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(cleanChannelId) ||
      message.guild.channels.cache.find(
        (ch) => ch.name.toLowerCase() === channelArg.toLowerCase() && ch.isTextBased()
      );

    if (!targetChannel || !targetChannel.isTextBased()) {
      return message.reply('❌ Channel target tidak ditemukan atau bukan channel teks.');
    }

    try {
      await targetChannel.send({
        content: text,
      });

      return message.reply(`✅ Pesan berhasil dikirim ke **#${targetChannel.name}**.`);
    } catch (error) {
      console.error('[Send] Error:', error);
      return message.reply('❌ Gagal mengirim pesan ke channel tersebut. Pastikan bot memiliki izin kirim pesan di sana.');
    }
  });
};
