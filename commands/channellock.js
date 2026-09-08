const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // 1. Command: !lock
    if (message.content === '!lock') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Channels** untuk mengunci channel.');
      }

      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: false,
        });

        return message.channel.send('🔒 **Channel ini telah dikunci!** Member biasa tidak dapat mengirim pesan sampai dibuka kembali.');
      } catch (err) {
        console.error('[Lock] Error:', err);
        return message.reply('❌ Gagal mengunci channel. Pastikan posisi role bot memiliki izin Manage Channels.');
      }
    }

    // 2. Command: !unlock
    if (message.content === '!unlock') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Channels** untuk membuka kunci channel.');
      }

      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: null, // Reset ke default
        });

        return message.channel.send('🔓 **Channel telah dibuka kembali!** Member sudah dapat mengirim pesan secara normal.');
      } catch (err) {
        console.error('[Unlock] Error:', err);
        return message.reply('❌ Gagal membuka kunci channel.');
      }
    }

    // 3. Command: !slowmode <detik>
    if (message.content.startsWith('!slowmode')) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Channels** untuk mengatur slowmode.');
      }

      const args = message.content.trim().split(/\s+/);
      const seconds = parseInt(args[1], 10);

      if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return message.reply('❌ Masukkan angka detik slowmode antara **0 sampai 21600 detik** (0 = matikan slowmode). Contoh: `!slowmode 5`');
      }

      try {
        await message.channel.setRateLimitPerUser(seconds);
        if (seconds === 0) {
          return message.channel.send('⚡ **Slowmode telah dinonaktifkan.**');
        } else {
          return message.channel.send(`⏱️ **Slowmode telah disetel:** Jeda antar pesan **${seconds} detik**.`);
        }
      } catch (err) {
        console.error('[Slowmode] Error:', err);
        return message.reply('❌ Gagal mengatur slowmode channel.');
      }
    }
  });
};
