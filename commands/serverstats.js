const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.content !== '!serverstats') return;

    const { guild } = message;

    try {
      // Ambil data guild owner dan member lengkap
      const owner = await guild.fetchOwner().catch(() => null);

      const totalMembers = guild.memberCount;
      const cachedMembers = guild.members.cache;
      const botCount = cachedMembers.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      // Hitung tipe channel
      const channels = guild.channels.cache;
      const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
      const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size;
      const categoryCount = channels.filter(c => c.type === ChannelType.GuildCategory).size;

      const totalRoles = guild.roles.cache.size - 1; // Kecualikan @everyone
      const boostLevel = guild.premiumTier || 0;
      const boostCount = guild.premiumSubscriptionCount || 0;

      const createdDate = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📊 Dashboard Statistik: ${guild.name}`)
        .setDescription(`Informasi lengkap mengenai server **${guild.name}**.`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: '👑 Pemilik Server', value: owner ? `<@${owner.id}> (${owner.user.tag})` : 'Tidak diketahui', inline: false },
          { name: '👥 Populasi Member', value: `• Total: **${totalMembers}**\n• User: **${humanCount}**\n• Bot: **${botCount}**`, inline: true },
          { name: '📁 Struktur Channel', value: `• Text: **${textChannels}**\n• Voice: **${voiceChannels}**\n• Kategori: **${categoryCount}**`, inline: true },
          { name: '✨ Server Boost', value: `• Level: **${boostLevel}**\n• Boosts: **${boostCount}**`, inline: true },
          { name: '🏷️ Total Roles', value: `**${totalRoles}** Role`, inline: true },
          { name: '🛡️ Tingkat Verifikasi', value: `Level **${guild.verificationLevel}**`, inline: true },
          { name: '📅 Dibuat Pada', value: createdDate, inline: true }
        )
        .setImage(guild.bannerURL({ size: 1024 }) || null)
        .setFooter({ text: `Diminta oleh ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[ServerStats] Error:', err);
      return message.reply('❌ Terjadi kesalahan saat membaca statistik server.');
    }
  });
};
