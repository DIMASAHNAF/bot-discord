const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content !== '!serverstats') return;

    const { guild } = message;

    const totalMembers = guild.memberCount;
    const totalChannels = guild.channels.cache.size;
    const totalRoles = guild.roles.cache.size;

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(`📊 Statistik Server: ${guild.name}`)
      .addFields(
        { name: '👥 Total Anggota', value: `${totalMembers}`, inline: true },
        { name: '📁 Total Channel', value: `${totalChannels}`, inline: true },
        { name: '🏷️ Total Role', value: `${totalRoles}`, inline: true }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Diminta oleh ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    await message.channel.send({ embeds: [embed] });
  });
};
