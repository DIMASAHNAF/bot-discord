const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Kalkulator matematika cepat')
    .addStringOption(opt =>
      opt.setName('operasi')
        .setDescription('Operasi matematika (contoh: (5000 * 12) + 25000)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const expr = interaction.options.getString('operasi');

    if (!/^[0-9+\-*/%^().\s]+$/.test(expr)) {
      return interaction.reply({
        content: '❌ Ekspresi mengandung karakter tidak valid! Hanya diperbolehkan angka dan operator `+ - * / % ^ ( )`.',
        ephemeral: true
      });
    }

    try {
      const formattedExpr = expr.replace(/\^/g, '**');
      const result = Function(`'use strict'; return (${formattedExpr})`)();

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return interaction.reply({
          content: '❌ Hasil perhitungan tidak valid atau menghasilkan angka tak hingga (Infinity).',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF88)
        .setTitle('🧮 Kalkulator Cepat')
        .addFields(
          { name: '📥 Soal', value: `\`\`\`${expr}\`\`\`` },
          { name: '📤 Hasil', value: `\`\`\`${result.toLocaleString('id-ID', { maximumFractionDigits: 6 })}\`\`\`` }
        )
        .setFooter({ text: `Dihitung untuk ${interaction.user.username}` });

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({
        content: '❌ Format matematika salah atau sintaks tanda kurung tidak seimbang.',
        ephemeral: true
      });
    }
  }
};
