const fs = require('fs');
require("dotenv").config();
const path = require('path');
const readline = require('readline');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Load semua command dari folder commands/
fs.readdirSync('./commands').forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') {
      command(client);
      console.log(`✅ Loaded: ${file}`);
    }
  }
});

// Terminal input (opsional)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (input) => {
  const [cmd, ...args] = input.trim().split(' ');

  if (cmd === '!send') {
    const [channelId, ...messageText] = args;
    const channel = client.channels.cache.get(channelId);
    if (channel && channel.isTextBased()) {
      channel.send(messageText.join(' '))
        .then(() => console.log(`✅ Sent to ${channel.name || channelId}`))
        .catch(console.error);
    } else {
      console.log('❌ Channel atau Text tidak ditemukan');
    }
 ``
  }
  // Tambah perintah terminal lain jika perlu
});

client.once('ready', () => {
  console.log(`✅ Bot login sebagai ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
