import { createClient } from '@supabase/supabase-js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitAddress(fullAddress = '') {
  const parts = String(fullAddress)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    street: parts[0] || '',
    cityLine: parts.slice(1).join(', ') || ''
  };
}

function buildAdminHtml({ customer, month, box, aboActive }) {
  const customerName = escapeHtml(
    [customer?.anrede, customer?.vorname, customer?.nachname]
      .filter(Boolean)
      .join(' ') || 'Unbekannt'
  );

  const hasAbw = !!customer?.abw_adresse;
  const abw = customer?.abw_info || {};
  const abwSplit = splitAddress(abw?.strasse || '');

  const deliveryName = escapeHtml(
    hasAbw
      ? [abw?.vorname, abw?.nachname].filter(Boolean).join(' ') || customer?.nachname || '—'
      : [customer?.vorname, customer?.nachname].filter(Boolean).join(' ') || '—'
  );

  const deliveryStreet = escapeHtml(
    hasAbw
      ? [abwSplit.street, abw?.adresszusatz || ''].filter(Boolean).join(', ')
      : `${customer?.strasse || ''} ${customer?.hausnummer || ''}`.trim()
  );

  const deliveryCity = escapeHtml(
    hasAbw
      ? [abw?.plz || '', abwSplit.cityLine || abw?.stadt || ''].filter(Boolean).join(' ')
      : `${customer?.plz || ''} ${customer?.stadt || ''}`.trim()
  );

  const deliveryPhone = escapeHtml(customer?.telefon || '—');
  const email = escapeHtml(customer?.email || '—');
  const safeMonth = escapeHtml(month || '—');
  const bestelltyp = aboActive ? 'Monatliches Abo' : 'Einmalig';

  const produkte = (box || [])
    .map(item => {
      const produktName = escapeHtml(item.name || '');
      const groesse = item.groesse ? ` (Gr. ${escapeHtml(item.groesse)})` : '';
      const qty = escapeHtml(item.qty ?? '');

      return `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${produktName}${groesse}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right">× ${qty}</td></tr>`;
    })
    .join('');

  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0F6E56;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="color:#fff;margin:0;font-size:18px;">Neue Bestellung — 24Pflegebox</h2></div><div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;"><p style="margin:0 0 16px;"><strong>Kunde:</strong> ${customerName}<br><strong>E-Mail:</strong> ${email}<br><strong>Monat:</strong> ${safeMonth}<br><strong>Bestelltyp:</strong> ${bestelltyp}</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left">Produkt</th><th style="padding:8px 12px;text-align:right">Menge</th></tr></thead><tbody>${produkte}</tbody></table><p style="margin:0;"><strong>Lieferadresse:</strong><br>${deliveryName}<br>${deliveryStreet}<br>${deliveryCity}<br>Telefon: ${deliveryPhone}</p></div></div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const {
      month,
      box,
      customer,
      aboActive,
      pdfBase64,
      pdfFilename
    } = req.body || {};

    if (!month || !Array.isArray(box) || !customer || !pdfBase64 || !pdfFilename) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof pdfBase64 !== 'string' || pdfBase64.length < 100) {
      return res.status(400).json({ error: 'Invalid PDF payload' });
    }

    const html = buildAdminHtml({ customer, month, box, aboActive });

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `24Pflegebox <${process.env.FROM_EMAIL || 'app@24pflegebox.de'}>`,
        to: ['app@24pflegebox.de'],
        subject: `Neue Bestellung — ${(customer?.vorname || '').trim()} ${(customer?.nachname || '').trim()} — ${month}`,
        html,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64
          }
        ]
      })
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      return res.status(resendResponse.status).json({
        error: 'Resend send failed',
        details
      });
    }

    const data = await resendResponse.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('send-order-email error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
