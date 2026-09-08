const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!donate')) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF88)
        .setTitle('💸 Dukung & Donasi ke Komunitas Kami!')
        .setDescription(
          'Terima kasih sebesar-besarnya atas niat baik Anda untuk mendukung perkembangan server kami! ✨\n\n' +
          'Dana donasi akan dialokasikan penuh untuk kebutuhan operasional bot, server hosting, dan event komunitas.\n\n' +
          '👇 **Klik tombol atau menu di bawah untuk melihat rekening & QRIS pembayaran.**'
        )
        .setFooter({ text: 'Tidak ada paksaan dalam berdonasi. Terima kasih atas dukungan Anda!' });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('donate_select_menu')
        .setPlaceholder('Pilih Metode Pembayaran (Dana / GoPay / QRIS)')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('DANA')
            .setDescription('Donasi melalui nomor e-wallet DANA')
            .setValue('dana')
            .setEmoji('💙'),
          new StringSelectMenuOptionBuilder()
            .setLabel('GoPay')
            .setDescription('Donasi melalui nomor e-wallet GoPay')
            .setValue('gopay')
            .setEmoji('💚'),
          new StringSelectMenuOptionBuilder()
            .setLabel('QRIS All Payment')
            .setDescription('Scan via BCA, Mandiri, BRI, OVO, ShopeePay, dll.')
            .setValue('qris')
            .setEmoji('📲')
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'donate_select_menu') return;

    const choice = interaction.values[0];

    let title = '📲 Donasi Pembayaran';
    let color = 0x0088FF;
    let desc = '';

    if (choice === 'dana') {
      title = '💙 Donasi via DANA';
      color = 0x0088FF;
      desc = 'Nomor DANA: **0831xxxxxx66**\nAtas Nama: **Komunitas / Owner**\n\n*Silakan scan QRIS atau transfer manual ke nomor di atas.*';
    } else if (choice === 'gopay') {
      title = '💚 Donasi via GoPay';
      color = 0x00AA55;
      desc = 'Nomor GoPay: **0831xxxxxx66**\nAtas Nama: **Komunitas / Owner**\n\n*Silakan scan QRIS atau transfer manual ke nomor di atas.*';
    } else {
      title = '📲 Donasi via QRIS All Payment';
      color = 0xFFA500;
      desc = 'Scan QRIS di bawah ini melalui m-Banking (BCA, BRI, Mandiri, BNI, BSI) atau e-Wallet (OVO, Dana, GoPay, ShopeePay).';
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(desc)
      .setImage('https://media.discordapp.net/attachments/1055410002682195968/1392205505341947944/shareqr.png?ex=688dab2a&is=688c59aa&hm=977705760996ed2b73b7eb139dba7d6ac87b573634fd3fa8ac11263884eca855&=&format=webp&quality=lossless&width=796&height=930')
      .setFooter({ text: 'Konfirmasi bukti transfer dapat dikirimkan ke Admin / Staff' });

    // Gunakan ephemeral agar tidak mengedit atau menimpa pesan publik user lain
    await interaction.reply({ embeds: [embed], ephemeral: true });
  });
};
