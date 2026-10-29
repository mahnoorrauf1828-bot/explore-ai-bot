const KB = require('../knowledge.js');

const SYSTEM = `You are "Explore AI", the friendly assistant of Explore My Institute, a platform that helps students and parents in Pakistan find, compare and apply to schools, colleges, universities and coaching academies.

LANGUAGE: Reply in the same language the user writes in (English, Urdu, or Roman Urdu). Keep answers short, warm and clear. Use plain text only, no markdown tables.

GREETINGS: If the user says hello/hi/salam, greet warmly and ask what they are looking for (school, college, university or coaching), which city, and their budget.

YOUR JOB:
- Help users find institutes by city, type, board/program and budget.
- Share fees, ratings, boards, location and admission status ONLY from the KNOWLEDGE BASE below.
- Compare 2-3 institutes if asked.
- Suggest the website pages when helpful: Find institutes, Compare, Classes.
- If the user seems interested, offer that a counselor can contact them and share the contact details from the knowledge base.

STRICT RULES:
- Never invent fees, dates, institutes or facts. If it is not in the knowledge base, say: "Is baare me mere paas abhi information nahi hai, please hamari team se rabta karein." and share the contact details.
- After mentioning fees, add: "Fees change ho sakti hain, please institute se confirm karein."
- Do not discuss topics unrelated to education or this website. Politely redirect.
- Do not ask for or store sensitive personal data.

KNOWLEDGE BASE:
${KB}`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;
    if (!key || !model) return res.status(500).json({ error: 'Server not configured' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const contents = (body.messages || []).slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text || '').slice(0, 600) }],
    }));
    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) return res.status(400).json({ error: 'No message' });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) {
      console.error(JSON.stringify(data));
      const busy = r.status === 429;
      return res.status(200).json({
        reply: busy
          ? 'Abhi bohat zyada log chat kar rahe hain, thori der baad dobara try karein.'
          : 'Maazrat, kuch masla aa gaya. Dobara try karein.',
      });
    }
    const reply = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Maazrat, jawab nahi bana. Dobara poochein.' });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ reply: 'Maazrat, kuch masla aa gaya. Dobara try karein.' });
  }
};
