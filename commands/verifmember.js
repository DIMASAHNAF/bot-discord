const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  PermissionFlagsBits 
} = require('discord.js');

const MEMBER_ROLE_ID = '1431543439882981479';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verif')
    .setDescription('Memunculkan panel tombol verifikasi otomatis untuk member baru')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle('🛡️ Verifikasi Member Server')
      .setDescription(
        'Selamat datang di server kami!\n\n' +
        'Silakan klik tombol **Verifikasi Sekarang** di bawah ini untuk membuka akses penuh ke seluruh channel teks & suara.'
      )
      .setFooter({ text: 'Sistem Verifikasi Otomatis' });

    const button = new ButtonBuilder()
      .setCustomId('verify_member_button')
      .setLabel('Verifikasi Sekarang')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({
      content: '✅ Panel verifikasi berhasil dimunculkan di channel ini.',
      ephemeral: true
    });
  },
  init(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton() || interaction.customId !== 'verify_member_button') return;

      const guild = interaction.guild;
      const member = interaction.member;

      let role = guild.roles.cache.get(MEMBER_ROLE_ID);
      if (!role) {
        role = guild.roles.cache.find(r => r.name.toLowerCase() === 'member');
      }

      if (!role) {
        return interaction.reply({
          content: '❌ Role verifikasi tidak ditemukan di server ini. Hubungi admin server.',
          ephemeral: true,
        });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: '✅ Kamu sudah memiliki role Member dan telah diverifikasi sebelumnya.',
          ephemeral: true,
        });
      }

      if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: '❌ Bot kekurangan izin **Manage Roles**. Harap hubungi Admin server.',
          ephemeral: true,
        });
      }

      try {
        await member.roles.add(role);
        return interaction.reply({
          content: `🎉 Selamat! Kamu berhasil diverifikasi dan mendapatkan role **${role.name}**!`,
          ephemeral: true,
        });
      } catch (err) {
        console.error('[VerifMember] Error:', err);
        return interaction.reply({
          content: '❌ Gagal memberikan role. Pastikan posisi role bot berada di atas role Member pada pengaturan server.',
          ephemeral: true,
        });
      }
    });
  }
};
