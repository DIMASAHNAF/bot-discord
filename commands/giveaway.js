const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!giveaway')) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('❌ Kamu harus memiliki izin **Manage Server** untuk membuat giveaway.');
      }

      const args = message.content.trim().split(/\s+/).slice(1);
      const timeStr = args[0];
      const winnerCount = parseInt(args[1], 10);
      const prize = args.slice(2).join(' ');

      if (!timeStr || isNaN(winnerCount) || !prize) {
        return message.reply(
          '❌ **Format salah!**\n' +
          'Gunakan: `!giveaway <waktu> <jumlah_pemenang> <nama_hadiah>`\n' +
          'Contoh: `!giveaway 10m 1 Discord Nitro Basic`\n' +
          '*(Satuan waktu: s = detik, m = menit, h = jam)*'
        );
      }

      const match = timeStr.match(/^(\d+)([smh])$/i);
      if (!match) {
        return message.reply('❌ Format waktu tidak valid! Contoh: `30s`, `10m`, `2h`.');
      }

      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      let durationMs = val * 1000;
      if (unit === 'm') durationMs = val * 60 * 1000;
      if (unit === 'h') durationMs = val * 60 * 60 * 1000;

      try { await message.delete(); } catch {}

      const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);
      const participants = new Set();

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎉 GIVEAWAY: ${prize}`)
        .setDescription(
          `Klik tombol **🎉 Ikuti Giveaway** di bawah ini untuk berpartisipasi!\n\n` +
          `• 🏆 **Jumlah Pemenang:** ${winnerCount}\n` +
          `• ⏰ **Berakhir:** <t:${endTimestamp}:R> (<t:${endTimestamp}:T>)\n` +
          `• 👑 **Diselenggarakan oleh:** <@${message.author.id}>\n` +
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

      const gwMessage = await message.channel.send({ embeds: [embed], components: [row] });

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
          `• 👑 **Diselenggarakan oleh:** <@${message.author.id}>\n` +
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
        await message.channel.send(`🎉 Selamat kepada ${winnersMention} telah memenangkan **${prize}**! 🎁`);
      });
    }
  });
};
