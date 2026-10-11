const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const helpCategories = {
  voice: {
    title: '🎙️ Voice & 24/7 AFK Standby',
    color: 0x2ECC71,
    description: 'Daftar perintah untuk mengontrol bot di channel suara (Voice Channel).',
    commands: [
      { name: '/afkvoice [channel]', desc: 'Membuat bot standby di voice channel 24/7 nonstop (Auto-Reconnect & hemat kuota VPS).' },
      { name: '/stopafk', desc: 'Menghentikan mode standby 24/7 dan mengeluarkan bot dari voice channel.' },
      { name: '/joinvoice [channel]', desc: 'Memasukkan bot ke voice channel target atau channel tempat kamu berada.' },
      { name: '/leavevoice', desc: 'Mengeluarkan bot dari voice channel saat ini.' },
      { name: '🔊 Auto-Create Voice Rooms', desc: 'Join ke channel pemicu untuk membuat voice room otomatis sendiri (terhapus otomatis saat kosong).' }
    ]
  },
  moderation: {
    title: '🛡️ Moderasi & Pengaturan Server',
    color: 0xE74C3C,
    description: 'Perintah pengelolaan channel, keamanan, dan administrasi server.',
    commands: [
      { name: '/clear <jumlah>', desc: 'Menghapus banyak pesan chat sekaligus (1 - 100 pesan).' },
      { name: '/lock [channel]', desc: 'Mengunci channel teks agar member biasa tidak dapat mengirim pesan.' },
      { name: '/unlock [channel]', desc: 'Membuka kembali kunci channel teks.' },
      { name: '/slowmode <detik>', desc: 'Mengatur jeda waktu kirim pesan (0 = nonaktifkan slowmode).' },
      { name: '/say <pesan>', desc: 'Mengirim pesan atas nama bot secara rapi.' },
      { name: '/send <channel> <pesan>', desc: 'Mengirim pesan siaran/pengumuman ke channel teks tertentu.' },
      { name: '/verif', desc: 'Memunculkan panel tombol verifikasi otomatis untuk member baru.' },
      { name: '/ticketsetup', desc: 'Memunculkan panel pembuatan tiket bantuan interaktif & private room.' },
      { name: '/setwelcome <channel>', desc: 'Mengatur channel pengiriman kartu sambutan selamat datang.' }
    ]
  },
  info: {
    title: '📊 Informasi & Utilitas',
    color: 0x3498DB,
    description: 'Perintah pemantauan status server, akun member, dan utilitas praktis.',
    commands: [
      { name: '/serverstats', desc: 'Dashboard lengkap statistik server (owner, member, channel, boost).' },
      { name: '/userinfo [user]', desc: 'Melihat rincian profil pengguna (umur akun, join server, roles).' },
      { name: '/avatar [user]', desc: 'Melihat dan mengunduh foto profil pengguna resolusi tinggi (HD).' },
      { name: '/ping', desc: 'Mengecek latency bot dan kecepatan WebSocket Discord.' },
      { name: '/botinfo', desc: 'Melihat uptime bot, spesifikasi, dan pemakaian RAM VPS secara real-time.' },
      { name: '/livedashboard', desc: 'Membuat panel live monitoring real-time yang auto-update otomatis setiap 10 detik.' },
      { name: '/remind <waktu> <pesan>', desc: 'Memasang alarm pengingat otomatis (contoh: `/remind waktu:30m pesan:Makan siang`).' },
      { name: '/calc <operasi>', desc: 'Kalkulator matematika instan (contoh: `/calc operasi:(15000 * 12)`).' },
      { name: '/webcheck <url>', desc: 'Cek status online, response time, dan kesehatan website project kamu.' },
      { name: '/donate', desc: 'Melihat menu donasi komunitas lengkap (DANA, GoPay, QRIS All Payment).' }
    ]
  },
  api: {
    title: '🌐 Fitur API Publik (Real-Time)',
    color: 0x9B59B6,
    description: 'Fitur eksternal yang terhubung ke API publik resmi tanpa hambatan.',
    commands: [
      { name: '/ai <pertanyaan>', desc: 'Tanya jawab cerdas dengan asisten AI (Atria / Groq / Gemini).' },
      { name: '/ai-key <provider> <key>', desc: 'Atur API Key AI langsung dari Discord (Khusus Admin).' },
      { name: '/ai-reset', desc: 'Reset konteks/memori percakapan AI kamu.' },
      { name: '/gempa', desc: 'Data gempa bumi terkini di Indonesia resmi dari BMKG lengkap dengan gambar peta.' },
      { name: '/cuaca <kota>', desc: 'Prakiraan cuaca kota di Indonesia/dunia secara real-time.' },
      { name: '/anime <judul>', desc: 'Cari info anime MyAnimeList (rating, studio, episode, sinopsis) via Jikan API.' },
      { name: '/crypto [koin]', desc: 'Cek harga kripto (IDR, USD, perubahan 24 jam) dari CoinGecko.' },
      { name: '/steam <game>', desc: 'Cari harga dan info game Steam Store lengkap dengan link toko.' },
      { name: '/translate <bahasa> <teks>', desc: 'Menerjemahkan teks antar bahasa secara instan.' },
      { name: '/meme', desc: 'Menampilkan meme lucu dan kocak terbaru dari Reddit.' }
    ]
  },
  fun: {
    title: '🎲 Hiburan & Mini Games',
    color: 0xF1C40F,
    description: 'Perintah seru untuk meramaikan interaksi member di server.',
    commands: [
      { name: '/giveaway <waktu> <pemenang> <hadiah>', desc: 'Mengadakan undian giveaway otomatis dengan tombol join 🎉 dan timer.' },
      { name: '/roll [max]', desc: 'Kocok dadu angka acak (contoh: `/roll max:100`).' },
      { name: '/flip', desc: 'Lempar koin keberuntungan (Gambar atau Angka).' },
      { name: '/8ball <pertanyaan>', desc: 'Bola ramalan ajaib Magic 8-Ball yang menjawab pertanyaanmu.' }
    ]
  },
  activity: {
    title: '🎭 Bot Activity & Status',
    color: 0x1ABC9C,
    description: 'Pengaturan status kehadiran dan display bot di server.',
    commands: [
      { name: '/setactivity <tipe> <teks>', desc: 'Ubah status bot (playing, streaming, watching, listening, competing).' },
      { name: '/setstatus <status>', desc: 'Ubah warna lingkaran status bot (online, idle, dnd).' },
      { name: '/resetactivity', desc: 'Mengembalikan status bot ke rotasi otomatis real-time setiap 15 detik.' }
    ]
  }
};

