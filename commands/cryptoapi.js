const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    if (cmd === '!crypto') {
      const coin = (args[0] || 'bitcoin').toLowerCase();

      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=idr,usd&include_24hr_change=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data[coin]) {
          return message.reply('❌ **Coin tidak ditemukan!** Gunakan ID CoinGecko seperti `bitcoin`, `ethereum`, `solana`, `dogecoin`, dll.');
        }

        const coinData = data[coin];
        const hargaIDR = Number(coinData.idr || 0).toLocaleString('id-ID');
        const hargaUSD = Number(coinData.usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        const change24h = Number(coinData.usd_24h_change || 0);
        const isProfit = change24h >= 0;

        const embed = new EmbedBuilder()
          .setColor(isProfit ? 0x00FF88 : 0xFF3366)
          .setTitle(`🪙 Informasi Kripto: ${coin.toUpperCase()}`)
          .setDescription(`Status pergerakan harga pasar 24 jam terakhir: **${isProfit ? '📈 Menguat' : '📉 Melemah'}**`)
          .addFields(
            { name: '🇮🇩 Harga (IDR)', value: `\`Rp ${hargaIDR}\``, inline: true },
            { name: '🇺🇸 Harga (USD)', value: `\`$${hargaUSD}\``, inline: true },
            { name: '📊 Perubahan 24 Jam', value: `\`${isProfit ? '+' : ''}${change24h.toFixed(2)}%\``, inline: true }
          )
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/6001/6001368.png')
          .setFooter({ text: 'Data disediakan oleh CoinGecko', iconURL: 'https://static.coingecko.com/s/thumbnail-004632ef9e3451da3246ba254970645691754201d328ef7bc02f3d63e8260043.png' })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('[CryptoAPI] Error:', error);
        return message.reply('❌ Gagal mengambil data dari CoinGecko. Coba lagi dalam beberapa saat.');
      }
    }
  });
};
