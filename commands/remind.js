const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!remind')) {
      const args = message.content.trim().split(/\s+/).slice(1);
      const timeInput = args[0];
      const reminderText = args.slice(1).join(' ');

      if (!timeInput || !reminderText) {
        return message.reply(
          '❌ **Format salah!**\n' +
          'Gunakan: `!remind <waktu> <pesan>`\n' +
          'Contoh:\n' +
          '• `!remind 10m Masak mie instan`\n' +
          '• `!remind 1h Sholat Dzuhur`\n' +
          '• `!remind 30s Cek pesan`\n' +
          '*(Satuan: s = detik, m = menit, h = jam, d = hari)*'
        );
      }

      // Parsing waktu (cth: 10m, 2h, 30s)
      const match = timeInput.match(/^(\d+)([smhd])$/i);
      if (!match) {
        return message.reply('❌ Format waktu tidak valid! Gunakan angka diikuti s/m/h/d (contoh: `15m`, `1h`).');
      }

      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      let ms = 0;
      if (unit === 's') ms = value * 1000;
      else if (unit === 'm') ms = value * 60 * 1000;
      else if (unit === 'h') ms = value * 60 * 60 * 1000;
      else if (unit === 'd') ms = value * 24 * 60 * 60 * 1000;

      // Batasi maksimal 7 hari
      if (ms > 7 * 24 * 60 * 60 * 1000) {
        return message.reply('❌ Waktu pengingat maksimal adalah 7 hari.');
      }

      const targetTimestamp = Math.floor((Date.now() + ms) / 1000);

      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00FF88)
        .setTitle('⏰ Pengingat Disetel!')
        .setDescription(`Bot akan mengingatkan kamu tentang:\n> **${reminderText}**\n\nWaktu: <t:${targetTimestamp}:R> (<t:${targetTimestamp}:T>)`)
        .setFooter({ text: 'Kami akan me-mention kamu tepat waktu' });

      await message.reply({ embeds: [confirmEmbed] });

      setTimeout(async () => {
        const reminderEmbed = new EmbedBuilder()
          .setColor(0xFFA500)
          .setTitle('🔔 WAKTU PENGINGAT TIBA!')
          .setDescription(`Halo <@${message.author.id}>, kamu meminta pengingat:\n\n> **${reminderText}**`)
          .setFooter({ text: 'Pengingat selesai' })
          .setTimestamp();

        try {
          await message.channel.send({ content: `<@${message.author.id}>`, embeds: [reminderEmbed] });
        } catch (e) {
          // Jika channel sudah dihapus, coba kirim ke DM
          message.author.send({ embeds: [reminderEmbed] }).catch(() => {});
        }
      }, ms);
    }
  });
};
