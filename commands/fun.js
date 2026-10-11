const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const rollCommand = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Kocok dadu angka acak')
    .addIntegerOption(opt =>
      opt.setName('max')
        .setDescription('Batas maksimal angka dadu (default: 100, maks: 1.000.000)')
        .setMinValue(2)
        .setMaxValue(1000000)
        .setRequired(false)
    ),
  async execute(interaction) {
    const max = interaction.options.getInteger('max') || 100;
    const result = Math.floor(Math.random() * max) + 1;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎲 Kocok Dadu!')
      .setDescription(`Hasil lemparan dadu (1 - ${max.toLocaleString()}): **${result.toLocaleString()}**`)
      .setFooter({ text: `Dilempar oleh ${interaction.user.username}` });

    return interaction.reply({ embeds: [embed] });
  }
};

const flipCommand = {
  data: new SlashCommandBuilder()
    .setName('flip')
    .setDescription('Lempar koin keberuntungan (Heads atau Tails)'),
  async execute(interaction) {
    const isHeads = Math.random() < 0.5;
    const result = isHeads ? '🪙 Gambar (Heads)' : '🪙 Angka (Tails)';

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('🪙 Lempar Koin!')
      .setDescription(`Koin berputar di udara dan mendarat pada:\n# **${result}**`)
      .setFooter({ text: `Dilempar oleh ${interaction.user.username}` });

    return interaction.reply({ embeds: [embed] });
  }
};

const eightBallCommand = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Tanyakan sesuatu ke bola ramalan ajaib Magic 8-Ball')
    .addStringOption(opt =>
      opt.setName('pertanyaan')
        .setDescription('Pertanyaan yang ingin kamu tanyakan')
        .setRequired(true)
    ),
  async execute(interaction) {
    const question = interaction.options.getString('pertanyaan');

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
      .setFooter({ text: `Penanya: ${interaction.user.username}` });

    return interaction.reply({ embeds: [embed] });
  }
};

module.exports = {
  commands: [rollCommand, flipCommand, eightBallCommand]
};
