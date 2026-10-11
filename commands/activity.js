const { SlashCommandBuilder, ActivityType, PermissionFlagsBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

let isCustom = false;
let clientRef = null;

const getActivities = (client) => {
  const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
  const totalGuilds = client.guilds.cache.size;
  const ping = client.ws.ping;
  const ramBotMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);

  let activeVoiceName = null;
  for (const guild of client.guilds.cache.values()) {
    const conn = getVoiceConnection(guild.id);
    if (conn && conn.joinConfig && conn.joinConfig.channelId) {
      const ch = guild.channels.cache.get(conn.joinConfig.channelId);
      if (ch) activeVoiceName = ch.name;
      break;
    }
  }

  return [
    {
      name: activeVoiceName ? `Standby Voice: ${activeVoiceName} 🎙️` : 'AFK Voice 24/7 🎙️',
      type: ActivityType.Streaming,
      url: 'https://www.twitch.tv/discord'
    },
    {
      name: `⚡ Ping: ${ping}ms | 💾 RAM: ${ramBotMB}MB`,
      type: ActivityType.Playing
    },
    {
      name: `👥 ${totalMembers} Users di ${totalGuilds} Server`,
      type: ActivityType.Watching
    },
    {
      name: '👑 Babu Tuan Muda Hotwill | /help',
      type: ActivityType.Listening
    }
  ];
};

let currentIndex = 0;

function updateActivity() {
  if (isCustom || !clientRef || !clientRef.user) return;

  const activities = getActivities(clientRef);
  if (activities.length === 0) return;

  const current = activities[currentIndex % activities.length];
  clientRef.user.setPresence({
    activities: [{
      name: current.name,
      type: current.type,
      url: current.url || undefined
    }],
    status: 'online'
  });

  currentIndex = (currentIndex + 1) % activities.length;
}

const setActivityCommand = {
  data: new SlashCommandBuilder()
    .setName('setactivity')
    .setDescription('Ubah status aktivitas bot Discord')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('tipe')
        .setDescription('Tipe aktivitas bot')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'playing' },
          { name: 'Streaming', value: 'streaming' },
          { name: 'Listening', value: 'listening' },
          { name: 'Watching', value: 'watching' },
          { name: 'Competing', value: 'competing' }
        )
    )
    .addStringOption(opt =>
      opt.setName('teks')
        .setDescription('Teks status yang ingin ditampilkan')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const typeStr = interaction.options.getString('tipe');
    const text = interaction.options.getString('teks');

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

    return interaction.reply({
      content: `✅ Status bot berhasil diubah ke **${typeStr.toUpperCase()}**: "${text}"`,
      ephemeral: true
    });
  }
};

const setStatusCommand = {
  data: new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription('Ubah lingkaran status kehadiran bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('status')
        .setDescription('Pilih status kehadiran')
        .setRequired(true)
        .addChoices(
          { name: 'Online (Hijau)', value: 'online' },
          { name: 'Idle (Kuning)', value: 'idle' },
          { name: 'Do Not Disturb (Merah)', value: 'dnd' }
        )
    ),
  async execute(interaction, client) {
    const newStatus = interaction.options.getString('status');
    client.user.setStatus(newStatus);
    return interaction.reply({
      content: `✅ Status kehadiran bot berhasil diubah ke **${newStatus.toUpperCase()}**.`,
      ephemeral: true
    });
  }
};

const resetActivityCommand = {
  data: new SlashCommandBuilder()
    .setName('resetactivity')
    .setDescription('Kembalikan status aktivitas bot ke rotasi otomatis real-time')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    isCustom = false;
    updateActivity();
    return interaction.reply({
      content: '✅ Status bot berhasil dikembalikan ke **real-time dinamis otomatis**.',
      ephemeral: true
    });
  }
};

module.exports = {
  commands: [setActivityCommand, setStatusCommand, resetActivityCommand],
  init(client) {
    clientRef = client;
    const startRotation = () => {
      updateActivity();
      setInterval(updateActivity, 15000);
      console.log('✅ Real-time Activity & Rich Presence bot aktif!');
    };

    if (client.isReady()) {
      startRotation();
    } else {
      client.once('clientReady', startRotation);
    }
  }
};
