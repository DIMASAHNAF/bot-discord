const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Mengirim pesan teks melalui bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('pesan')
        .setDescription('Pesan yang ingin disampaikan oleh bot')
        .setRequired(true)
    ),
  async execute(interaction) {
    const text = interaction.options.getString('pesan');
    const canMentionEveryone = interaction.member.permissions.has(PermissionFlagsBits.MentionEveryone);

    await interaction.channel.send({
      content: text,
      allowedMentions: canMentionEveryone ? undefined : { parse: ['users'] },
    });

    return interaction.reply({
      content: '✅ Pesan berhasil dikirim.',
      ephemeral: true
    });
  }
};
