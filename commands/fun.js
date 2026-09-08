const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // 1. Command: !roll [max]
    if (message.content.startsWith('!roll')) {
      const args = message.content.trim().split(/\s+/);
      const max = parseInt(args[1], 10) || 100;

      if (max < 2 || max > 1000000) {
        return message.reply('❌ Angka maksimal dadu harus antara 2 sampai 1.000.000.');
      }

      const result = Math.floor(Math.random() * max) + 1;
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎲 Kocok Dadu!')
        .setDescription(`Hasil lemparan dadu (1 - ${max.toLocaleString()}): **${result.toLocaleString()}**`)
        .setFooter({ text: `Dilempar oleh ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    }

    // 2. Command: !flip (Lempar Koin)
    if (message.content === '!flip') {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? '🪙 Gambar (Heads)' : '🪙 Angka (Tails)';

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('🪙 Lempar Koin!')
        .setDescription(`Koin berputar di udara dan mendarat pada:\n# **${result}**`)
        .setFooter({ text: `Dilempar oleh ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    }

    // 3. Command: !8ball <pertanyaan>
    if (message.content.startsWith('!8ball')) {
      const question = message.content.trim().split(/\s+/).slice(1).join(' ');
      if (!question) {
        return message.reply('❌ Tanyakan sesuatu ke bola ramalan 8-Ball! Contoh: `!8ball Apakah saya ganteng?`');
      }

      const answers = [
        '🟢 Tentu saja, sudah pasti!',
        '🟢 Ya, kemungkinan besar demikian.',
        '🟢 Tanpa ada keraguan sedikit pun.',
        '🟡 Tanda-tanda mengarah ke ya, tapi jangan terlalu yakin.',
        '🟡 Coba tanyakan lagi nanti ya.',
        '🟡 Lebih baik aku tidak memberitahumu sekarang...',
        '🔴 Jangan berharap terlalu banyak.',
        '🔴 Jawabannya adalah tidak.',
        '🔴 Sumberku mengatakan tidak sama sekali.',
        '🔴 Sangat meragukan!'
      ];

      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('🎱 Ramalan Magic 8-Ball')
        .addFields(
          { name: '❓ Pertanyaan', value: question },
          { name: '🔮 Jawaban', value: randomAnswer }
        )
        .setFooter({ text: `Penanya: ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    }
  });
};
