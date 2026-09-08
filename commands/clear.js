const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!clear') || message.content.startsWith('!purge')) {
      // Cek izin ManageMessages
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Messages** untuk membersihkan chat.');
      }

      const args = message.content.trim().split(/\s+/);
      const amount = parseInt(args[1], 10);

      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply('❌ Masukkan jumlah pesan yang valid antara **1 sampai 100**. Contoh: `!clear 20`');
      }

      try {
        // Hapus pesan command pemicu terlebih dahulu
        await message.delete().catch(() => {});

        // Bulk delete pesan
        const deleted = await message.channel.bulkDelete(amount, true);

        const notify = await message.channel.send(`🧹 Berhasil menghapus **${deleted.size}** pesan.`);
        // Auto-delete pesan notifikasi setelah 4 detik agar channel tetap bersih
        setTimeout(() => notify.delete().catch(() => {}), 4000);
      } catch (err) {
        console.error('[Clear] Error:', err);
        return message.channel.send('❌ Gagal menghapus pesan. Discord tidak mengizinkan penghapusan pesan yang lebih lama dari 14 hari.');
      }
    }
  });
};
