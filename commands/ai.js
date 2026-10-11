const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits 
} = require('discord.js');

// Multi-turn conversation memory per user
const conversationMemory = new Map();
const lastActiveMap = new Map();
const MAX_HISTORY = 6;
const MEMORY_TIMEOUT_MS = 10 * 60 * 1000; // 10 menit

function cleanOldMemory() {
  const now = Date.now();
  for (const [userId, lastTime] of lastActiveMap.entries()) {
    if (now - lastTime > MEMORY_TIMEOUT_MS) {
      conversationMemory.delete(userId);
      lastActiveMap.delete(userId);
    }
  }
}
setInterval(cleanOldMemory, 60000).unref();

// Helper function untuk simpan konfigurasi ke .env
function saveKeyToEnv(keyName, keyValue) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const regex = new RegExp(`^${keyName}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${keyName}=${keyValue}`);
  } else {
    envContent += `\n${keyName}=${keyValue}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  process.env[keyName] = keyValue;
}

// 1. Atria AI API caller (Atria-Dawn-Preview 744B MoE)
async function callAtria(prompt, userHistory, authorName, apiKey) {
  const systemPrompt =
    `Kamu adalah "Babu Tuan Muda Hotwill", asisten Discord yang sangat cerdas, setia, ramah, dan berdedikasi tinggi. Dan aku dibuat oleh Hotwill (Dimas). ` +
    `Kamu berbicara dalam bahasa Indonesia yang santai, modern, cerdas, dan bersahabat. ` +
    `Lawan bicaramu bernama "${authorName}". ` +
    `Jika lawan bicaramu adalah Tuan Muda Hotwill atau admin server, layani dengan penuh rasa hormat dan kesetiaan. ` +
    `Berikan jawaban yang jelas, akurat, informatif, dan to-the-point. ` +
    `Gunakan format markdown Discord seperti **bold**, \`inline code\`, bullet points •, dan blok kode dengan penanda bahasa (\`\`\`js, \`\`\`py, dll) jika relevan.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...userHistory,
    { role: 'user', content: prompt }
  ];

  const model = process.env.ATRIA_MODEL || 'Atria-Dawn-Preview';

  const response = await fetch('https://api.atria-asi.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1200,
      temperature: 0.7
    }),
    timeout: 60000
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Atria HTTP ${response.status}: ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  let reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Balasan kosong dari Atria AI');

  if (reply.includes('</think>')) {
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  return reply;
}

// 2. Groq API caller (Llama 3.3 / Llama 3.1)
async function callGroq(prompt, userHistory, authorName, apiKey) {
  const systemPrompt =
    `Kamu adalah "Babu Tuan Muda Hotwill", asisten Discord yang sangat cerdas, loyal, ramah, dan berdedikasi tinggi. ` +
    `Kamu berbicara dalam bahasa Indonesia yang santai, modern, cerdas, dan bersahabat. ` +
    `Lawan bicaramu bernama "${authorName}". ` +
    `Jika lawan bicaramu adalah Tuan Muda Hotwill atau admin server, layani dengan penuh rasa hormat dan kesetiaan. ` +
    `Berikan jawaban yang jelas, akurat, informatif, dan to-the-point. ` +
    `Gunakan format markdown Discord seperti **bold**, \`inline code\`, bullet points •, dan codeblock (\`\`\`js, \`\`\`py, dll) jika relevan.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...userHistory,
    { role: 'user', content: prompt }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7
    }),
    timeout: 30000
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq HTTP ${response.status}: ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Balasan kosong dari Groq');
  return reply;
}

// 3. Google Gemini API caller (gemini-2.0-flash / gemini-1.5-flash)
async function callGemini(prompt, userHistory, authorName, apiKey) {
  const systemInstruction =
    `Kamu adalah "Babu Tuan Muda Hotwill", asisten Discord yang sangat cerdas, loyal, ramah, dan berdedikasi tinggi. ` +
    `Kamu berbicara dalam bahasa Indonesia yang santai, modern, cerdas, dan bersahabat. ` +
    `Lawan bicaramu bernama "${authorName}". ` +
    `Jika lawan bicaramu adalah Tuan Muda Hotwill atau admin server, layani dengan penuh rasa hormat dan kesetiaan. ` +
    `Berikan jawaban yang jelas, akurat, informatif, dan to-the-point. ` +
    `Gunakan format markdown Discord seperti **bold**, \`inline code\`, bullet points •, dan codeblock jika relevan.`;

  const contents = [];
  for (const h of userHistory) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    }),
    timeout: 30000
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error('Balasan kosong dari Gemini');
  return reply;
}

