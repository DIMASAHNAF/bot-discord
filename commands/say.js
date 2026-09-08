const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!say')) {
      // Izinkan jika user memiliki izin ManageMessages atau Administrator
      const hasPermission = message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
                            message.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!hasPermission) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Messages** atau **Administrator** untuk menggunakan perintah ini.');
      }

      const text = message.content.trim().split(/\s+/).slice(1).join(' ');
      if (!text) {
        return message.reply('❌ Masukkan teks yang ingin diucapkan oleh bot. Contoh: `!say Halo semua, selamat datang!`');
      }

      // Hapus pesan command dari user agar chat terlihat bersih
      try {
        await message.delete();
      } catch {}

      // Kirim pesan dengan proteksi anti-mass-ping jika bukan admin penuh
      const canMentionEveryone = message.member.permissions.has(PermissionFlagsBits.MentionEveryone);

      await message.channel.send({
        content: text,
        allowedMentions: canMentionEveryone ? undefined : { parse: ['users'] },
      });
    }
  });
};
