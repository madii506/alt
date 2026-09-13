// ALT · tweet reader: X syndication endpoint (no key) with oEmbed fallback. ?id=<tweet id> or ?url=<tweet url>
const UA = 'Mozilla/5.0 (alt; +https://alt.vercel.app)';
function token(id) { return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, ''); }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 's-maxage=20');
  let id = String((req.query && req.query.id) || '');
  const url = String((req.query && req.query.url) || '');
  if (!id && url) { const m = url.match(/status(?:es)?\/(\d{1,25})/); if (m) id = m[1]; }
  if (!/^\d{1,25}$/.test(id)) return res.status(400).json({ error: 'bad tweet id' });
  const out = { id };
  try {
    const r = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${token(id)}`, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (r.ok) { const j = await r.json();
      if (j && j.user) { out.author = j.user.screen_name; out.name = j.user.name; out.verified = !!(j.user.is_blue_verified || j.user.verified); out.text = j.text; out.likes = j.favorite_count; out.views = j.views && j.views.count ? Number(j.views.count) : null; out.created = j.created_at; out.inReplyTo = j.in_reply_to_screen_name || null; out.parent = (j.parent && j.parent.id_str) || j.in_reply_to_status_id_str || null; out.src = 'syndication'; } }
  } catch (e) { out.syndication_error = String(e.message || e); }
  if (!out.author) {
    try {
      const r = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent('https://x.com/i/status/' + id)}&omit_script=1`, { headers: { 'User-Agent': UA } });
      if (r.ok) { const j = await r.json(); const m = (j.author_url || '').match(/(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})/); out.author = m ? m[1] : null; out.name = j.author_name; out.text = String(j.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); out.src = 'oembed'; }
    } catch (e) { out.oembed_error = String(e.message || e); }
  }
  res.status(200).json(out);
};
