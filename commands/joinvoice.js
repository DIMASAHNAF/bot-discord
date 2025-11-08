const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!joinvoice') || message.author.bot) return;

    const args = message.content.split(' ');
    const channelId = args[1];

    if (!channelId) {
      return message.reply('❌ Kamu harus menyertakan ID channel voice. Contoh: `!joinvoice 123456789012345678`');
    }

    const voiceChannel = message.guild.channels.cache.get(channelId);

    // Validasi: channel ditemukan dan tipe voice
    if (!voiceChannel || voiceChannel.type !== 2) {
      return message.reply('❌ Channel tidak ditemukan atau bukan channel voice.');
    }

    try {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      message.reply(`✅ Bot berhasil join ke voice channel **${voiceChannel.name}**.`);
    } catch (error) {
      console.error(error);
      message.reply('❌ Gagal join ke channel. Cek izin bot dan status channel.');
    }
  });
};