function getMainEmbed(client) {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📖 Buku Panduan & Daftar Perintah (Slash Commands)')
    .setDescription(
      `Halo! Saya adalah **${client.user.username}**, bot multifungsi yang siap melayani kebutuhan server ini.\n\n` +
      '✨ **Semua perintah sekarang menggunakan Slash Commands (`/`)!**\n' +
      '💡 **Cara Membaca:** Pilih kategori pada **menu dropdown di bawah** untuk melihat daftar perintah lengkap beserta fungsinya.'
    )
    .addFields(
      { name: '🎙️ Voice 24/7', value: 'Standby voice nonstop, auto room, dan kontrol voice.', inline: true },
      { name: '🛡️ Moderasi', value: 'Clear chat, lock/unlock, tiket, broadcast, dan verif.', inline: true },
      { name: '📊 Info & Utilitas', value: 'Serverstats, userinfo, avatar, botinfo, pengingat, dan kalkulator.', inline: true },
      { name: '🌐 Fitur API', value: 'Gempa BMKG, Cuaca, Anime, Kripto, Steam, Terjemahan, dan Meme.', inline: true },
      { name: '🎲 Hiburan', value: 'Giveaway otomatis, dadu, lempar koin, dan Magic 8-Ball.', inline: true },
      { name: '🎭 Bot Activity', value: 'Custom status streaming, playing, dan rotasi otomatis.', inline: true }
    )
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'Gunakan dropdown di bawah untuk menjelajahi seluruh fitur' })
    .setTimestamp();
}

function getSelectRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_select_menu')
    .setPlaceholder('Pilih Kategori Perintah...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Beranda (Menu Utama)')
        .setDescription('Kembali ke tampilan awal buku panduan')
        .setValue('home')
        .setEmoji('🏠'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Voice & 24/7 Standby')
        .setDescription('Perintah AFK voice 24 jam dan temporary voice')
        .setValue('voice')
        .setEmoji('🎙️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Moderasi & Keamanan')
        .setDescription('Clear chat, lock, ticket, broadcast, dan verifikasi')
        .setValue('moderation')
        .setEmoji('🛡️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Informasi & Utilitas')
        .setDescription('Statistik server, profil, avatar, pengingat, dan kalkulator')
        .setValue('info')
        .setEmoji('📊'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Fitur API Publik')
        .setDescription('Gempa BMKG, Cuaca, Anime, Kripto, Steam, Terjemahan, Meme')
        .setValue('api')
        .setEmoji('🌐'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Hiburan & Mini Games')
        .setDescription('Giveaway otomatis, dadu, koin, dan 8-ball')
        .setValue('fun')
        .setEmoji('🎲'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Bot Activity & Status')
        .setDescription('Atur status streaming dan rotasi bot')
        .setValue('activity')
        .setEmoji('🎭')
    );

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Buku panduan dan daftar seluruh fitur/perintah bot Discord'),
  async execute(interaction, client) {
    const embed = getMainEmbed(client);
    const row = getSelectRow();
    return interaction.reply({ embeds: [embed], components: [row] });
  },
  init(client) {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isStringSelectMenu() || interaction.customId !== 'help_select_menu') return;

      const val = interaction.values[0];

      if (val === 'home') {
        const homeEmbed = getMainEmbed(client);
        return interaction.update({ embeds: [homeEmbed] });
      }

      const category = helpCategories[val];
      if (!category) return;

      const embed = new EmbedBuilder()
        .setColor(category.color)
        .setTitle(category.title)
        .setDescription(category.description)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Ketik perintah menggunakan format Slash Command "/"' });

      category.commands.forEach((cmd) => {
        embed.addFields({
          name: `\`${cmd.name}\``,
          value: cmd.desc,
          inline: false,
        });
      });

      return interaction.update({ embeds: [embed] });
    });
  }
};
