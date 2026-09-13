// ALT · chain strip: Blockscout stats for Robinhood Chain
const UA = 'Mozilla/5.0 (alt; +https://alt.vercel.app)';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 's-maxage=30');
  try {
    const r = await fetch('https://robinhoodchain.blockscout.com/api/v2/stats', { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('blockscout ' + r.status);
    const j = await r.json();
    res.status(200).json({ block: Number(j.total_blocks), txs: Number(j.total_transactions), addresses: Number(j.total_addresses), gas: j.gas_prices && j.gas_prices.average, at: Date.now() });
  } catch (e) { res.status(200).json({ error: String(e.message || e), at: Date.now() }); }
};
