const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../welcome_config.json');

function getWelcomeConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch {}
  return {};
}

function saveWelcomeConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Welcome] Gagal menyimpan config:', err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Mengatur channel pengiriman pesan sambutan selamat datang untuk member baru')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel teks sambutan')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const config = getWelcomeConfig();
    config[interaction.guild.id] = channel.id;
    saveWelcomeConfig(config);

    return interaction.reply({
      content: `✅ Channel sambutan selamat datang berhasil disetel ke **<#${channel.id}>**.`,
      ephemeral: true
    });
  },
  init(client) {
    client.on('guildMemberAdd', async (member) => {
      const config = getWelcomeConfig();
      const channelId = config[member.guild.id];
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0x00FF88)
        .setTitle(`👋 Selamat Datang di ${member.guild.name}!`)
        .setDescription(
          `Halo <@${member.id}>, selamat datang di komunitas kami!\n\n` +
          `Kamu adalah anggota ke-**${member.guild.memberCount}**.\n` +
          `Jangan lupa baca peraturan dan segera lakukan verifikasi di channel verifikasi.`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setImage(member.guild.bannerURL({ size: 1024 }) || null)
        .setFooter({ text: `User ID: ${member.id}` })
        .setTimestamp();

      try {
        await channel.send({ content: `Selamat datang <@${member.id}>! 🎉`, embeds: [embed] });
      } catch (err) {
        console.error('[Welcome] Error sending message:', err);
      }
    });

    client.on('guildMemberRemove', async (member) => {
      const config = getWelcomeConfig();
      const channelId = config[member.guild.id];
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(0xFF3366)
        .setTitle('👋 Selamat Tinggal...')
        .setDescription(`**${member.user.tag}** baru saja meninggalkan server. Sampai jumpa lagi!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setTimestamp();

      try {
        await channel.send({ embeds: [embed] });
      } catch (err) {}
    });
  }
};
