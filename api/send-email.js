// api/send-email.js
// Vercel Serverless Function — hält den Resend API-Key serverseitig

export default async function handler(req, res) {
  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS Header für die eigene Domain
  const allowedOrigins = [
    'https://24pflegebox.de',
    'https://www.24pflegebox.de',
    // Vercel Preview URLs erlauben
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.some(o => origin?.startsWith(o)) || origin?.includes('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  // Einfache Validierung
  if (typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Rate limiting (einfach: max 10 Requests pro Minute pro IP)
  // Für Produktion: Redis oder Upstash verwenden

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `24Pflegebox <${process.env.FROM_EMAIL || 'app@24pflegebox.de'}>`,
        to: [to],
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', response.status, errorData);
      return res.status(500).json({ error: 'Email sending failed' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
