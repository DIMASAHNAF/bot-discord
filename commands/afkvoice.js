const { 
  joinVoiceChannel, getVoiceConnection 
} = require('@discordjs/voice');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!afkvoice') && !message.author.bot) {
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) return message.reply('❌ Kamu harus join voice channel dulu.');

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      message.reply(`✅ Bot masuk ke channel **${voiceChannel.name}** dan akan AFK selama 10 menit.`);

      setTimeout(() => {
        const conn = getVoiceConnection(message.guild.id);
        if (conn) {
          conn.destroy();
          message.channel.send('🕒 10 menit berlalu, bot keluar dari voice channel.');
        }
      }, 10 * 60 * 90000);
    }
  });
};
