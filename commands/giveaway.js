const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Mengadakan undian giveaway dengan timer dan tombol partisipasi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('waktu')
        .setDescription('Durasi waktu giveaway (contoh: 30s, 10m, 2h)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('pemenang')
        .setDescription('Jumlah pemenang (contoh: 1)')
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('hadiah')
        .setDescription('Nama hadiah giveaway')
        .setRequired(true)
    ),
  async execute(interaction) {
    const timeStr = interaction.options.getString('waktu');
    const winnerCount = interaction.options.getInteger('pemenang');
    const prize = interaction.options.getString('hadiah');

    const match = timeStr.match(/^(\d+)([smh])$/i);
    if (!match) {
      return interaction.reply({
        content: '❌ Format waktu tidak valid! Gunakan angka diikuti s (detik), m (menit), atau h (jam). Contoh: `30s`, `10m`, `2h`.',
        ephemeral: true
      });
    }

    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    let durationMs = val * 1000;
    if (unit === 'm') durationMs = val * 60 * 1000;
    if (unit === 'h') durationMs = val * 60 * 60 * 1000;

    const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);
    const participants = new Set();

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🎉 GIVEAWAY: ${prize}`)
      .setDescription(
        `Klik tombol **🎉 Ikuti Giveaway** di bawah ini untuk berpartisipasi!\n\n` +
        `• 🏆 **Jumlah Pemenang:** ${winnerCount}\n` +
        `• ⏰ **Berakhir:** <t:${endTimestamp}:R> (<t:${endTimestamp}:T>)\n` +
        `• 👑 **Diselenggarakan oleh:** <@${interaction.user.id}>\n` +
        `• 👥 **Total Peserta:** **0** orang`
      )
      .setFooter({ text: 'Semoga beruntung!' })
      .setTimestamp(new Date(Date.now() + durationMs));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('join_giveaway_btn')
        .setLabel('🎉 Ikuti Giveaway (0)')
        .setStyle(ButtonStyle.Primary)
    );

    const gwMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    // Collector button join
    const filter = (i) => i.customId === 'join_giveaway_btn';
    const collector = gwMessage.createMessageComponentCollector({
      filter,
      time: durationMs,
    });

    collector.on('collect', async (i) => {
      if (participants.has(i.user.id)) {
        participants.delete(i.user.id);
        await i.reply({ content: '❌ Kamu membatalkan keikutsertaan dalam giveaway.', ephemeral: true });
      } else {
        participants.add(i.user.id);
        await i.reply({ content: '🎉 Kamu berhasil terdaftar dalam giveaway!', ephemeral: true });
      }

      // Update tombol count
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('join_giveaway_btn')
          .setLabel(`🎉 Ikuti Giveaway (${participants.size})`)
          .setStyle(ButtonStyle.Primary)
      );

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(
        `Klik tombol **🎉 Ikuti Giveaway** di bawah ini untuk berpartisipasi!\n\n` +
        `• 🏆 **Jumlah Pemenang:** ${winnerCount}\n` +
        `• ⏰ **Berakhir:** <t:${endTimestamp}:R> (<t:${endTimestamp}:T>)\n` +
        `• 👑 **Diselenggarakan oleh:** <@${interaction.user.id}>\n` +
        `• 👥 **Total Peserta:** **${participants.size}** orang`
      );

      await gwMessage.edit({ embeds: [updatedEmbed], components: [updatedRow] }).catch(() => {});
    });

    collector.on('end', async () => {
      const participantArray = Array.from(participants);

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('gw_ended')
          .setLabel(`Giveaway Berakhir (${participants.size} Peserta)`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      if (participantArray.length === 0) {
        const endedEmbed = EmbedBuilder.from(embed)
          .setColor(0x888888)
          .setTitle(`🎉 GIVEAWAY BERAKHIR: ${prize}`)
          .setDescription(`Giveaway dibatalkan karena tidak ada peserta yang bergabung.`)
          .setFooter({ text: 'Giveaway telah selesai' });

        return gwMessage.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
      }

      // Acak pemenang
      const shuffled = participantArray.sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, Math.min(winnerCount, participantArray.length));
      const winnersMention = winners.map((id) => `<@${id}>`).join(', ');

      const winnerEmbed = EmbedBuilder.from(embed)
        .setColor(0x00FF88)
        .setTitle(`🎊 SELAMAT KEPADA PEMENANG: ${prize}`)
        .setDescription(
          `Giveaway telah resmi berakhir!\n\n` +
          `🏆 **Pemenang:** ${winnersMention}\n` +
          `🎁 **Hadiah:** **${prize}**\n` +
          `👥 **Total Peserta:** ${participants.size} orang`
        )
        .setFooter({ text: 'Silakan hubungi pembuat giveaway untuk klaim hadiah!' });

      await gwMessage.edit({ embeds: [winnerEmbed], components: [disabledRow] }).catch(() => {});
      await interaction.channel.send(`🎉 Selamat kepada ${winnersMention} telah memenangkan **${prize}**! 🎁`);
    });
  }
};
