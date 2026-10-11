const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');

const lockCommand = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Mengunci channel teks agar member biasa tidak dapat mengirim pesan')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel yang ingin dikunci (default: channel saat ini)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });

      if (targetChannel.id !== interaction.channelId) {
        await targetChannel.send('🔒 **Channel ini telah dikunci oleh Moderator/Admin.**');
      }

      return interaction.reply({
        content: `🔒 **Channel <#${targetChannel.id}> berhasil dikunci!** Member biasa tidak dapat mengirim pesan sampai dibuka kembali.`
      });
    } catch (err) {
      console.error('[Lock] Error:', err);
      return interaction.reply({
        content: '❌ Gagal mengunci channel. Pastikan posisi role bot memiliki izin Manage Channels.',
        ephemeral: true
      });
    }
  }
};

const unlockCommand = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Membuka kembali kunci channel teks')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel yang ingin dibuka kuncinya (default: channel saat ini)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      });

      if (targetChannel.id !== interaction.channelId) {
        await targetChannel.send('🔓 **Channel ini telah dibuka kembali oleh Moderator/Admin.**');
      }

      return interaction.reply({
        content: `🔓 **Channel <#${targetChannel.id}> telah dibuka kembali!** Member sudah dapat mengirim pesan secara normal.`
      });
    } catch (err) {
      console.error('[Unlock] Error:', err);
      return interaction.reply({
        content: '❌ Gagal membuka kunci channel.',
        ephemeral: true
      });
    }
  }
};

const slowmodeCommand = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Mengatur jeda waktu slowmode antar pesan di channel teks')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt.setName('detik')
        .setDescription('Jeda waktu dalam detik (0 = matikan slowmode, maks 21600)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel teks (default: channel saat ini)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    const seconds = interaction.options.getInteger('detik');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await targetChannel.setRateLimitPerUser(seconds);
      if (seconds === 0) {
        return interaction.reply({
          content: `⚡ **Slowmode telah dinonaktifkan** di <#${targetChannel.id}>.`
        });
      } else {
        return interaction.reply({
          content: `⏱️ **Slowmode disetel:** Jeda antar pesan **${seconds} detik** di <#${targetChannel.id}>.`
        });
      }
    } catch (err) {
      console.error('[Slowmode] Error:', err);
      return interaction.reply({
        content: '❌ Gagal mengatur slowmode channel.',
        ephemeral: true
      });
    }
  }
};

module.exports = {
  commands: [lockCommand, unlockCommand, slowmodeCommand]
};
