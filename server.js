const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// অনলাইন হোস্টিংয়ের পেছনে চললে ভিজিটরের আসল IP পেতে এটা লাগে
app.set('trust proxy', 1);

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== মেসেজ জমানোর ফাইল ==========
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');

// ========== স্প্যাম ঠেকাতে: একই IP থেকে ১০ মিনিটে সর্বোচ্চ ৫টা মেসেজ ==========
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({
      ok: false,
      message: 'অনেকগুলো মেসেজ পাঠানো হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করো।'
    });
  }

  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

// পুরোনো হিসাব মাঝেমধ্যে মুছে মেমরি হালকা রাখা
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length) hits.set(ip, recent);
    else hits.delete(ip);
  }
}, WINDOW_MS).unref();

// ========== Contact ফর্মের মেসেজ নেওয়া ==========
function fail(res, message) {
  return res.status(400).json({ ok: false, message });
}

app.post('/api/contact', rateLimit, (req, res) => {
  const body = req.body || {};

  // লুকানো ঘর (website) বট ভরে ফেলে, মানুষ দেখতেই পায় না। ভরা থাকলে চুপচাপ বাদ দাও
  if (body.website) return res.json({ ok: true, message: 'ধন্যবাদ!' });

  const clean = (value) => String(value || '').trim();
  const name = clean(body.name);
  const email = clean(body.email);
  const subject = clean(body.subject);
  const message = clean(body.message);

  if (name.length < 2 || name.length > 80) {
    return fail(res, 'নাম ২ থেকে ৮০ অক্ষরের মধ্যে হতে হবে।');
  }
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, 'সঠিক একটা ইমেইল দাও।');
  }
  if (subject.length > 120) {
    return fail(res, 'বিষয় ১২০ অক্ষরের বেশি হতে পারবে না।');
  }
  if (message.length < 10 || message.length > 2000) {
    return fail(res, 'মেসেজ ১০ থেকে ২০০০ অক্ষরের মধ্যে হতে হবে।');
  }

  try {
    const list = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    list.push({ name, email, subject, message, date: new Date().toISOString() });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('মেসেজ সেভ হয়নি:', err.message);
    return res.status(500).json({ ok: false, message: 'সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করো।' });
  }

  console.log(`নতুন মেসেজ এসেছে: ${name} <${email}>`);
  res.json({ ok: true, message: 'ধন্যবাদ! তোমার মেসেজ পৌঁছে গেছে, শীঘ্রই উত্তর দেব।' });
});

// অন্য কোনো error হলে সুন্দর করে জানানো
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ ok: false, message: 'অনুরোধটি পাঠানো যায়নি।' });
});

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});