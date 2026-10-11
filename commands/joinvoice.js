const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const joinVoiceCommand = {
  data: new SlashCommandBuilder()
    .setName('joinvoice')
    .setDescription('Memasukkan bot ke voice channel target')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target voice channel (kosongkan untuk channel tempat kamu berada)')
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        .setRequired(false)
    ),
  async execute(interaction) {
    let targetChannel = interaction.options.getChannel('channel');

    if (!targetChannel) {
      targetChannel = interaction.member?.voice?.channel;
    }

    if (!targetChannel || !targetChannel.isVoiceBased()) {
      return interaction.reply({
        content: '❌ **Voice channel tidak ditemukan!**\nMasuklah ke salah satu voice channel atau pilih channel pada opsi `/joinvoice channel:<pilih>`.',
        ephemeral: true
      });
    }

    try {
      joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      return interaction.reply(`✅ Bot berhasil join ke voice channel **${targetChannel.name}**.`);
    } catch (error) {
      console.error('[JoinVoice] Error:', error);
      return interaction.reply({
        content: '❌ Gagal join ke voice channel. Pastikan bot memiliki izin Connect di channel tersebut.',
        ephemeral: true
      });
    }
  }
};

const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, '../afk_voice_config.json');

const leaveVoiceCommand = {
  data: new SlashCommandBuilder()
    .setName('leavevoice')
    .setDescription('Mengeluarkan bot dari voice channel saat ini'),
  async execute(interaction) {
    const conn = getVoiceConnection(interaction.guild.id);
    if (!conn) {
      return interaction.reply({
        content: '❌ Bot sedang tidak berada di voice channel mana pun.',
        ephemeral: true
      });
    }

    conn.destroy();

    let afkNote = '';
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (config.guilds && config.guilds[interaction.guild.id]) {
          afkNote = '\n💡 *Catatan: Server ini memiliki mode AFK Voice 24/7 aktif. Jika ingin mematikan auto-reconnect permanen, gunakan `/stopafk`.*';
        }
      }
    } catch {}

    return interaction.reply(`⏹️ Bot berhasil keluar dari voice channel.${afkNote}`);
  }
};

module.exports = {
  commands: [joinVoiceCommand, leaveVoiceCommand]
};
