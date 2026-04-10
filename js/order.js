/* ═══════════════════════════════════════════════
   24Pflegebox — order.js
   E-Mail-Templates, Bestelllogik, PDF-Generierung
   ═══════════════════════════════════════════════ */

// ══════════════════════════════════════════════════
// E-MAIL TEMPLATES
// ══════════════════════════════════════════════════

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOrderEmailAdmin(box, c, month, aboActive) {
  const name = escapeHtml(
    [c?.anrede, c?.vorname, c?.nachname].filter(Boolean).join(' ') || 'Unbekannt'
  );

  const kundenAdresse = escapeHtml(
  c?.strasse
    ? `${c.strasse} ${c.hausnummer}, ${c.plz} ${c.stadt}`
    : (c?.adresse || '—')
);

const lieferAdresseRaw =
  c?.abw_adresse
    ? c.abw_adresse
    : (c?.abw_strasse || c?.abw_hausnummer || c?.abw_plz || c?.abw_stadt)
      ? [
          [c?.abw_strasse, c?.abw_hausnummer].filter(Boolean).join(' '),
          [c?.abw_plz, c?.abw_stadt].filter(Boolean).join(' '),
          c?.abw_adresszusatz
        ].filter(Boolean).join(', ')
      : '';

const lieferAdresse = escapeHtml(lieferAdresseRaw || '—');
const hasAbweichendeLieferadresse = !!lieferAdresseRaw;

  const email = escapeHtml(c?.email || '—');
  const safeMonth = escapeHtml(month || '—');
  const bestelltyp = aboActive ? 'Monatliches Abo' : 'Einmalig';

  const produkte = box.map(i => {
    const produktName = escapeHtml(i.name || '');
    const groesse = i.groesse ? ` (Gr. ${escapeHtml(i.groesse)})` : '';
    const qty = escapeHtml(i.qty ?? '');
    return `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${produktName}${groesse}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right">× ${qty}</td></tr>`;
  }).join('');

  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0F6E56;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="color:#fff;margin:0;font-size:18px;">Neue Bestellung — 24Pflegebox</h2></div><div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;"><p style="margin:0 0 16px;"><strong>Kunde:</strong> ${name}<br><strong>E-Mail:</strong> ${email}<br><strong>Monat:</strong> ${safeMonth}<br><strong>Bestelltyp:</strong> ${bestelltyp}</p><table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><thead><tr style="background:#f5f5f5"><th style="padding:8px 12px;text-align:left">Produkt</th><th style="padding:8px 12px;text-align:right">Menge</th></tr></thead><tbody>${produkte}</tbody></table><p style="margin:0;">
  <strong>Kundenanschrift:</strong><br>${kundenAdresse}
  ${hasAbweichendeLieferadresse ? `<br><br><strong>Lieferanschrift:</strong><br>${lieferAdresse}` : ''}
</p></div></div>`;
}

function buildOrderEmailKunde(box, c, month, aboActive) {
  const anrede = c?.anrede === 'Herr' ? 'Herr' : c?.anrede === 'Frau' ? 'Frau' : '';
  const nachname = escapeHtml(c?.nachname || 'Kunde');
  const anredeNachname = [anrede, nachname].filter(Boolean).join(' ');
  const safeMonth = escapeHtml(month || '—');
  const safeAdminEmail = escapeHtml(ADMIN_EMAIL);
  const safePhoneDisplay = '04052477340';
  const safePhoneHref = '+494052477340';

  const produkte = box.map(i => {
    const produktName = escapeHtml(i.name || '');
    const groesse = i.groesse ? ` (Gr. ${escapeHtml(i.groesse)})` : '';
    const qty = escapeHtml(i.qty ?? '');
    return `<li style="padding:4px 0">${produktName}${groesse} × ${qty}</li>`;
  }).join('');

  const aboHinweis = aboActive
    ? `<p style="margin:16px 0 0;">Sofern Sie ein monatliches Abo gewählt haben, wird dieses nach erfolgreicher Prüfung Ihres Antrags in der weiteren Versorgung berücksichtigt.</p>`
    : '';

  const legalFooter = `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#666;line-height:1.7;">
      <strong>Medical Deal GmbH</strong><br>
      Kieler Straße 407<br>
      22525 Hamburg<br>
      Geschäftsführer: Dennis Himburg & Mohammad Bazargan<br>
      Handelsregister: HRB 186455 Amtsgericht Hamburg<br>
      USt-IdNr.: DE370434539<br>
      IK-Nummer: 330205860<br>
      E-Mail: <a href="mailto:app@24pflegebox.de" style="color:#1D9E75">app@24pflegebox.de</a><br>
      Telefon: <a href="tel:+494052477340" style="color:#1D9E75">04052477340</a>
    </div>
  `;

  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0F6E56;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="color:#fff;margin:0;font-size:18px;">Eingangsbestätigung Ihres Antrags</h2><p style="color:#9FE1CB;margin:6px 0 0;font-size:14px;">24Pflegebox — ${safeMonth}</p></div><div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;"><p>Guten Tag ${anredeNachname},</p><p>vielen Dank für Ihren Antrag bei 24Pflegebox.</p><p>Ihre Unterlagen sind bei uns eingegangen und werden nun von unserem Team geprüft. Nach erfolgreicher Prüfung und Freigabe durch die zuständige Stelle erfolgt die weitere Bearbeitung Ihrer Versorgung.</p><div style="background:#E1F5EE;border-radius:8px;padding:16px;margin:16px 0;"><strong style="color:#085041;">Ihre beantragten Produkte:</strong><ul style="margin:8px 0 0;padding-left:20px;color:#0F6E56">${produkte}</ul></div>${aboHinweis}<p style="margin-top:24px;">Sollten Sie noch Fragen haben, rufen Sie uns gerne an oder schreiben Sie uns eine Mail.<br>Telefon: <a href="tel:${safePhoneHref}" style="color:#1D9E75">${safePhoneDisplay}</a><br>E-Mail: <a href="mailto:${safeAdminEmail}" style="color:#1D9E75">${safeAdminEmail}</a></p>${legalFooter}</div></div>`;
}

