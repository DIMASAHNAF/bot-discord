const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const MEMBER_ROLE_ID = '1431543439882981479'; // Ganti dengan ID role Member

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || message.content !== '!verif') return;

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Verifikasi Member')
      .setDescription('Klik tombol di bawah untuk mendapatkan role **Member**.');

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('Verifikasi')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'verify_button') return;

    const member = interaction.member;
    const role = interaction.guild.roles.cache.get(MEMBER_ROLE_ID);

    if (!role) {
      return interaction.reply({
        content: '❌ Role tidak ditemukan. Cek kembali ID role-nya.',
        ephemeral: true,
      });
    }

    if (member.roles.cache.has(MEMBER_ROLE_ID)) {
      return interaction.reply({
        content: '✅ Kamu sudah diverifikasi sebelumnya.',
        ephemeral: true,
      });
    }

    try {
      await member.roles.add(role);
      await interaction.reply({
        content: '🎉 Kamu berhasil diverifikasi dan mendapatkan role Member!',
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ Terjadi kesalahan saat memberikan role.',
        ephemeral: true,
      });
    }
  });
};
