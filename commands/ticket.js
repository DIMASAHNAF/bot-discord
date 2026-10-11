const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Memunculkan panel pembuatan tiket bantuan interaktif di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎫 Pusat Bantuan & Layanan Tiket')
      .setDescription(
        'Butuh bantuan tim Staff, ingin lapor masalah, atau klaim donasi/giveaway?\n\n' +
        'Klik tombol **Buka Tiket** di bawah ini untuk membuat ruang obrolan pribadi dengan tim Staff.'
      )
      .setFooter({ text: 'Sistem Tiket Otomatis' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket_btn')
        .setLabel('Buka Tiket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({
      content: '✅ Panel tiket bantuan berhasil dimunculkan.',
      ephemeral: true
    });
  },
  init(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton() || !interaction.guild) return;

      // 1. Klik Buka Tiket
      if (interaction.customId === 'create_ticket_btn') {
        const guild = interaction.guild;
        const user = interaction.user;

        const existingChannel = guild.channels.cache.find(
          (c) => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        );

        if (existingChannel) {
          return interaction.reply({
            content: `❌ Kamu sudah memiliki tiket yang sedang terbuka di <#${existingChannel.id}>.`,
            ephemeral: true,
          });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              {
                id: client.user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageChannels,
                ],
              },
            ],
          });

          const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00FF88)
            .setTitle(`🎫 Tiket Bantuan: ${user.username}`)
            .setDescription(
              `Halo <@${user.id}>! Selamat datang di tiket bantuan kamu.\n` +
              'Silakan sampaikan pertanyaan, laporan, atau keperluan kamu secara jelas di sini.\n\n' +
              'Staff kami akan segera merespon pesanmu.'
            )
            .setFooter({ text: 'Klik tombol di bawah jika urusan telah selesai' });

          const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket_btn')
              .setLabel('Tutup Tiket')
              .setEmoji('🔒')
              .setStyle(ButtonStyle.Danger)
          );

          await ticketChannel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [closeRow] });

          return interaction.editReply({
            content: `✅ Tiket kamu berhasil dibuat di <#${ticketChannel.id}>!`,
          });
        } catch (err) {
          console.error('[Ticket] Error create:', err);
          return interaction.editReply({
            content: '❌ Gagal membuat channel tiket. Pastikan bot memiliki izin Manage Channels.',
          });
        }
      }

      // 2. Klik Tutup Tiket
      if (interaction.customId === 'close_ticket_btn') {
        await interaction.reply('🔒 Tiket ini akan ditutup dan dihapus dalam **5 detik**...');
        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (e) {
            console.error('[Ticket] Error delete channel:', e);
          }
        }, 5000);
      }
    });
  }
};
