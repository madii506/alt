// ALT · handle reader: public follower count for an X account, no key. ?h=<handle>
const UA = 'Mozilla/5.0 (alt; +https://alt.vercel.app)';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  const h = String((req.query && req.query.h) || '').replace(/^@/, '').trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(h)) return res.status(400).json({ error: 'bad handle' });
  const out = { handle: h };
  try {  // 0) FxTwitter's public user endpoint (no key)
    const r = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(h)}`, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (r.ok) { const j = await r.json(); const u = j && j.user; if (u && u.screen_name) { out.followers = Number(u.followers); out.name = u.name; out.verified = !!(u.verification && u.verification.verified); out.avatar = u.avatar_url || null; out.exists = true; out.src = 'fxtwitter'; } }
    else if (r.status === 404) { out.exists = false; }
  } catch (e) { out.e0 = String(e.message || e); }
  if (out.followers == null && out.exists !== false) try {  // 1) the old follow-button endpoint
    const r = await fetch(`https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(h)}`, { headers: { 'User-Agent': UA } });
    if (r.ok) { const j = await r.json(); const u = Array.isArray(j) && j[0]; if (u && u.screen_name) { out.followers = Number(u.followers_count); out.name = u.name; out.verified = !!u.verified; out.exists = true; out.src = 'followbutton'; } }
  } catch (e) { out.e1 = String(e.message || e); }
  if (out.followers == null && out.exists !== false) {
    try {  // 2) the syndication timeline page carries the user object
      const r = await fetch(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(h)}`, { headers: { 'User-Agent': UA } });
      if (r.ok) { const t = await r.text(); const m = t.match(/"followers_count":(\d+)/); const n = t.match(/"name":"([^"]{1,60})"/); if (m) { out.followers = Number(m[1]); out.exists = true; out.src = 'timeline'; if (n) out.name = n[1]; } }
    } catch (e) { out.e2 = String(e.message || e); }
  }
  if (out.followers == null && out.exists !== false) out.exists = null;  // unknown, not "not found"
  res.status(200).json(out);
};
