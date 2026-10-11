const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Membersihkan banyak pesan chat sekaligus (1 - 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('jumlah')
        .setDescription('Jumlah pesan yang ingin dihapus (1 sampai 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('jumlah');

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({
        content: `🧹 Berhasil menghapus **${deleted.size}** pesan di channel ini.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('[Clear] Error:', err);
      return interaction.reply({
        content: '❌ Gagal menghapus pesan. Discord tidak mengizinkan penghapusan pesan yang berusia lebih dari 14 hari.',
        ephemeral: true
      });
    }
  }
};
