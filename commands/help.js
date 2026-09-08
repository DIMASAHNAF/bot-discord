const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

module.exports = (client) => {
  // Data kategori dan daftar command
  const helpCategories = {
    voice: {
      title: '🎙️ Voice & 24/7 AFK Standby',
      color: 0x2ECC71,
      description: 'Daftar perintah untuk mengontrol bot di channel suara (Voice Channel).',
      commands: [
        { name: '!afkvoice [ID/Nama]', desc: 'Membuat bot standby di voice channel 24/7 nonstop (Auto-Reconnect & hemat kuota VPS).' },
        { name: '!stopafk / !leavevoice', desc: 'Mengeluarkan bot dari voice channel.' },
        { name: '!joinvoice [ID/Nama]', desc: 'Memasukkan bot ke voice channel target atau channel tempat kamu berada.' },
        { name: '🔊 Auto-Create Voice Rooms', desc: 'Join ke channel pemicu untuk membuat voice room otomatis sendiri (terhapus otomatis saat kosong).' }
      ]
    },
    moderation: {
      title: '🛡️ Moderasi & Pengaturan Server',
      color: 0xE74C3C,
      description: 'Perintah pengelolaan channel, keamanan, dan administrasi server.',
      commands: [
        { name: '!clear <1-100>', desc: 'Menghapus banyak pesan chat sekaligus (ada notifikasi auto-delete).' },
        { name: '!lock', desc: 'Mengunci channel teks agar member biasa tidak dapat mengirim pesan.' },
        { name: '!unlock', desc: 'Membuka kembali kunci channel teks.' },
        { name: '!slowmode <detik>', desc: 'Mengatur jeda waktu kirim pesan (0 = nonaktifkan slowmode).' },
        { name: '!say <pesan>', desc: 'Mengirim pesan atas nama bot (pesan command otomatis dihapus).' },
        { name: '!send <#channel> <pesan>', desc: 'Mengirim pesan siaran/pengumuman ke channel teks tertentu.' },
        { name: '!verif', desc: 'Memunculkan panel tombol verifikasi otomatis untuk member baru.' },
        { name: '!ticketsetup', desc: 'Memunculkan panel pembuatan tiket bantuan interaktif & private room.' },
        { name: '!setwelcome <#channel>', desc: 'Mengatur channel pengiriman kartu sambutan selamat datang.' }
      ]
    },
    info: {
      title: '📊 Informasi & Utilitas',
      color: 0x3498DB,
      description: 'Perintah pemantauan status server, akun member, dan utilitas praktis.',
      commands: [
        { name: '!serverstats', desc: 'Dashboard lengkap statistik server (owner, member, channel, boost).' },
        { name: '!userinfo [@user]', desc: 'Melihat rincian profil pengguna (umur akun, join server, roles).' },
        { name: '!avatar [@user]', desc: 'Melihat dan mengunduh foto profil pengguna resolusi tinggi (HD).' },
        { name: '!ping', desc: 'Mengecek latency bot dan kecepatan WebSocket Discord.' },
        { name: '!botinfo', desc: 'Melihat uptime bot, spesifikasi, dan pemakaian RAM VPS secara real-time.' },
        { name: '!remind <waktu> <pesan>', desc: 'Memasang alarm pengingat otomatis (contoh: `!remind 30m Makan siang`).' },
        { name: '!calc <operasi>', desc: 'Kalkulator matematika instan (contoh: `!calc 15000 * 12`).' },
        { name: '!donate', desc: 'Melihat menu donasi komunitas lengkap (DANA, GoPay, QRIS All Payment).' }
      ]
    },
    api: {
      title: '🌐 Fitur API Publik (Real-Time)',
      color: 0x9B59B6,
      description: 'Fitur eksternal yang terhubung ke API publik resmi tanpa hambatan.',
      commands: [
        { name: '!gempa', desc: 'Data gempa bumi terkini di Indonesia resmi dari BMKG lengkap dengan gambar peta.' },
        { name: '!cuaca <kota>', desc: 'Prakiraan cuaca kota di Indonesia/dunia secara real-time.' },
        { name: '!anime <judul>', desc: 'Cari info anime MyAnimeList (rating, studio, episode, sinopsis) via Jikan API.' },
        { name: '!crypto [koin]', desc: 'Cek harga kripto (IDR, USD, perubahan 24 jam) dari CoinGecko.' },
        { name: '!steam <game>', desc: 'Cari harga dan info game Steam Store lengkap dengan link toko.' },
        { name: '!translate <bahasa> <teks>', desc: 'Menerjemahkan teks antar bahasa secara instan (contoh: `!translate en Halo`).' },
        { name: '!meme', desc: 'Menampilkan meme lucu dan kocak terbaru dari Reddit.' }
      ]
    },
    fun: {
      title: '🎲 Hiburan & Mini Games',
      color: 0xF1C40F,
      description: 'Perintah seru untuk meramaikan interaksi member di server.',
      commands: [
        { name: '!giveaway <waktu> <pemenang> <hadiah>', desc: 'Mengadakan undian giveaway otomatis dengan tombol join 🎉 dan timer.' },
        { name: '!roll [max]', desc: 'Kocok dadu angka acak (contoh: `!roll 100`).' },
        { name: '!flip', desc: 'Lempar koin keberuntungan (Heads / Tails).' },
        { name: '!8ball <pertanyaan>', desc: 'Bola ramalan ajaib Magic 8-Ball yang menjawab pertanyaanmu.' }
      ]
    },
    activity: {
      title: '🎭 Bot Activity & Rich Presence',
      color: 0x1ABC9C,
      description: 'Pengaturan status kehadiran dan display bot di server.',
      commands: [
        { name: '!setactivity <type> <teks>', desc: 'Ubah status bot (type: streaming, playing, watching, listening).' },
        { name: '!setstatus <online|idle|dnd>', desc: 'Ubah warna lingkaran status bot (hijau, kuning, merah).' },
        { name: '!resetactivity', desc: 'Mengembalikan status bot ke rotasi otomatis setiap 15 detik.' }
      ]
    }
  };

  // Embed Menu Utama
  function getMainEmbed() {
    return new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📖 Buku Panduan & Daftar Perintah (Help Menu)')
      .setDescription(
        `Halo! Saya adalah **${client.user.username}**, bot multifungsi yang siap melayani kebutuhan server ini.\n\n` +
        '📌 **Prefix Bot:** `!`\n' +
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

  // Komponen Dropdown Select Menu
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

  // Listener Command !help
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!help' || message.content === '!bantuan') {
      const embed = getMainEmbed();
      const row = getSelectRow();

      return message.reply({ embeds: [embed], components: [row] });
    }
  });

  // Listener Interaksi Dropdown Menu
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'help_select_menu') return;

    const val = interaction.values[0];

    if (val === 'home') {
      const homeEmbed = getMainEmbed();
      return interaction.update({ embeds: [homeEmbed] });
    }

    const category = helpCategories[val];
    if (!category) return;

    const embed = new EmbedBuilder()
      .setColor(category.color)
      .setTitle(category.title)
      .setDescription(category.description)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Ketik perintah sesuai format yang tertera di atas' });

    category.commands.forEach((cmd) => {
      embed.addFields({
        name: `\`${cmd.name}\``,
        value: cmd.desc,
        inline: false,
      });
    });

    return interaction.update({ embeds: [embed] });
  });
};
