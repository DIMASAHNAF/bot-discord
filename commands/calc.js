const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!calc')) {
      const expr = message.content.trim().split(/\s+/).slice(1).join(' ');

      if (!expr) {
        return message.reply('❌ Masukkan operasi matematika yang ingin dihitung. Contoh: `!calc (5000 * 12) + 25000`');
      }

      // Validasi karakter aman (hanya angka, spasi, +, -, *, /, %, ^, (, ), .)
      if (!/^[0-9+\-*/%^().\s]+$/.test(expr)) {
        return message.reply('❌ Ekspresi mengandung karakter tidak valid! Hanya diperbolehkan angka dan operator `+ - * / % ^ ( )`.');
      }

      try {
        // Ganti ^ dengan ** untuk pangkat
        const formattedExpr = expr.replace(/\^/g, '**');

        // Evaluasi ekspresi secara terkontrol menggunakan Function constructor dengan nilai numerik terisolasi
        const result = Function(`'use strict'; return (${formattedExpr})`)();

        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
          return message.reply('❌ Hasil perhitungan tidak valid atau menghasilkan angka tak hingga (Infinity).');
        }

        const embed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle('🧮 Kalkulator Cepat')
          .addFields(
            { name: '📥 Soal', value: `\`\`\`${expr}\`\`\`` },
            { name: '📤 Hasil', value: `\`\`\`${result.toLocaleString('id-ID', { maximumFractionDigits: 6 })}\`\`\`` }
          )
          .setFooter({ text: `Dihitung untuk ${message.author.username}` });

        return message.reply({ embeds: [embed] });
      } catch (err) {
        return message.reply('❌ Format matematika salah atau sintaks kurung tidak seimbang.');
      }
    }
  });
};
