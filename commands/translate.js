const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('!translate') || message.content.startsWith('!tr')) {
      const args = message.content.trim().split(/\s+/).slice(1);
      const targetLang = args[0]?.toLowerCase();
      const text = args.slice(1).join(' ');

      if (!targetLang || !text) {
        return message.reply(
          '❌ **Format salah!**\n' +
          'Gunakan: `!translate <kode_bahasa> <teks>`\n' +
          'Contoh:\n' +
          '• `!translate en Selamat pagi semuanya!` *(ke Inggris)*\n' +
          '• `!translate id How are you today?` *(ke Indonesia)*\n' +
          '• `!translate ja Terima kasih banyak` *(ke Jepang)*\n' +
          '• `!translate ar Semoga harimu menyenangkan` *(ke Arab)*'
        );
      }

      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(targetLang)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !data.responseData || !data.responseData.translatedText) {
          return message.reply('❌ Gagal menerjemahkan teks. Pastikan kode bahasa benar (contoh: `id`, `en`, `ja`, `ko`, `ar`, `de`).');
        }

        const translated = data.responseData.translatedText;
        const detectedSource = data.responseData.match ? 'Otomatis' : 'Teks Asli';

        const embed = new EmbedBuilder()
          .setColor(0x00A2FF)
          .setTitle('🌐 Penerjemah Bahasa')
          .addFields(
            { name: `📥 Input (${detectedSource})`, value: `\`\`\`${text.slice(0, 1000)}\`\`\`` },
            { name: `📤 Terjemahan (-> ${targetLang.toUpperCase()})`, value: `\`\`\`${translated.slice(0, 1000)}\`\`\`` }
          )
          .setFooter({ text: `Diterjemahkan untuk ${message.author.username}` })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (err) {
        console.error('[TranslateAPI] Error:', err);
        return message.reply('❌ Terjadi kendala saat memproses terjemahan bahasa.');
      }
    }
  });
};