// Main AI dispatcher
async function askAI(prompt, userId, authorName) {
  let userHistory = conversationMemory.get(userId);
  if (!userHistory) {
    userHistory = [];
    conversationMemory.set(userId, userHistory);
  }
  lastActiveMap.set(userId, Date.now());

  let reply = null;
  let providerUsed = '';

  const atriaKey = process.env.ATRIA_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (atriaKey && atriaKey.trim()) {
    try {
      reply = await callAtria(prompt, userHistory, authorName, atriaKey);
      providerUsed = 'Atria AI (Atria-Dawn-Preview 744B)';
    } catch (err) {
      console.warn('[AI Atria Warning]:', err.message);
    }
  }

  if (!reply && groqKey && groqKey.trim()) {
    try {
      reply = await callGroq(prompt, userHistory, authorName, groqKey);
      providerUsed = 'Groq (Llama 3.3)';
    } catch (err) {
      console.warn('[AI Groq Warning]:', err.message);
    }
  }

  if (!reply && geminiKey && geminiKey.trim()) {
    try {
      reply = await callGemini(prompt, userHistory, authorName, geminiKey);
      providerUsed = 'Google Gemini Flash';
    } catch (err) {
      console.error('[AI Gemini Error]:', err.message);
      throw err;
    }
  }

  if (!reply) {
    throw new Error('Semua provider AI yang terpasang sedang tidak dapat dijangkau.');
  }

  userHistory.push({ role: 'user', content: prompt });
  userHistory.push({ role: 'assistant', content: reply });
  if (userHistory.length > MAX_HISTORY) {
    userHistory.splice(0, userHistory.length - MAX_HISTORY);
  }

  return { status: 'ok', reply, provider: providerUsed };
}

const aiCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Tanya jawab cerdas dengan asisten AI')
    .addStringOption(opt =>
      opt.setName('pertanyaan')
        .setDescription('Pertanyaan atau teks yang ingin kamu tanyakan ke AI')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('pertanyaan');

    const hasAtria = Boolean(process.env.ATRIA_API_KEY && process.env.ATRIA_API_KEY.trim());
    const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

    if (!hasAtria && !hasGroq && !hasGemini) {
      return interaction.reply({
        content: '⚙️ **Fitur AI Belum Dikonfigurasi!**\nAdmin belum memasukkan API Key AI. Gunakan `/ai-key` untuk menyetel kunci AI.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const displayName = interaction.member?.displayName || interaction.user.username;

    try {
      const res = await askAI(query, interaction.user.id, displayName);
      const aiReply = res.reply;

      if (aiReply.length > 1950) {
        const chunks = aiReply.match(/[\s\S]{1,1900}/g) || [aiReply];
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp(chunks[i]);
        }
      } else {
        await interaction.editReply(aiReply);
      }
    } catch (err) {
      console.error('[AI Slash Error]:', err.message);
      return interaction.editReply({
        content: `⚠️ **Maaf**, terjadi kendala saat memproses jawaban AI:\n\`${err.message.slice(0, 150)}\``
      });
    }
  }
};

const aiKeyCommand = {
  data: new SlashCommandBuilder()
    .setName('ai-key')
    .setDescription('Atur API Key AI (Atria / Groq / Gemini) - Khusus Admin')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('provider')
        .setDescription('Pilih provider AI')
        .setRequired(true)
        .addChoices(
          { name: 'Atria AI (Atria-Dawn-Preview)', value: 'ATRIA_API_KEY' },
          { name: 'Groq (Llama 3.3)', value: 'GROQ_API_KEY' },
          { name: 'Google Gemini Flash', value: 'GEMINI_API_KEY' }
        )
    )
    .addStringOption(opt =>
      opt.setName('key')
        .setDescription('Masukkan API Key rahasia')
        .setRequired(true)
    ),
  async execute(interaction) {
    const provider = interaction.options.getString('provider');
    const keyVal = interaction.options.getString('key').trim();

    try {
      saveKeyToEnv(provider, keyVal);
      let provName = 'Atria AI';
      if (provider === 'GROQ_API_KEY') provName = 'Groq (Llama 3.3)';
      if (provider === 'GEMINI_API_KEY') provName = 'Google Gemini Flash';

      return interaction.reply({
        content: `✅ Konfigurasi model **${provName}** berhasil disimpan dan langsung aktif!`,
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({
        content: `❌ Gagal menyimpan kunci: ${err.message}`,
        ephemeral: true
      });
    }
  }
};

const aiResetCommand = {
  data: new SlashCommandBuilder()
    .setName('ai-reset')
    .setDescription('Reset riwayat percakapan dengan asisten AI kamu'),
  async execute(interaction) {
    conversationMemory.delete(interaction.user.id);
    lastActiveMap.delete(interaction.user.id);
    return interaction.reply({
      content: '🧹 **Memori obrolan kita sudah direset!** Silakan ajukan pertanyaan baru dengan `/ai`.',
      ephemeral: true
    });
  }
};

module.exports = {
  commands: [aiCommand, aiKeyCommand, aiResetCommand],
  init(client) {
    // Dukungan interaksi via @mention bot di channel teks
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild) return;
      const isMentioned = message.mentions.has(client.user.id) && !message.mentions.everyone;
      if (!isMentioned) return;

      const query = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
      if (!query) {
        return message.reply('Halo! Ketik `/ai <pertanyaan>` atau sebut pertanyaanmu langsung setelah mention saya!');
      }

      try {
        await message.channel.sendTyping();
        const displayName = message.member?.displayName || message.author.username;
        const res = await askAI(query, message.author.id, displayName);
        const aiReply = res.reply;

        if (aiReply.length > 1950) {
          const chunks = aiReply.match(/[\s\S]{1,1900}/g) || [aiReply];
          for (let i = 0; i < chunks.length; i++) {
            if (i === 0) await message.reply(chunks[i]);
            else await message.channel.send(chunks[i]);
          }
        } else {
          await message.reply(aiReply);
        }
      } catch (err) {
        console.error('[AI Mention Error]:', err.message);
        message.reply(`⚠️ Terjadi kendala AI: \`${err.message.slice(0, 150)}\``).catch(() => {});
      }
    });
  }
};
