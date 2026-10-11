const fetch = require('node-fetch');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const LANGUAGE_MAP = {
  'id': { code: 'id', name: 'Indonesia' },
  'indonesia': { code: 'id', name: 'Indonesia' },
  'indo': { code: 'id', name: 'Indonesia' },
  'in': { code: 'id', name: 'Indonesia' },
  'jv': { code: 'jv', name: 'Jawa' },
  'jawa': { code: 'jv', name: 'Jawa' },
  'javanese': { code: 'jv', name: 'Jawa' },
  'su': { code: 'su', name: 'Sunda' },
  'sunda': { code: 'su', name: 'Sunda' },
  'sundanese': { code: 'su', name: 'Sunda' },
  'ms': { code: 'ms', name: 'Melayu' },
  'melayu': { code: 'ms', name: 'Melayu' },
  'malay': { code: 'ms', name: 'Melayu' },

  'en': { code: 'en', name: 'Inggris' },
  'inggris': { code: 'en', name: 'Inggris' },
  'english': { code: 'en', name: 'Inggris' },
  'eng': { code: 'en', name: 'Inggris' },

  'ja': { code: 'ja', name: 'Jepang' },
  'jp': { code: 'ja', name: 'Jepang' },
  'jepang': { code: 'ja', name: 'Jepang' },
  'japan': { code: 'ja', name: 'Jepang' },
  'japanese': { code: 'ja', name: 'Jepang' },

  'ko': { code: 'ko', name: 'Korea' },
  'kr': { code: 'ko', name: 'Korea' },
  'korea': { code: 'ko', name: 'Korea' },
  'korean': { code: 'ko', name: 'Korea' },

  'zh': { code: 'zh-CN', name: 'Mandarin / China' },
  'cn': { code: 'zh-CN', name: 'Mandarin / China' },
  'china': { code: 'zh-CN', name: 'Mandarin / China' },
  'chinese': { code: 'zh-CN', name: 'Mandarin / China' },
  'mandarin': { code: 'zh-CN', name: 'Mandarin / China' },

  'ar': { code: 'ar', name: 'Arab' },
  'arab': { code: 'ar', name: 'Arab' },
  'arabic': { code: 'ar', name: 'Arab' },

  'de': { code: 'de', name: 'Jerman' },
  'jerman': { code: 'de', name: 'Jerman' },
  'german': { code: 'de', name: 'Jerman' },

  'fr': { code: 'fr', name: 'Prancis' },
  'prancis': { code: 'fr', name: 'Prancis' },
  'perancis': { code: 'fr', name: 'Prancis' },
  'french': { code: 'fr', name: 'Prancis' },

  'es': { code: 'es', name: 'Spanyol' },
  'spanyol': { code: 'es', name: 'Spanyol' },
  'spanish': { code: 'es', name: 'Spanyol' },

  'ru': { code: 'ru', name: 'Rusia' },
  'rusia': { code: 'ru', name: 'Rusia' },
  'russian': { code: 'ru', name: 'Rusia' },

  'nl': { code: 'nl', name: 'Belanda' },
  'belanda': { code: 'nl', name: 'Belanda' },
  'dutch': { code: 'nl', name: 'Belanda' },

  'it': { code: 'it', name: 'Italia' },
  'italia': { code: 'it', name: 'Italia' },
  'italian': { code: 'it', name: 'Italia' },

  'pt': { code: 'pt', name: 'Portugis' },
  'portugis': { code: 'pt', name: 'Portugis' },
  'portuguese': { code: 'pt', name: 'Portugis' },

  'tr': { code: 'tr', name: 'Turki' },
  'turki': { code: 'tr', name: 'Turki' },
  'turkish': { code: 'tr', name: 'Turki' },

  'vi': { code: 'vi', name: 'Vietnam' },
  'vietnam': { code: 'vi', name: 'Vietnam' },
  'vietnamese': { code: 'vi', name: 'Vietnam' },

  'th': { code: 'th', name: 'Thailand' },
  'thailand': { code: 'th', name: 'Thailand' },
  'thai': { code: 'th', name: 'Thailand' },

  'tl': { code: 'tl', name: 'Filipina / Tagalog' },
  'filipina': { code: 'tl', name: 'Filipina / Tagalog' },
  'tagalog': { code: 'tl', name: 'Filipina / Tagalog' },

  'hi': { code: 'hi', name: 'Hindi / India' },
  'hindi': { code: 'hi', name: 'Hindi / India' },
  'india': { code: 'hi', name: 'Hindi / India' },

  'la': { code: 'la', name: 'Latin' },
  'latin': { code: 'la', name: 'Latin' }
};

function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Menerjemahkan teks antar bahasa secara instan')
    .addStringOption(opt =>
      opt.setName('bahasa')
        .setDescription('Bahasa tujuan (contoh: indonesia, inggris, jepang, korea, arab, dll)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('teks')
        .setDescription('Teks yang ingin diterjemahkan')
        .setRequired(true)
    ),
  async execute(interaction) {
    const rawTarget = interaction.options.getString('bahasa').toLowerCase().trim();
    const text = interaction.options.getString('teks');
    await interaction.deferReply();

    const langInfo = LANGUAGE_MAP[rawTarget];
    const targetCode = langInfo ? langInfo.code : rawTarget;
    const targetDisplayName = langInfo ? `${langInfo.name} (${langInfo.code.toUpperCase()})` : rawTarget.toUpperCase();

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${encodeURIComponent(targetCode)}`;
      const res = await fetch(url);
      const data = await res.json();

      const rawTranslated = data?.responseData?.translatedText || '';
      const translated = decodeHtml(rawTranslated);

      const isInvalidLang =
        data?.responseStatus != 200 ||
        translated.toUpperCase().includes('IS AN INVALID TARGET LANGUAGE') ||
        translated.toUpperCase().includes('MYMEMORY WARNING') ||
        !translated;

      if (isInvalidLang) {
        return interaction.editReply(
          `❌ **Bahasa tujuan "${rawTarget}" tidak dikenali atau tidak didukung!**\n` +
          `*Gunakan nama bahasa (seperti indonesia, inggris, jepang, korea) atau kode ISO (id, en, ja, ko, ar, de, fr, es).*`
        );
      }

      const detectedSource = data?.responseData?.match ? 'Otomatis' : 'Teks Asli';

      const embed = new EmbedBuilder()
        .setColor(0x00A2FF)
        .setTitle('🌐 Penerjemah Bahasa')
        .addFields(
          { name: `📥 Input (${detectedSource})`, value: `\`\`\`${text.slice(0, 1000)}\`\`\`` },
          { name: `📤 Terjemahan (-> ${targetDisplayName})`, value: `\`\`\`${translated.slice(0, 1000)}\`\`\`` }
        )
        .setFooter({ text: `Diterjemahkan untuk ${interaction.user.username}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[TranslateAPI] Error:', err);
      return interaction.editReply('❌ Terjadi kendala saat menghubungi server penerjemah.');
    }
  }
};
