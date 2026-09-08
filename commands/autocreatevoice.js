const { ChannelType, PermissionFlagsBits } = require('discord.js');

// Map untuk melacak temporary voice channel yang dibuat bot: channelId -> creatorId
const tempVoiceChannels = new Set();

module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = newState.guild || oldState.guild;
    const member = newState.member;

    // 1. Logika Pembuatan Voice Room Baru
    if (newState.channelId) {
      // Daftar channel pemicu beserta emoji prefix dan kategori target
      const triggers = {
        '1432357327641510010': { emoji: '🔊', categoryId: '1432314471124303974' }, // Create Voice
        '1432358956633952387': { emoji: '📹', categoryId: '1432358054497751051' }, // Create Streaming Voice
      };

      const trigger = triggers[newState.channelId];
      if (trigger && member) {
        try {
          // Buat voice channel baru di kategori yang sesuai
          const newChannel = await guild.channels.create({
            name: `${trigger.emoji} ${member.user.displayName || member.user.username}`,
            type: ChannelType.GuildVoice,
            parent: trigger.categoryId || undefined,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
              },
              {
                id: member.id,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                  PermissionFlagsBits.ManageChannels,
                  PermissionFlagsBits.MuteMembers,
                  PermissionFlagsBits.DeafenMembers,
                  PermissionFlagsBits.MoveMembers,
                ],
              },
            ],
          });

          tempVoiceChannels.add(newChannel.id);

          // Pindahkan user ke channel barunya
          await member.voice.setChannel(newChannel);
        } catch (error) {
          console.error('[AutoVoice] Gagal membuat/memindahkan channel:', error);
        }
      }
    }

    // 2. Logika Penghapusan Otomatis Saat Channel Kosong (Event-Driven, Ramah RAM VPS)
    if (oldState.channelId && tempVoiceChannels.has(oldState.channelId)) {
      const channel = oldState.channel;
      if (channel && channel.members.size === 0) {
        tempVoiceChannels.delete(channel.id);
        try {
          await channel.delete();
        } catch (err) {
          // Ignore jika channel sudah terhapus secara manual
        }
      }
    }
  });
};
