const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const userInfoCommand = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Melihat rincian profil pengguna di server ini')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target pengguna yang ingin dilihat profilnya (default: diri sendiri)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const createdDate = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
    const joinedDate = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Bukan member server';

    let rolesStr = 'Tidak ada role';
    if (member) {
      const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id);
      if (roles.size > 0) {
        rolesStr = roles.map(r => `<@&${r.id}>`).slice(0, 10).join(', ');
        if (roles.size > 10) rolesStr += ` *(+${roles.size - 10} lainnya)*`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor !== '#000000' && member?.displayHexColor ? member.displayHexColor : 0x5865F2)
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
      .setFooter({ text: `Diminta oleh ${interaction.user.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

const avatarCommand = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Melihat dan mengunduh foto profil pengguna resolusi tinggi (HD)')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Target pengguna yang ingin dilihat fotonya (default: diri sendiri)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 2048 });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🖼️ Avatar: ${targetUser.tag}`)
      .setImage(avatarUrl)
      .setFooter({ text: `Diminta oleh ${interaction.user.tag}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Buka Gambar HD')
        .setURL(avatarUrl)
        .setStyle(ButtonStyle.Link)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
};

module.exports = {
  commands: [userInfoCommand, avatarCommand]
};