function buildExtraEmail(type, c, anzahl) {
  const name = escapeHtml(
    [c?.anrede, c?.vorname, c?.nachname].filter(Boolean).join(' ') || 'Unbekannt'
  );

  const adresse = escapeHtml(
    c?.strasse
      ? `${c.strasse} ${c.hausnummer}, ${c.plz} ${c.stadt}`
      : (c?.adresse || '—')
  );

  const email = escapeHtml(c?.email || '—');
  const telefon = escapeHtml(c?.telefon || '—');
  const titel = escapeHtml(type === 'bett' ? 'Waschbare Bettschutzeinlagen' : 'Hausnotrufsystem');
  const detail = escapeHtml(type === 'bett' ? `Anzahl: ${anzahl} Einlage(n)` : 'Einmalige Beantragung über Vitalset GmbH');

  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0F6E56;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="color:#fff;margin:0;font-size:18px;">Neuer Antrag — ${titel}</h2></div><div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;"><p><strong>Kunde:</strong> ${name}<br><strong>E-Mail:</strong> ${email}<br><strong>Telefon:</strong> ${telefon}<br><strong>${detail}</strong><br><strong>Lieferadresse:</strong> ${adresse}</p></div></div>`;
}

// Wandelt das im Browser erzeugte PDF-Blob in einen Base64-String um,
// damit die Datei serverseitig per Resend als E-Mail-Anhang versendet werden kann.

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

// Hilfsfunktion: Wandelt das im Browser erzeugte PDF-Blob in Base64 um,
// damit die Datei an die serverseitige Bestell-Mail-Route übergeben
// und dort als Anhang an app@24pflegebox.de versendet werden kann.

