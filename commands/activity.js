const { ActivityType } = require('discord.js');

module.exports = (client) => {
  let isCustom = false;

  // Daftar status yang akan berputar otomatis
  const getActivities = () => {
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
    const totalGuilds = client.guilds.cache.size;

    return [
      {
        name: 'AFK Voice 24/7 🎙️',
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord' // Warna ungu (Streaming)
      },
      {
        name: `${totalMembers} Members di ${totalGuilds} Server 👥`,
        type: ActivityType.Watching
      },
      {
        name: 'Perintah: !afkvoice & !help 🛠️',
        type: ActivityType.Listening
      },
      {
        name: 'Melayani Tuan Muda Hotwill 👑',
        type: ActivityType.Playing
      }
    ];
  };

  let currentIndex = 0;

  function updateActivity() {
    if (isCustom || !client.user) return;

    const activities = getActivities();
    if (activities.length === 0) return;

    const current = activities[currentIndex];
    client.user.setPresence({
      activities: [{
        name: current.name,
        type: current.type,
        url: current.url || undefined
      }],
      status: 'online'
    });

    currentIndex = (currentIndex + 1) % activities.length;
  }

  // Mulai rotasi activity
  const startRotation = () => {
    updateActivity();
    // Rotasi setiap 15 detik (aman dari rate limit Discord)
    setInterval(updateActivity, 15000);
    console.log('✅ Activity & Rich Presence bot berhasil diaktifkan!');
  };

  if (client.isReady()) {
    startRotation();
  } else {
    client.once('clientReady', startRotation);
  }

  // Handler command di Discord untuk ubah status kapan pun
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Perintah: !setactivity <playing|streaming|listening|watching|competing> <teks>
    if (message.content.startsWith('!setactivity')) {
      const args = message.content.trim().split(/\s+/);
      const typeStr = args[1]?.toLowerCase();
      const text = args.slice(2).join(' ');

      if (!typeStr || !text) {
        return message.reply(
          '❌ **Format salah!**\nContoh penggunaan:\n' +
          '• `!setactivity streaming Live Voice 24/7` *(Warna ungu Streaming)*\n' +
          '• `!setactivity playing Bersama Komunitas`\n' +
          '• `!setactivity watching Server Discord`\n' +
          '• `!setactivity listening Musik Santai`\n' +
          '• `!resetactivity` *(Kembali ke rotasi otomatis)*'
        );
      }

      let actType = ActivityType.Playing;
      let url = undefined;

      if (typeStr === 'streaming') {
        actType = ActivityType.Streaming;
        url = 'https://www.twitch.tv/discord';
      } else if (typeStr === 'listening') {
        actType = ActivityType.Listening;
      } else if (typeStr === 'watching') {
        actType = ActivityType.Watching;
      } else if (typeStr === 'competing') {
        actType = ActivityType.Competing;
      }

      isCustom = true;
      client.user.setPresence({
        activities: [{ name: text, type: actType, url }],
        status: 'online'
      });

      return message.reply(`✅ Status bot berhasil diubah ke **${typeStr.toUpperCase()}**: "${text}"`);
    }

    // Perintah: !setstatus <online|idle|dnd>
    if (message.content.startsWith('!setstatus')) {
      const args = message.content.trim().split(/\s+/);
      const newStatus = args[1]?.toLowerCase();
      const validStatuses = ['online', 'idle', 'dnd'];

      if (!validStatuses.includes(newStatus)) {
        return message.reply('❌ Status tidak valid! Pilih: `online` (hijau), `idle` (kuning), atau `dnd` (merah).');
      }

      client.user.setStatus(newStatus);
      return message.reply(`✅ Lingkaran status bot berhasil diubah ke **${newStatus}**.`);
    }

    // Perintah: !resetactivity
    if (message.content.startsWith('!resetactivity')) {
      isCustom = false;
      updateActivity();
      return message.reply('✅ Status bot dikembalikan ke **rotasi otomatis**.');
    }
  });
};
