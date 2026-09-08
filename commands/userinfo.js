const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Command: !avatar [@user]
    if (message.content.startsWith('!avatar')) {
      const targetUser = message.mentions.users.first() || message.author;
      const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 2048 });

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🖼️ Avatar: ${targetUser.tag}`)
        .setImage(avatarUrl)
        .setFooter({ text: `Diminta oleh ${message.author.tag}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Buka Gambar HD')
          .setURL(avatarUrl)
          .setStyle(ButtonStyle.Link)
      );

      return message.reply({ embeds: [embed], components: [row] });
    }

    // Command: !userinfo [@user]
    if (message.content.startsWith('!userinfo')) {
      const targetUser = message.mentions.users.first() || message.author;
      const member = await message.guild.members.fetch(targetUser.id).catch(() => null);

      const createdDate = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
      const joinedDate = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Bukan member server';

      // Kumpulkan roles (kecualikan @everyone)
      let rolesStr = 'Tidak ada role';
      if (member) {
        const roles = member.roles.cache.filter(r => r.id !== message.guild.id);
        if (roles.size > 0) {
          rolesStr = roles.map(r => `<@&${r.id}>`).slice(0, 10).join(', ');
          if (roles.size > 10) rolesStr += ` *(+${roles.size - 10} lainnya)*`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(member?.displayHexColor !== '#000000' ? member?.displayHexColor : 0x5865F2)
        .setTitle(`👤 Profil Pengguna: ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: '🏷️ Tag Pengguna', value: targetUser.tag, inline: true },
          { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
          { name: '🤖 Tipe Akun', value: targetUser.bot ? 'Bot' : 'Pengguna Biasa', inline: true },
          { name: '📅 Akun Dibuat', value: createdDate, inline: true },
          { name: '📥 Bergabung ke Server', value: joinedDate, inline: true },
          { name: '👑 Role Tertinggi', value: member?.roles.highest ? `<@&${member.roles.highest.id}>` : '-', inline: true },
          { name: '🎭 Daftar Role', value: rolesStr, inline: false }
        )
        .setFooter({ text: `Diminta oleh ${message.author.tag}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  });
};
