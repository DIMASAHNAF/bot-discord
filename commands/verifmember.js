const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const MEMBER_ROLE_ID = '1431543439882981479'; // Ganti atau fallback ke role bernama "Member"

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!verif') {
      // Hanya Administrator atau yang memiliki izin ManageRoles yang bisa memunculkan panel
      const hasPerm = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                      message.member.permissions.has(PermissionFlagsBits.ManageRoles);

      if (!hasPerm) {
        return message.reply('❌ Hanya Administrator / Moderator yang dapat memunculkan panel verifikasi.');
      }

      // Hapus pesan !verif pemicu
      try { await message.delete(); } catch {}

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

      await message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'verify_member_button') return;

    const guild = interaction.guild;
    const member = interaction.member;

    // Cari role berdasarkan ID atau nama "Member"
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

    // Pastikan bot memiliki izin ManageRoles
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
};
