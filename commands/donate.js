const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = (client) => {
  const allowedRoleId = '1431543439895560319'; // Ganti dengan role ID admin kamu

  client.on('messageCreate', async (message) => {
    if (message.content === '!donate') {
      if (!message.member.roles.cache.has(allowedRoleId)) {
        return message.reply('❌ Hanya anggota dengan role admin yang dapat menggunakan perintah ini.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('💸 Donasi ke Komunitas Kami!')
        .setDescription(
          'Terima kasih atas niat baik Anda untuk mendukung komunitas kami. Silakan pilih metode pembayaran di bawah untuk berdonasi.\n\n*Disclaimer: Tidak ada paksaan untuk berdonasi. Dana akan digunakan untuk kebutuhan server.*'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('donate_button')
          .setLabel('Pilih Metode Pembayaran')
          .setStyle(ButtonStyle.Primary)
      );

      await message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'donate_button') {
      await interaction.deferUpdate();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('payment_method')
        .setPlaceholder('Pilih Metode Pembayaran')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Dana').setValue('dana'),
          new StringSelectMenuOptionBuilder().setLabel('GoPay').setValue('gopay')
        );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        content: 'Silakan pilih metode pembayaran Anda:',
        components: [selectRow],
      });
    }

    if (interaction.customId === 'payment_method') {
      await interaction.deferReply({ ephemeral: true });

      const choice = interaction.values[0];

      const embed = new EmbedBuilder()
        .setTitle(`📲 Donasi via ${choice === 'dana' ? 'Dana' : 'GoPay'}`)
        .setColor(choice === 'dana' ? 0x0088FF : 0x00AAFF)
        .setDescription(
          `Nomor ${choice === 'dana' ? 'Dana' : 'GoPay'}: **0831xxxxxx66**\nScan QRIS di bawah ini untuk berdonasi via ${choice === 'dana' ? 'Dana' : 'GoPay'}.`
        )
        .setImage(
          'https://media.discordapp.net/attachments/1055410002682195968/1392205505341947944/shareqr.png?ex=688dab2a&is=688c59aa&hm=977705760996ed2b73b7eb139dba7d6ac87b573634fd3fa8ac11263884eca855&=&format=webp&quality=lossless&width=796&height=930'
        );

      await interaction.editReply({ embeds: [embed] });
    }
  });
};
