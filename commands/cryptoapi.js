const fetch = require('node-fetch');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd === '!crypto') {
      const coin = (args[0] || 'bitcoin').toLowerCase();

      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=idr,usd&include_24hr_change=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data[coin]) {
          return message.reply('❌ Coin tidak ditemukan. Gunakan ID CoinGecko seperti `bitcoin`, `solana`, atau `dogecoin`.');
        }

        const hargaIDR = data[coin].idr.toLocaleString('id-ID');
        const hargaUSD = data[coin].usd.toLocaleString('en-US');
        const perubahan24 = data[coin].usd_24h_change.toFixed(2);

        message.channel.send(`🪙 **${coin.toUpperCase()}**
💵 Harga IDR: Rp ${hargaIDR}
💲 Harga USD: $${hargaUSD}
📉 Perubahan 24 Jam: ${perubahan24}%`);
      } catch (error) {
        console.error(error);
        message.reply('❌ Gagal mengambil data dari CoinGecko.');
      }
    }
  });
};
