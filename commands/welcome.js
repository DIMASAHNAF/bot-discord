const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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

module.exports = (client) => {
  // Command untuk set channel welcome
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!setwelcome')) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Hanya Administrator yang dapat mengatur channel welcome.');
      }

      const channel = message.mentions.channels.first() || message.channel;
      const config = getWelcomeConfig();
      config[message.guild.id] = channel.id;
      saveWelcomeConfig(config);

      return message.reply(`✅ Channel sambutan selamat datang berhasil disetel ke **<#${channel.id}>**.`);
    }
  });

  // Sambutan Member Baru Masuk
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

  // Notifikasi Member Keluar
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
};
