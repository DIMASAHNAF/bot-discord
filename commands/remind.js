const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Memasang alarm pengingat otomatis')
    .addStringOption(opt =>
      opt.setName('waktu')
        .setDescription('Durasi waktu pengingat (contoh: 30s, 10m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('pesan')
        .setDescription('Pesan yang ingin diingatkan')
        .setRequired(true)
    ),
  async execute(interaction) {
    const timeInput = interaction.options.getString('waktu');
    const reminderText = interaction.options.getString('pesan');

    const match = timeInput.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return interaction.reply({
        content: '❌ Format waktu tidak valid! Gunakan angka diikuti s (detik), m (menit), h (jam), atau d (hari). Contoh: `15m`, `1h`.',
        ephemeral: true
      });
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    let ms = 0;
    if (unit === 's') ms = value * 1000;
    else if (unit === 'm') ms = value * 60 * 1000;
    else if (unit === 'h') ms = value * 60 * 60 * 1000;
    else if (unit === 'd') ms = value * 24 * 60 * 60 * 1000;

    if (ms > 7 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: '❌ Waktu pengingat maksimal adalah 7 hari.',
        ephemeral: true
      });
    }

    const targetTimestamp = Math.floor((Date.now() + ms) / 1000);

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle('⏰ Pengingat Disetel!')
      .setDescription(`Bot akan mengingatkan kamu tentang:\n> **${reminderText}**\n\nWaktu: <t:${targetTimestamp}:R> (<t:${targetTimestamp}:T>)`)
      .setFooter({ text: 'Kami akan me-mention kamu tepat waktu' });

    await interaction.reply({ embeds: [confirmEmbed] });

    setTimeout(async () => {
      const reminderEmbed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('🔔 WAKTU PENGINGAT TIBA!')
        .setDescription(`Halo <@${interaction.user.id}>, kamu meminta pengingat:\n\n> **${reminderText}**`)
        .setFooter({ text: 'Pengingat selesai' })
        .setTimestamp();

      try {
        await interaction.channel.send({ content: `<@${interaction.user.id}>`, embeds: [reminderEmbed] });
      } catch (e) {
        interaction.user.send({ embeds: [reminderEmbed] }).catch(() => {});
      }
    }, ms);
  }
};
