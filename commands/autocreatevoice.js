module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = newState.guild;
    const member = newState.member;

    // Daftar channel pemicu beserta emoji prefix dan kategori target
    const triggers = {
      '1432357327641510010': { emoji: '🔊', categoryId: '1432314471124303974' }, // Create Voice
      '1432358956633952387': { emoji: '📹', categoryId: '1432358054497751051' }, // Create Streaming Voice
      '~~~': { emoji: '🎵', categoryId: '1431543441950769204' }, // Create Music Voice
    };

    const trigger = triggers[newState.channelId];
    if (!trigger) return; // Bukan channel pemicu, abaikan

    // Buat voice channel baru di kategori yang sesuai
    const newChannel = await guild.channels.create({
      name: `${trigger.emoji} ${member.user.username}`,
      type: 2, // 2 = Voice Channel
      parent: trigger.categoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: ['Connect'],
        },
        {
          id: member.id,
          allow: ['Connect', 'ManageChannels'],
        },
      ],
    });

    // Pindahkan user ke channel barunya
    try {
      await member.voice.setChannel(newChannel);
    } catch (error) {
      console.error('❌ Gagal memindahkan user:', error);
    }

    // Hapus channel jika kosong
    const interval = setInterval(async () => {
      const channel = guild.channels.cache.get(newChannel.id);
      if (!channel || channel.members.size === 0) {
        try {
          await channel.delete();
        } catch (err) {
          console.error('❌ Gagal menghapus channel:', err);
        }
        clearInterval(interval);
      }
    }, 15_000); // Cek setiap 10 detik
  });
};
