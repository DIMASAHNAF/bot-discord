const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Mengirim pesan siaran / pengumuman ke channel tertentu')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel tujuan pengiriman pesan')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('pesan')
        .setDescription('Isi pesan siaran / pengumuman')
        .setRequired(true)
    ),
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel');
    const text = interaction.options.getString('pesan');

    try {
      await targetChannel.send({ content: text });
      return interaction.reply({
        content: `✅ Pesan berhasil dikirim ke <#${targetChannel.id}>.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('[Send] Error:', error);
      return interaction.reply({
        content: '❌ Gagal mengirim pesan ke channel tersebut. Pastikan bot memiliki izin kirim pesan di sana.',
        ephemeral: true
      });
    }
  }
};