async function sendOrderEmailWithPdf({ box, customer, month, aboActive, pdfDoc }) {
  const { data: { session } } = await sb.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Keine gültige Sitzung vorhanden');
  }

  const pdfBlob = pdfDoc.output('blob');
  const pdfBase64 = await blobToBase64(pdfBlob);
  const pdfFilename = `Pflegebox_Antrag_${month.replace(/\s+/g, '_')}.pdf`;

  const resp = await fetch('/api/send-order-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      month,
      box,
      customer,
      aboActive,
      pdfBase64,
      pdfFilename
    })
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Admin-Mail fehlgeschlagen: ${errorText}`);
  }

  return resp.json();
}

// ══════════════════════════════════════════════════
// ORDER (FIX: Variable-Hoisting + Doppelklick-Schutz)
// ══════════════════════════════════════════════════

async function doOrder() {
  const box = getCurrentBox();
  if (!box.length || !state.user) return;

  const checkbox = document.getElementById('sig-checkbox');
  if (checkbox && !checkbox.checked) { showToast('Bestätigung fehlt', 'Bitte bestätigen Sie den Antrag.'); return; }
  if (!sigHasData) { showToast('Unterschrift fehlt', 'Bitte unterschreiben Sie den Antrag.'); return; }

  // Doppelklick-Schutz
  const orderBtn = document.getElementById('order-submit-btn');
  if (orderBtn.disabled) return;
  orderBtn.disabled = true;
  orderBtn.innerHTML = '<div class="spinner"></div> Wird gesendet...';

  const signatureDataURL = getSignatureDataURL();

  // FIX: Variablen VOR generatePDF deklarieren
  const month = nowMonth();
  const c = state.customer;

  loading(true, 'PDF wird erstellt...');

  const sigName = document.getElementById('sig-name')?.value || '';
  let pdfDoc = null;
  try {
  pdfDoc = await generatePDF(box, c, month, signatureDataURL, sigName);
} catch (e) {
  console.error('PDF Fehler:', e);
  loading(false);
  orderBtn.disabled = false;
  orderBtn.innerHTML = 'Antrag abschicken';
  showToast('PDF-Fehler', 'Antrag konnte nicht erstellt werden: ' + e.message);
  return;
}

  loading(true, 'Bestellung wird gespeichert...');

  const orderData = {
    customer_id: state.user.id, monat: month, produkte: box,
    bestelltyp: state.aboActive ? 'abo' : 'manuell', status: 'In Bearbeitung',
    bettschutz_anzahl: state.bettschutzAktiv ? state.bettschutzAnzahl : 0,
    hausnotruf: state.hausnotrufAktiv
  };

  const { error: orderErr } = await sb.from('orders').insert(orderData);

  if (orderErr) {
    loading(false); orderBtn.disabled = false; orderBtn.innerHTML = 'Antrag abschicken';
    showToast('Fehler', 'Bestellung konnte nicht gespeichert werden.');
    return;
  }

  await sb.from('customers').update({ abo_aktiv: state.aboActive, abo_box: box }).eq('id', state.user.id);

   // Reifenfolge von doOrder() Korrektur
   
  await sendOrderEmailWithPdf({
  box,
  customer: c,
  month,
  aboActive: state.aboActive,
  pdfDoc
});

const kundeHtml = buildOrderEmailKunde(box, c, month, state.aboActive);
await sendEmail(
  state.user.email,
  `Ihre Pflegebox für ${month} — Bestellung eingegangen`,
  kundeHtml
);

  if (pdfDoc) {
    try {
      const blob = pdfDoc.output('blob'); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `Pflegebox_Antrag_${month.replace(' ','_')}.pdf`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    } catch(e) { console.error('PDF Download Fehler:', e); }
  }

  loading(false); orderBtn.disabled = false; orderBtn.innerHTML = 'Antrag abschicken';

  // Confirmation Screen
  const cp = document.getElementById('confirm-products'); cp.innerHTML = '';
  box.forEach(item => { const r=document.createElement('div'); r.className='summary-row'; r.innerHTML=`<span style="color:var(--gray-600)">${item.name}</span><span style="font-weight:600">× ${item.qty}</span>`; cp.appendChild(r); });

  const aboInfo = document.getElementById('confirm-abo-info');
  if (state.aboActive) { aboInfo.style.display='block'; document.getElementById('confirm-abo-text').textContent='Ihr Abo ist aktiv. Diese Box wird automatisch jeden Monat bestellt.'; }
  else { aboInfo.style.display='none'; }

  if (state.customer) state.customer.abo_aktiv = state.aboActive;
  if (pdfDoc) { window._lastPdfDoc = pdfDoc; window._lastPdfMonth = month; document.getElementById('pdf-download-btn').style.display = 'block'; }
  goTo('confirmation');
}

function downloadLastPDF() {
  if (!window._lastPdfDoc) { showToast('Kein PDF verfügbar','Bitte stellen Sie eine neue Bestellung auf.'); return; }
  try {
    const blob=window._lastPdfDoc.output('blob'); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`Pflegebox_Antrag_${(window._lastPdfMonth||'Bestellung').replace(' ','_')}.pdf`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},2000);
  } catch(e) { showToast('Download fehlgeschlagen','Bitte versuchen Sie es erneut.'); }
}

// ══════════════════════════════════════════════════
// PDF GENERIERUNG (jsPDF)
// ══════════════════════════════════════════════════

async function generatePDF(box, cust, month, sigDataURL, sigName) {
  const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDFLib) throw new Error('jsPDF nicht geladen');
  const doc = new jsPDFLib({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, H=297, M=20;
  const TEAL=[15,110,86], TEAL_L=[225,245,238], GRAY=[95,94,90], LGRAY=[239,239,235], BLACK=[0,0,0], WHITE=[255,255,255], RED=[204,0,0];

  function setFill(rgb){doc.setFillColor(rgb[0],rgb[1],rgb[2]);}
  function setStroke(rgb){doc.setDrawColor(rgb[0],rgb[1],rgb[2]);}
  function setTxt(rgb){doc.setTextColor(rgb[0],rgb[1],rgb[2]);}
  const hw=(W-2*M)/2;
  const today = new Date().toLocaleDateString('de-DE');

  function hline(y,x1,x2,lw=0.3,color=GRAY){if(Array.isArray(color)){doc.setDrawColor(color[0],color[1],color[2]);}else{doc.setDrawColor(95,94,90);}doc.setLineWidth(lw);doc.line(x1||M,y,x2||(W-M),y);}
  function secNum(x,y,n){setFill(TEAL);doc.roundedRect(x,y-4.5,5,5,1,1,'F');setTxt(WHITE);doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(String(n),x+2.5,y-0.8,{align:'center'});}
  function fieldBox(x,y,w,h,lbl,val=''){setStroke([204,204,204]);doc.setLineWidth(0.3);doc.rect(x,y,w,h);doc.setFontSize(6);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text(lbl,x+1.5,y+3);if(val){doc.setFontSize(8);setTxt(BLACK);doc.text(String(val),x+1.5,y+h-2);}}
  function chkBox(x,y,checked=false){
  setStroke([68,68,65]);
  doc.setLineWidth(0.4);
  doc.rect(x,y,3.5,3.5);
  if(checked){
    setStroke(TEAL);
    doc.setLineWidth(0.8);
    doc.line(x+0.7, y+1.9, x+1.5, y+2.7);
    doc.line(x+1.5, y+2.7, x+2.9, y+0.8);
  }
}
  function chkLbl(x,y,checked,label,size=7,maxW=null){chkBox(x,y);doc.setFontSize(size);doc.setFont('helvetica','normal');setTxt(BLACK);let lbl=label;if(maxW){while(lbl.length>0&&doc.getTextWidth(lbl)>maxW)lbl=lbl.slice(0,-1);}doc.text(lbl,x+5,y+3);}
  function wrapText(x,y,text,maxW,size=7.5,lineH=4){doc.setFontSize(size);doc.setFont('helvetica','normal');setTxt(BLACK);const lines=doc.splitTextToSize(text,maxW);doc.text(lines,x,y);return y+lines.length*lineH;}

  // ═══ SEITE 1 ═══
  setFill(TEAL);doc.rect(0,0,W,26,'F');setTxt(WHITE);doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('24Pflegebox',M,11);
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text('Bestellformular Pflegebox — Stellen Sie Ihre individuelle Box zusammen',M,18);
  setTxt([159,225,203]);doc.setFontSize(8);doc.text('Pflegebox für '+month+'  ·  Produktgruppe 54',M,24);

  let y=35;
  secNum(M,y,1);doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Name der/des Antragstellers',M+7,y-1);
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('(Nur für Rückfragen. Ihre Daten werden nicht an Dritte weitergegeben.)',M,y+3);
  doc.setFont('helvetica','bold');doc.text('Bitte in Druckbuchstaben ausfüllen',W-M,y+3,{align:'right'});
  y+=7;hline(y);y+=5;
  chkLbl(M,y,cust.anrede==='Frau','Frau:');chkLbl(M+22,y,cust.anrede==='Herr','Herr:');y+=7;
  fieldBox(M,y,hw-1,11,'Vorname:',cust.vorname||'');fieldBox(M+hw+1,y,hw-1,11,'Name:',cust.nachname||'');y+=13;
  fieldBox(M,y,hw-1,11,'Straße/Nr.:',`${cust.strasse||''} ${cust.hausnummer||''}`);fieldBox(M+hw+1,y,hw-1,11,'PLZ/Ort:',`${cust.plz||''} ${cust.stadt||''}`);y+=13;
  fieldBox(M,y,hw-1,11,'Telefon:',cust.telefon||'');fieldBox(M+hw+1,y,hw-1,11,'E-Mail:',cust.email||'');y+=15;

  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Pflegegrad:',M,y);
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('(Bitte unbedingt angeben!)',M+24,y);
  const pg=String(cust.pflegegrad||'');
  ['1','2','3','4','5'].forEach((p,i)=>{chkBox(M+57+i*11,y-3,pg===p);doc.setFontSize(8);setTxt(BLACK);doc.text(p,M+62+i*11,y);});
  chkLbl(M+115,y-3,false,'Pflegegrad beantragt',6.5);y+=7;

  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Versicherte(r) ist:',M,y);
  const versart=cust.versicherungsart||'';let vx=M+36;
  [['gesetzlich pflegeversichert',versart==='Gesetzlich'],['privat pflegeversichert',versart==='Privat'],['beihilfeberechtigt',false]].forEach(([l,chkd])=>{chkLbl(vx,y-3,chkd,l,7);vx+=doc.getTextWidth(l)+12;});y+=6;
  doc.setFontSize(7);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('über Ortsamt/Sozialamt versichert. Wenn ja, welches Ortsamt/Sozialamt',M,y);hline(y+1,M+95,W-M,0.3);y+=6;hline(y);

  // 2. Angehörige
  y+=2;hline(y);y+=7;secNum(M,y,2);doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Angehörige(r)/Pflegeperson',M+7,y-1);
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Bitte die wichtigste private Pflegeperson eintragen',W-M,y-1,{align:'right'});y+=7;hline(y);y+=5;
  const abwInfo=cust.abw_info||{};const hasAbw=!!cust.abw_adresse;
  const abwStreet = hasAbw
  ? [abwInfo.strasse || '', abwInfo.adresszusatz || ''].filter(Boolean).join(', ')
  : '';

  const abwCityLine = hasAbw
  ? [abwInfo.plz || '', abwInfo.stadt || ''].filter(Boolean).join(' ')
  : '';
  chkLbl(M,y,abwInfo.anrede==='Frau','Frau:');chkLbl(M+22,y,abwInfo.anrede==='Herr','Herr:');y+=7;
  fieldBox(M,y,hw-1,11,'Vorname:',hasAbw?abwInfo.vorname||'':'');fieldBox(M+hw+1,y,hw-1,11,'Name:',hasAbw?abwInfo.nachname||'':'');y+=13;
  fieldBox(M,y,hw-1,11,'Straße/Nr.:',hasAbw ? abwStreet : '');
  fieldBox(M+hw+1,y,hw-1,11,'PLZ/Ort:',hasAbw ? abwCityLine : '');y+=13;
  fieldBox(M,y,hw-1,11,'Telefon:','');fieldBox(M+hw+1,y,hw-1,11,'E-Mail:','');y+=13;
  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Pflegeperson ist:',M,y);y+=5;
  const bez=abwInfo.beziehung||'';const betreuer=abwInfo.betreuer||false;
  chkLbl(M,y,['Ehe-/Lebenspartner','Mutter/Vater','(Schwieger-)-Tochter/Sohn'].includes(bez),'Familienangehörige(r)',8);
  chkLbl(M+55,y,['Freund(in)/Bekannte/r','Keine Pflegeperson'].includes(bez),'Private Pflegeperson',8);
  chkLbl(M+105,y,betreuer||bez==='Betreuer(in)','Gesetzlich bestellte(r) Betreuer(in)',7.5,58);y+=8;hline(y);

  // 3. Pflegebox
  y+=2;hline(y);y+=7;secNum(M,y,3);doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Pflegebox',M+7,y-1);y+=7;hline(y);y+=5;
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Stellen Sie sich Ihre individuelle Pflegebox zusammen.',M,y);y+=6;
  const boxNames=box.map(b=>b.name.toLowerCase());
  const isOrd=(...kws)=>kws.some(kw=>boxNames.some(bn=>bn.includes(kw.toLowerCase())));
  const rows=[[['Bettschutzeinlagen',['bettschutz']],['Fingerlinge',['fingerlinge']]],[['Einmalhandschuhe',['einmalhandschuhe']],['Mundschutz/OP-Masken',['mundschutz','op-masken','op masken']]],[['Schutzschürzen (Einmal)',['schutzschürzen einmal']],['Schutzschürzen (wiederverw.)',['schutzschürzen wieder']]],[['Flächendesinfektionsmittel',['flächendesinfektionsmittel']],['Flächendesinfektionstücher',['flächendesinfektionstücher']]],[['Händedesinfektionsmittel',['händedesinfektionsmittel']],['Händedesinfektionstücher',['händedesinfektionstücher']]],[['FFP2 Masken',['ffp2']],['Schutzservietten',['schutzservietten']]]];
  rows.forEach(row=>{row.forEach(([lbl,kws],j)=>{const x=j===0?M:M+hw+2;chkBox(x,y-3,isOrd(...kws));doc.setFontSize(8);doc.setFont('helvetica','normal');setTxt(BLACK);doc.text(lbl,x+5,y);});y+=6.5;});
  const hg=box.find(b=>b.name.toLowerCase().includes('handschuh')&&b.groesse)?.groesse||null;
  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Handschuhgröße:',M,y);
  ['S','M','L','XL'].forEach((sz,i)=>{chkLbl(M+32+i*11,y-3,hg===sz,sz,8);});
  doc.text('Handschuhmaterial:',M+82,y);['Nitril','Vinyl','Latex'].forEach((mat,i)=>{chkLbl(M+110+i*20,y-3,i===0,mat,8);});y+=8;hline(y);

  y+=2;setFill(TEAL);doc.rect(0,y,W,9,'F');setTxt(WHITE);doc.setFontSize(7.5);doc.setFont('helvetica','bold');
  doc.text('!  Bitte füllen Sie den umseitigen Antrag aus, damit die Kosten von der Pflegekasse übernommen werden können.',M,y+5.5);

  doc.addPage();

  // ═══ SEITE 1b ═══
  setFill(TEAL);doc.rect(0,0,W,16,'F');setTxt(WHITE);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text('24Pflegebox — Bestellformular (Fortsetzung)',M,10);y=22;
  secNum(M,y,4);doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Lieferadresse',M+7,y-1);
  doc.setFontSize(8);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Die monatliche Lieferung an',M+42,y-1);y+=2;hline(y);y+=4;
  chkLbl(M,y,!hasAbw,'die/den Versicherte(n)/Pflegebedürftige(n)',8);chkLbl(M+87,y,hasAbw,'die/den Angehörige(n)/Pflegeperson',8);y+=6;
  doc.setFontSize(7);doc.setFont('helvetica','bold');setTxt(RED);doc.text('ACHTUNG: Bitte beiliegende Vollmacht ausfüllen und an uns zurücksenden!',M+87,y);y+=7;hline(y);

  y+=2;hline(y);y+=7;secNum(M,y,5);doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Rechnungsempfänger',M+7,y-1);
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Nur bei privat Versicherten',W-M,y-1,{align:'right'});y+=7;hline(y);y+=6;
  chkLbl(M,y,!hasAbw,'Versicherte(r)/Pflegebedürftige(r)',9);chkLbl(M+80,y,hasAbw,'Angehörige(r)/Pflegeperson',9);y+=8;hline(y);

  y+=2;hline(y);y+=7;secNum(M,y,6);doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Unterschrift Versicherte(r) und/oder Bevollmächtigte(r)',M+7,y-1);y+=7;hline(y);y+=4;
  fieldBox(M,y,hw-1,20,'Datum:',today);setStroke([204,204,204]);doc.setLineWidth(0.3);doc.rect(M+hw+1,y,hw-1,20);doc.setFontSize(6);setTxt(GRAY);doc.text('Unterschrift:',M+hw+2,y+3);
  if(sigDataURL){try{doc.addImage(sigDataURL,'PNG',M+hw+2,y+4,hw-4,14);}catch(e){}}
  y+=24;hline(y);y+=4;
  chkLbl(M,y,true,'Ich habe die AGB zur Kenntnis genommen.',8);y+=8;
  wrapText(M,y,'Ich bin damit einverstanden, dass 24Pflegebox die von mir zuvor gemachten Angaben verarbeitet. Ich kann meine Einwilligung jederzeit per E-Mail an app@24pflegebox.de widerrufen.',W-2*M,7,4);

  doc.addPage();

  // ═══ SEITE 2 — ANTRAG KOSTENÜBERNAHME ═══
  doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Anlage 2 — Antrag auf Kostenübernahme und Beratungsdokumentation',M,10);
  setStroke(TEAL);doc.setLineWidth(1);doc.line(M,12,W-M,12);y=18;
  fieldBox(M,y,hw-1,11,'Name, Vorname',`${cust.nachname||''}, ${cust.vorname||''}`);
  fieldBox(M+hw+1,y,(hw/2)-1,11,'Geburtsdatum',cust.geburtsdatum||'');
  fieldBox(M+hw+(hw/2)+2,y,(hw/2)-1,11,'Versichertennummer',cust.versicherungsnummer||'');y+=13;
  fieldBox(M,y,hw-1,11,'Anschrift',`${cust.strasse||''} ${cust.hausnummer||''}, ${cust.plz||''} ${cust.stadt||''}`);
  fieldBox(M+hw+1,y,hw-1,11,'Pflegekasse','');y+=15;
  doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Ich beantrage die Kostenübernahme für:',M,y);y+=6;
  chkBox(M,y-3,true);
  y=wrapText(M+6,y,'zum Verbrauch bestimmte Pflegehilfsmittel – Produktgruppe (PG 54) – bis maximal des monatlichen Höchstbetrages nach § 40 Absatz 2 SGB XI.',W-2*M-8,7.5,4);
  y+=4;hline(y,M,W-M,0.3);

  // PG54 Tabelle
  y+=4;doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(TEAL);doc.text('Zum Verbrauch bestimmte Pflegehilfsmittel (PG 54)',M,y);y+=6;
  const C=[M,M+65,M+107,M+125,M+145];
  setFill(TEAL);doc.rect(M,y-5,W-2*M,8,'F');setTxt(WHITE);doc.setFontSize(6.5);doc.setFont('helvetica','bold');
  ['Bezeichnung','Pos.-Nr.','Rechen-\ngröße','Menge/\nFaktor','Erläuterung'].forEach((h,i)=>{const lines=h.split('\n');lines.forEach((l,li)=>doc.text(l,C[i]+1,y-2+li*3));});y+=5;

  const PG54=[['saugende Bettschutzeinlagen Einmalgebrauch','54.45.01.0001','1 Stück','bettschutz'],['Fingerlinge (Latex, unsteril)','54.99.01.0001','1 Stück','fingerlinge'],['Einmalhandschuhe (Latex, unsteril)','54.99.01.1001','1 Stück','einmalhandschuhe'],['Medizinische Gesichtsmasken','54.99.01.2001','1 Stück','mundschutz|masken|op'],['Partikelfiltrierende Halbmasken (FFP-2)','54.99.01.5001','1 Stück','ffp2'],['Schutzschürzen - Einmalgebrauch','54.99.01.3001','1 Stück','schutzschürzen einmal'],['Schutzschürzen - wiederverwendbar','54.99.01.3002','1 Stück','schutzschürzen wieder'],['Schutzservietten zum Einmalgebrauch','54.99.01.4001','1 Stück','schutzservietten'],['Händedesinfektionsmittel','54.99.02.0001','100 ml','händedesinfektionsmittel'],['Flächendesinfektionsmittel','54.99.02.0002','100 ml','flächendesinfektionsmittel'],['Händedesinfektionstücher','54.99.02.0014','1 Stück','händedesinfektionstücher'],['Flächendesinfektionstücher','54.99.02.0015','1 Stück','flächendesinfektionstücher']];
  const rh=5.5;
  PG54.forEach(([name,pos,rg,kw],idx)=>{const qty=kw.split('|').reduce((acc,k)=>{const b=box.find(b=>b.name.toLowerCase().includes(k));return acc||(b?b.qty:0);},0);const menge=qty?(rg==='100 ml'?String(qty*5):String(qty*100)):'';if(idx%2===0){setFill(LGRAY);doc.rect(M,y,W-2*M,rh,'F');}setStroke([204,204,204]);doc.setLineWidth(0.2);doc.rect(M,y,W-2*M,rh);C.slice(1).forEach(cx=>doc.line(cx,y,cx,y+rh));doc.setFontSize(7);doc.setFont('helvetica','normal');setTxt(BLACK);let disp=name;while(disp.length>0&&doc.getTextWidth(disp)>63)disp=disp.slice(0,-1);doc.text(disp,C[0]+1,y+3.5);doc.text(pos,C[1]+1,y+3.5);doc.text(rg,C[2]+1,y+3.5);if(menge){doc.setFont('helvetica','bold');setTxt(TEAL);doc.text(menge,C[3]+1,y+3.5);}y+=rh;});
  y+=4;hline(y,M,W-M,0.3);

  // PG51
  y+=3;chkBox(M,y-2,false);doc.setFontSize(7.5);doc.setFont('helvetica','normal');setTxt(GRAY);
  doc.text('Pflegehilfsmittel zur Körperpflege/Körperhygiene (PG 51)',M+6,y);y+=6;
  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(GRAY);doc.text('Pflegehilfsmittel zur Körperpflege/Hygiene (PG 51)',M,y);y+=5;
  setFill(TEAL);doc.rect(M,y-4,W-2*M,7,'F');setTxt(WHITE);doc.setFontSize(6.5);doc.setFont('helvetica','bold');
  ['Bezeichnung','Positionsnummer','Rechengröße','Menge','Erläuterung'].forEach((h,i)=>doc.text(h,C[i]+1,y));y+=4;
  setFill(LGRAY);doc.rect(M,y,W-2*M,rh,'F');setStroke([204,204,204]);doc.setLineWidth(0.2);doc.rect(M,y,W-2*M,rh);C.slice(1).forEach(cx=>doc.line(cx,y,cx,y+rh));
  doc.setFontSize(7);doc.setFont('helvetica','normal');setTxt(BLACK);doc.text('Saugende Bettschutzeinlagen – wiederverwendbar',C[0]+1,y+3.5);doc.text('51.40.01.4900',C[1]+1,y+3.5);doc.text('1 Stück',C[2]+1,y+3.5);

  doc.addPage();

  // ═══ SEITE 3 — BERATUNGSDOKUMENTATION ═══
  doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Anlage 2 (Fortsetzung) — Beratungsdokumentation',M,10);
  setStroke(TEAL);doc.setLineWidth(1);doc.line(M,12,W-M,12);y=18;
  doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('durch folgenden Leistungserbringer:',M,y);y+=6;
  setStroke([204,204,204]);doc.setLineWidth(0.3);doc.rect(M,y,hw-1,26);doc.rect(M+hw+1,y,hw-1,26);
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Name und Anschrift',M+1.5,y+4);
  doc.setFontSize(10);doc.setFont('helvetica','bold');setTxt(TEAL);doc.text('Medical-Deal GmbH',M+2,y+10);
  doc.setFontSize(8);doc.setFont('helvetica','normal');setTxt(BLACK);doc.text('Kieler Straße 407',M+2,y+15);doc.text('22525 Hamburg',M+2,y+20);
  doc.setFontSize(6.5);setTxt(GRAY);doc.text('Institutionskennzeichen',M+hw+2,y+4);
  '330205860'.split('').forEach((d,i)=>{setStroke([136,135,128]);doc.rect(M+hw+3+i*6.5,y+8,5.5,7);doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(TEAL);doc.text(d,M+hw+4.5+i*6.5,y+13.5);});
  y+=30;hline(y,M,W-M,0.3);

  y+=4;chkBox(M,y-2,false);
  y=wrapText(M+6,y,'Ich wurde umfassend beraten, insbesondere darüber welche Produkte für meine Versorgungssituation geeignet sind.',W-2*M-8,8,4);y+=4;
  doc.setFontSize(8);doc.setFont('helvetica','normal');setTxt(BLACK);doc.text('Form des Beratungsgesprächs:',M,y);y+=6;
  ['Beratung in den Geschäftsräumen','Individuelle telefonische oder digitale Beratung','Beratung in der Häuslichkeit'].forEach(opt=>{chkLbl(M+45,y-3,opt.includes('digitale'),opt,8);y+=6;});
  doc.text('Der o. g. Leistungserbringer hat',M,y);y+=6;
  chkLbl(M+50,y-3,true,'mich persönlich und/oder',8);y+=6;
  chkLbl(M+50,y-3,false,'meine Betreuungsperson beraten',8);y+=7;
  fieldBox(M,y,hw-1,11,'Datum der Beratung:',today);fieldBox(M+hw+1,y,hw-1,11,'Beratende/r Mitarbeiter/in:','24Pflegebox App');y+=14;hline(y,M,W-M,0.3);

  y+=4;chkBox(M,y-2,true);
  y=wrapText(M+6,y,'Mit meiner Unterschrift bestätige ich, dass die gewünschten Produkte ausnahmslos für die häusliche Pflege verwendet werden dürfen.',W-2*M-8,8,4);
  y+=4;chkBox(M,y-2,true);
  y=wrapText(M+6,y,'Ich bin darüber aufgeklärt worden, dass die Pflegekasse die Kosten nur für genehmigte Pflegehilfsmittel übernimmt.',W-2*M-8,8,4);
  y+=6;hline(y,M,W-M,0.3);

  y+=4;const dStr=today.replace(/\./g,'');
  dStr.padEnd(8,'_').split('').forEach((d,i)=>{setStroke([136,135,128]);doc.setLineWidth(0.4);doc.rect(M+i*6.5,y,5.5,7);if(d!=='_'){doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text(d,M+1.5+i*6.5,y+5);}});
  doc.setFontSize(6.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Datum',M,y+10);

  const sx=M+60,sw=W-M-sx;setStroke([204,204,204]);doc.setLineWidth(0.3);doc.rect(sx,y,sw,25);
  doc.setFontSize(6.5);setTxt(GRAY);doc.text('Unterschrift der/des Versicherten',sx+1.5,y+3);
  if(sigName){doc.setFontSize(8);setTxt(BLACK);doc.text(sigName,sx+2,y+10);}
  if(sigDataURL){try{doc.addImage(sigDataURL,'PNG',sx+2,y+8,sw-4,15);}catch(e){}}
  doc.setFontSize(6);setTxt(GRAY);doc.text('*Unterschrift der Betreuungsperson oder des gesetzl. Vertreters',M,y+28);
  y+=33;hline(y,M,W-M,0.3);

  y+=4;doc.setFontSize(9);doc.setFont('helvetica','bold');setTxt(TEAL);doc.text('Genehmigungsvermerk der Pflegekasse',M,y);y+=7;
  chkLbl(M,y-3,false,'PG 54',8);chkLbl(M+hw+1,y-3,false,'PG 51 mit Zuzahlung',8);y+=5;
  doc.setFontSize(7);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('bis maximal des monatlichen Höchstbetrages nach § 40 Absatz 2 SGB XI',M+6,y);
  chkLbl(M+hw+1,y-3,false,'PG 51 ohne Zuzahlung',8);y+=6;
  chkLbl(M,y-3,false,'PG 54 Beihilfeberechtigung',8);chkLbl(M+hw+1,y-3,false,'PG 51 mit Zuzahlung/Beihilfeberechtigter',8);y+=5;
  doc.setFontSize(7);setTxt(GRAY);doc.text('bis maximal der Hälfte des monatlichen Höchstbetrages',M+6,y);y+=4;
  doc.text('nach § 40 Absatz 2 SGB XI',M+6,y);chkLbl(M+hw+1,y-3,false,'PG 51 ohne Zuzahlung/Beihilfeberechtigter',8);y+=9;
  fieldBox(M,y,hw-1,12,'(Datum)','');fieldBox(M+hw+1,y,hw-1,12,'(IK der Pflegekasse, Stempel und Unterschrift)','');y+=16;hline(y,M,W-M,0.3);y+=4;
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text('Der Antragsteller hat die Beratung abgelehnt:',M,y);y+=6;
  doc.setFontSize(8);doc.setFont('helvetica','bold');setTxt(BLACK);doc.text('Nein, ich kenne meinen Bedarf und die Produkte.',M,y);

  // Footer
  const totalPages=doc.getNumberOfPages();
  for(let p=1;p<=totalPages;p++){doc.setPage(p);const lbl=p===1?'1':p===2?'1b':p===3?'2':'3';setFill(LGRAY);doc.rect(0,H-10,W,10,'F');doc.setFontSize(7);doc.setFont('helvetica','normal');setTxt(GRAY);doc.text(`24Pflegebox · Medical-Deal GmbH · app@24pflegebox.de · Seite ${lbl} von 3`,M,H-4);doc.text(today,W-M,H-4,{align:'right'});}

  return doc;
}
