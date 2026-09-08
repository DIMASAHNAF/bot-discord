const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Command: !joinvoice [ID/Nama]
    if (message.content.startsWith('!joinvoice')) {
      const args = message.content.trim().split(/\s+/);
      const targetParam = args[1];

      let targetChannel = null;

      if (targetParam) {
        const cleanId = targetParam.replace(/[<#>]/g, '');
        targetChannel = message.guild.channels.cache.get(cleanId);
        if (!targetChannel) {
          try {
            targetChannel = await message.guild.channels.fetch(cleanId).catch(() => null);
          } catch {}
        }

        if (!targetChannel) {
          const searchName = args.slice(1).join(' ').toLowerCase();
          targetChannel = message.guild.channels.cache.find(
            (c) => c.isVoiceBased && c.isVoiceBased() && c.name.toLowerCase() === searchName
          );
        }
      } else {
        // Ambil channel tempat pengirim berada
        targetChannel = message.member?.voice?.channel;
      }

      if (!targetChannel || !targetChannel.isVoiceBased()) {
        return message.reply(
          '❌ **Channel voice tidak ditemukan!**\n' +
          '• Masuk ke salah satu voice channel lalu ketik `!joinvoice`\n' +
          '• Atau ketik `!joinvoice <ID_CHANNEL>` / `!joinvoice <Nama Channel>`'
        );
      }

      try {
        joinVoiceChannel({
          channelId: targetChannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
          selfDeaf: false,
        });

        return message.reply(`✅ Bot berhasil join ke voice channel **${targetChannel.name}**.`);
      } catch (error) {
        console.error('[JoinVoice] Error:', error);
        return message.reply('❌ Gagal join ke voice channel. Pastikan bot memiliki izin Connect di channel tersebut.');
      }
    }

    // Command: !leavevoice
    if (message.content.startsWith('!leavevoice')) {
      const conn = getVoiceConnection(message.guild.id);
      if (!conn) return message.reply('❌ Bot sedang tidak berada di voice channel mana pun.');

      conn.destroy();
      return message.reply('⏹️ Bot berhasil keluar dari voice channel.');
    }
  });
};
