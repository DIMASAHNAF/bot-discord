const fs = require('fs');
require("dotenv").config();
const path = require('path');
const readline = require('readline');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

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

client.setMaxListeners(50);
client.commands = new Collection();
const slashCommandsData = [];

// Load semua command dari folder commands/
fs.readdirSync('./commands').forEach(file => {
  if (file.endsWith('.js')) {
    try {
      const mod = require(`./commands/${file}`);
      if (typeof mod === 'function') {
        // Pure event listener / legacy setup
        mod(client);
        console.log(`✅ Loaded module: ${file}`);
      } else if (typeof mod === 'object' && mod !== null) {
        if (typeof mod.init === 'function') {
          mod.init(client);
        }

        if (Array.isArray(mod.commands)) {
          for (const cmd of mod.commands) {
            if (cmd && cmd.data && cmd.execute) {
              client.commands.set(cmd.data.name, cmd);
              slashCommandsData.push(cmd.data.toJSON());
            }
          }
        } else if (mod.data && mod.execute) {
          client.commands.set(mod.data.name, mod);
          slashCommandsData.push(mod.data.toJSON());
        }
        console.log(`✅ Loaded slash command: ${file}`);
      }
    } catch (err) {
      console.error(`❌ Gagal memuat file ${file}:`, err);
    }
  }
});

// Listener untuk Slash Command Interaction
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`[SlashCommand Error] /${interaction.commandName}:`, error);
    const errorPayload = {
      content: '❌ Terjadi kesalahan saat menjalankan perintah ini!',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorPayload).catch(() => {});
    } else {
      await interaction.reply(errorPayload).catch(() => {});
    }
  }
});

// Helper pengingat jika user masih mengetik prefix lama '!'
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.content.startsWith('!')) {
    const cmdName = message.content.slice(1).trim().split(/\s+/)[0].toLowerCase();
    if (client.commands.has(cmdName)) {
      message.reply(`💡 Perintah sekarang sudah menggunakan Slash Command! Ketik **/${cmdName}** untuk menggunakannya.`).catch(() => {});
    }
  }
});

// Terminal input (opsional - hanya jika dijalankan di interactive TTY)
if (process.stdin.isTTY) {
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
    }
  });
}

// Global error handlers agar bot tidak crash saat berjalan 24/7
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Anti-Crash] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ [Anti-Crash] Uncaught Exception:', err);
});

// Event listener untuk memantau status koneksi shard & client Discord
client.on('error', (err) => {
  console.error('⚠️ [Discord Client Error]:', err.message || err);
});

client.on('shardError', (err, shardId) => {
  console.error(`⚠️ [Discord Shard ${shardId} Error]:`, err.message || err);
});

client.on('shardDisconnect', (event, shardId) => {
  console.warn(`⚠️ [Discord Shard ${shardId}] Terputus dari Gateway (Code: ${event.code}). Menunggu auto-reconnect...`);
});

client.on('shardReconnecting', (shardId) => {
  console.log(`🔄 [Discord Shard ${shardId}] Sedang menyambung kembali ke Discord Gateway...`);
});

client.on('shardResume', (shardId, replayedEvents) => {
  console.log(`✅ [Discord Shard ${shardId}] Berhasil resume koneksi gateway (${replayedEvents} event).`);
});

client.once('clientReady', async () => {
  console.log(`✅ Bot login sebagai ${client.user.tag}`);

  // Sinkronisasi Slash Commands ke Discord API
  if (slashCommandsData.length > 0) {
    try {
      console.log(`📡 Mendaftarkan ${slashCommandsData.length} Slash Command...`);

      // 1. Daftarkan secara Global
      await client.application.commands.set(slashCommandsData);
      console.log(`✅ Sukses mendaftarkan ${slashCommandsData.length} Slash Command secara Global!`);

      // 2. Daftarkan langsung ke Guilds yang terhubung agar instan
      for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(slashCommandsData).catch(err => {
          console.warn(`[SlashCommand Warn] Gagal mendaftarkan ke guild ${guild.name}:`, err.message);
        });
      }
      console.log(`⚡ Slash commands langsung aktif di semua server!`);
    } catch (err) {
      console.error('❌ Gagal sinkronisasi Slash Commands ke Discord:', err);
    }
  }
});

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN.trim() === '' || process.env.DISCORD_TOKEN.includes('YOUR_DISCORD_BOT_TOKEN_HERE')) {
  console.error('❌ DISCORD_TOKEN belum diisi di file .env!');
  console.error('👉 Silakan edit file .env dan masukkan bot token Anda:');
  console.error('   nano /var/www/bot-discord/.env');
  console.error('   atau gunakan perintah: pm2 restart bot-discord setelah mengisi token.');
  process.exit(1);
}

// Fungsi login tahan banting dengan auto-retry jika server/jaringan sempat down saat VM restart
async function startBot(retries = 0) {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    const delay = Math.min(30000, 5000 * Math.pow(1.5, retries));
    console.error(`❌ Gagal login ke Discord (${err.message}). Mencoba lagi dalam ${(delay / 1000).toFixed(1)} detik...`);
    setTimeout(() => startBot(retries + 1), delay);
  }
}

startBot();

