/* ═══════════════════════════════════════════════
   24Pflegebox — app.js
   Secrets entfernt, Bugs gefixt, strukturiert
   ═══════════════════════════════════════════════ */

// ── SUPABASE INIT ──────────────────────────────
const SUPABASE_URL = 'https://swxeigfhiljpjfihgzwu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eGVpZ2ZoaWxqcGpmaWhnend1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzA4MTAsImV4cCI6MjA5MDEwNjgxMH0.-F-BIiBhHH6aWrngl_c068LnADGIFmsl8CMjFovX1fg';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SESSION LISTENER (Session-Timeout-Handling) ──
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    state.user = null;
    state.customer = null;
    goTo('login');
  }
});

// Regex für Telefon und alle erfassten E-Mails

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^(?:\+49|0)[0-9][0-9\s\-()\/]{5,19}$/;

function isValidEmail(value = '') {
  return EMAIL_REGEX.test(String(value).trim());
}

function isValidPhone(value = '') {
  return PHONE_REGEX.test(String(value).trim());
}

// ESCAPE HTML

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── CONSTANTS ──────────────────────────────────
const BUDGET = 42;
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const IMG = 'https://swxeigfhiljpjfihgzwu.supabase.co/storage/v1/object/public/produkte/';
const FROM_EMAIL  = 'app@24pflegebox.de';
const ADMIN_EMAIL = 'app@24pflegebox.de';

const PRODUCTS = [
  {id:'handschuhe',   name:'Einmalhandschuhe',               detail:'100 Stk.',  price:9.00,   img:IMG+'einmalhandschuhe.png'},
  {id:'bettschutz',   name:'Einwegbettschutz',               detail:'',          price:0,      img:IMG+'Einwegbettschutz.png', maxQty:4, maxQtyPeriod:'year'},
  {id:'haende-fl',    name:'Händedesinfektion flüssig',      detail:'500 ml',    price:6.95,   img:IMG+'haende-desinfektion.png'},
  {id:'flaechen-fl',  name:'Flächendesinfektion flüssig',    detail:'500 ml',    price:5.65,   img:IMG+'flaechen-desinfektion.png'},
  {id:'haende-tu',    name:'Händedesinfektions-Tücher',      detail:'150 Stk.',  price:12.00,  img:IMG+'haende-desinfektionstuecher.png'},
  {id:'flaechen-tu',  name:'Flächendesinfektions-Tücher',    detail:'150 Stk.',  price:16.00,  img:IMG+'flaechen-desinfektionstuecher.png'},
  {id:'ffp2',         name:'FFP2 Masken',                    detail:'10 Stk.',   price:6.50,   img:IMG+'FFP2-Masken.png'},
  {id:'masken',       name:'OP Mundschutzmasken',            detail:'50 Stk.',   price:6.00,   img:IMG+'op-masken.png'},
  {id:'servietten',   name:'Schutzservietten',               detail:'100 Stk.',  price:10.00,  img:IMG+'Schutzservietten.png'},
  {id:'fingerlinge',  name:'Fingerlinge',                    detail:'100 Stk.',  price:5.00,   img:IMG+'Fingerlinge.png'}
];

const REC_BOX = [
  {id:'flaechen-tu', qty:2},
  {id:'handschuhe',  qty:1}
];

// ── APP STATE ──────────────────────────────────
let state = {
  user: null,
  customer: null,
  mode: 'empfehlung',
  aboActive: true,
  qtys: {},
  handschuhGroesse: 'M',
  bettschutzAnzahl: 0,
  bettschutzAktiv: false,
  hausnotrufAktiv: false,
  loginAttempts: 0,
  loginCooldown: false,
  bettschutzOrderedThisYear: 0
};

// ══════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════

function loading(show, text='Wird geladen...') {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
  document.getElementById('loading-text').textContent = text;
}

function goTo(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  window.scrollTo(0,0);
  if (screen === 'bestellhistorie') loadHistory();
  if (screen === 'dashboard') loadDashboard();
}

function getTotal() {
  return PRODUCTS.reduce((s,p) => s + (state.qtys[p.id]||0) * p.price, 0);
}

function getCurrentBox() {
  if (state.mode === 'empfehlung') {
    return REC_BOX.map(r => {
      const p = PRODUCTS.find(x=>x.id===r.id);
      return r.id==='handschuhe' ? {...p, qty:r.qty, groesse:state.handschuhGroesse} : {...p, qty:r.qty};
    });
  }
  return PRODUCTS.filter(p=>(state.qtys[p.id]||0)>0).map(p=>({
    ...p, qty: state.qtys[p.id],
    ...(p.id==='handschuhe' ? {groesse: state.handschuhGroesse} : {})
  }));
}

function boxToString(box) {
  return box.map(i=>i.groesse ? `${i.name} (Gr. ${i.groesse}) × ${i.qty}` : `${i.name} × ${i.qty}`).join(', ');
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
}

function nowMonth() {
  const n = new Date();
  return MONTHS[n.getMonth()] + ' ' + n.getFullYear();
}

// ── TOAST ──────────────────────────────────────
let toastTimer;
function showToast(title, msg) {
  const t = document.getElementById('app-toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent   = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

// ══════════════════════════════════════════════════
// E-MAIL (über serverseitige API Route — kein API-Key im Client)
// ══════════════════════════════════════════════════

async function sendEmail(to, subject, html) {
  try {
    const resp = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });
    if (!resp.ok) {
      console.error('E-Mail Fehler: HTTP ' + resp.status);
      showToast('Hinweis', 'Bestätigungsmail konnte nicht gesendet werden.');
    }
  } catch(e) {
    console.error('E-Mail Fehler:', e);
    showToast('Hinweis', 'Bestätigungsmail konnte nicht gesendet werden.');
  }
}

// ══════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const err   = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');

  if (!isValidEmail(email)) {
  err.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
  err.classList.add('show');
  return;
}

  if (state.loginCooldown) {
    err.textContent='Zu viele Versuche. Bitte warten Sie 30 Sekunden.';
    err.classList.add('show');
    return;
  }

  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;
  err.classList.remove('show');

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });

  btn.innerHTML = 'Anmelden';
  btn.disabled = false;

  if (error) {
    state.loginAttempts++;
    if (state.loginAttempts >= 5) {
      state.loginCooldown = true;
      err.textContent = 'Zu viele Fehlversuche. Bitte warten Sie 30 Sekunden.';
      err.classList.add('show');
      btn.disabled = true;
      setTimeout(() => {
        state.loginCooldown = false;
        state.loginAttempts = 0;
        btn.disabled = false;
        err.classList.remove('show');
      }, 30000);
    } else {
      err.textContent = 'E-Mail oder Passwort nicht korrekt.';
      err.classList.add('show');
    }
    return;
  }

  state.loginAttempts = 0;
  state.user = data.user;
  await loadCustomer();
  goTo('dashboard');
}

function togglePwVisibility() {
  const input = document.getElementById('login-pw');
  const icon  = document.getElementById('pw-eye-icon');
  const show  = input.type === 'password';
  input.type = show ? 'text' : 'password';
  icon.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

async function doForgot() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return;

  if (!isValidEmail(email)) {
    showToast('Ungültige E-Mail', 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
    return;
  }

  loading(true, 'Link wird gesendet...');
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  loading(false);
  showToast('E-Mail gesendet', 'Ein Link zum Zurücksetzen wurde an ' + email + ' gesendet.');
  goTo('login');
}

async function doLogout() {
  await sb.auth.signOut();
  state.user = null;
  state.customer = null;
  document.getElementById('login-email').value = '';
  document.getElementById('login-pw').value = '';
  goTo('login');
}

async function doPasswordReset() {
  if (!state.user) return;
  loading(true, 'Link wird gesendet...');
  await sb.auth.resetPasswordForEmail(state.user.email, { redirectTo: window.location.origin });
  loading(false);
  showToast('E-Mail gesendet', 'Ein Link zum Ändern Ihres Passworts wurde an ' + state.user.email + ' gesendet.');
}

// ══════════════════════════════════════════════════
// CUSTOMER DATA
// ══════════════════════════════════════════════════

async function loadCustomer() {
  if (!state.user) return;
  const { data } = await sb.from('customers').select('*').eq('id', state.user.id).single();
  state.customer = data;
  if (data) {
    state.aboActive = data.abo_aktiv ?? true;
    state.bettschutzOrderedThisYear = data.bettschutz_ordered_this_year ?? 0;
  }
}

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════

async function loadDashboard() {
  if (!state.user) return;
  await loadCustomer();

  const c = state.customer;
  const name = c?.vorname ? (c.vorname + (c.nachname ? ' ' + c.nachname : '')) : (c?.name || state.user.email);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  document.getElementById('dash-greeting').textContent = greeting + ', ' + name.split(' ')[0] + '!';
  document.getElementById('dash-month').textContent = 'Ihre Pflegebox für ' + nowMonth();
  document.getElementById('nav-avatar').textContent = getInitials(name);
  document.getElementById('profil-email').textContent = state.user.email;

  if (c) {
    const setVal = (id, val) => { const el=document.getElementById(id); if(el && val) el.value=val; };
    setVal('p-pflegegrad',  c.pflegegrad);
    setVal('p-anrede',      c.anrede);
    setVal('profil-vorname',c.vorname);
    setVal('profil-nachname',c.nachname);
    setVal('p-geburtsdatum',c.geburtsdatum);
    setVal('p-strasse',     c.strasse);
    setVal('p-hausnummer',  c.hausnummer);
    setVal('p-plz',         c.plz);
    setVal('p-stadt',       c.stadt);

// FIX: Abweichende Adresse vollständig befüllen
if (c.abw_adresse || c.abw_strasse || c.abw_hausnummer || c.abw_plz || c.abw_stadt) {
  document.getElementById('p-abw-check').checked = true;
  document.getElementById('p-abw-fields').style.display = 'block';

  const abw = c.abw_info || {};

  setVal('p-abw-beziehung', abw.beziehung);
  setVal('p-abw-anrede', abw.anrede);
  setVal('p-abw-vorname', abw.vorname);
  setVal('p-abw-nachname', abw.nachname);

  setVal('p-abw-strasse', c.abw_strasse || '');
  setVal('p-abw-hausnummer', c.abw_hausnummer || '');
  setVal('p-abw-plz', c.abw_plz || '');
  setVal('p-abw-stadt', c.abw_stadt || '');
  setVal('p-abw-adresszusatz', c.abw_adresszusatz || '');

  if (abw.betreuer) document.getElementById('p-abw-betreuer').checked = true;
}

    setVal('p-versart',    c.versicherungsart);
    setVal('p-versnr',     c.versicherungsnummer);
    setVal('p-telefon',    c.telefon);
    setVal('p-email-opt',  c.email_optional);
    if (c.versorgungsart === 'Wechselversorgung') {
      document.getElementById('p-wechselversorgung').checked = true;
    } else {
      document.getElementById('p-erstversorgung').checked = true;
    }
  }

  const badge = document.getElementById('dash-abo-badge');
  const bar   = document.getElementById('dash-bar');
  const barL  = document.getElementById('dash-bar-left');

  if (state.aboActive) {
    badge.textContent = 'Abo aktiv'; badge.className = 'badge badge-teal-solid';
    bar.style.width = '100%'; bar.style.background = 'var(--teal-600)';
    barL.textContent = 'Box vollständig';
  } else {
    badge.textContent = 'Kein Abo'; badge.className = 'badge badge-gray';
    bar.style.width = '0%'; barL.textContent = 'leer';
  }

  document.getElementById('profil-abo-toggle').className = 'toggle-switch' + (state.aboActive ? ' on' : '');

  const { data: orders } = await sb.from('orders')
    .select('*').eq('customer_id', state.user.id)
    .order('created_at', {ascending: false}).limit(1);

  if (orders && orders.length > 0) {
    const o = orders[0];
    document.getElementById('last-order-month').textContent  = o.monat || '—';
    document.getElementById('last-order-status').textContent = o.status || '—';
    document.getElementById('last-order-items').textContent  = Array.isArray(o.produkte) ? boxToString(o.produkte) : '—';
  }

  // Restore Zusatzleistungen
  if (c) {
    restoreTileState('bett', c.bettschutz_beantragt, 'Beantragt – wird bearbeitet');
    restoreTileState('notruf', c.hausnotruf_beantragt, 'Beantragt – Vitalset GmbH meldet sich');
  }
}

function restoreTileState(type, isBeantragt, subText) {
  if (!isBeantragt) return;
  const tile = document.getElementById('dash-tile-' + type);
  const sub  = document.getElementById(type + '-tile-sub');
  const act  = document.getElementById(type + '-tile-action');
  if (!tile) return;
  tile.style.borderColor = '#1D9E75';
  tile.style.background  = '#E1F5EE';
  tile.dataset.done = '1';
  if (sub) sub.textContent = subText;
  if (act) act.innerHTML = '<div style="width:24px;height:24px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></div>';
}

// ══════════════════════════════════════════════════
// KONFIGURATOR
// ══════════════════════════════════════════════════

function startKonfigurator() {
  state.qtys = {};
  PRODUCTS.forEach(p => state.qtys[p.id] = 0);
  state.mode = 'empfehlung';
  state.bettschutzAnzahl = 0;
  state.bettschutzAktiv = false;
  state.hausnotrufAktiv = false;
  document.getElementById('konfig-entry').style.display   = 'block';
  document.getElementById('konfig-content').style.display = 'none';
  document.getElementById('konfig-bar-wrap').style.display = 'none';
  document.getElementById('konfig-sticky').style.display  = 'none';
  renderProductList();
  syncModeUI();
  syncAboToggle();
  updateKonfigBar();
  goTo('konfigurator');
}

function renderProductList() {
  const c = document.getElementById('product-list');
  c.innerHTML = '';
  PRODUCTS.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item'; div.id = 'prod-' + p.id;
    const sizeSelector = p.id === 'handschuhe' ? `
      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
        ${['S','M','L','XL'].map(s => `<button onclick="selectGroesse('${s}')" id="size-${s}"
          style="padding:3px 10px;font-size:12px;font-weight:500;border-radius:6px;cursor:pointer;font-family:var(--font);border:1.5px solid ${s==='M'?'var(--teal-400)':'var(--gray-200)'};background:${s==='M'?'var(--teal-50)':'transparent'};color:${s==='M'?'var(--teal-600)':'var(--gray-600)'};">${s}</button>`).join('')}
      </div>` : '';
    const limitInfo = p.maxQty ? `<div style="font-size:11px;color:var(--amber-600);margin-top:2px;">Max. ${p.maxQty}× pro Jahr</div>` : '';
    div.innerHTML = `
      <img class="product-img" src="${p.img}" alt="${p.name}" onerror="this.style.background='var(--gray-100)';this.src='';">
      <div style="flex:1;min-width:0"><div class="product-name">${p.name}</div>${p.detail?`<div class="product-detail">${p.detail}</div>`:''}${limitInfo}${sizeSelector}</div>
      <div class="qty-ctrl"><button class="qty-btn" id="minus-${p.id}" onclick="changeQty('${p.id}',-1)">−</button><span class="qty-num" id="qty-${p.id}">0</span><button class="qty-btn" id="plus-${p.id}" onclick="changeQty('${p.id}',1)">+</button></div>`;
    c.appendChild(div);
  });
  const btn = document.createElement('button');
  btn.className = 'btn-primary'; btn.style.marginTop = '12px';
  btn.textContent = 'Weiter zur Bestellübersicht →';
  btn.setAttribute('onclick', 'goToSummary()');
  c.appendChild(btn);
}

function selectGroesse(size) {
  state.handschuhGroesse = size;
  ['S','M','L','XL'].forEach(s => {
    const btn = document.getElementById('size-'+s);
    if (!btn) return;
    const active = s === size;
    btn.style.borderColor = active ? 'var(--teal-400)' : 'var(--gray-200)';
    btn.style.background  = active ? 'var(--teal-50)'  : 'transparent';
    btn.style.color       = active ? 'var(--teal-600)' : 'var(--gray-600)';
  });
}

function changeQty(id, delta) {
  const cur = state.qtys[id]||0;
  const p = PRODUCTS.find(x=>x.id===id);
  const newQty = cur + delta;
  if (newQty < 0) return;

  // FIX: Max-Qty check (Einwegbettschutz max 4/Jahr)
  if (p.maxQty) {
    const alreadyOrdered = state.bettschutzOrderedThisYear || 0;
    const remaining = p.maxQty - alreadyOrdered;
    if (newQty > remaining) {
      showToast('Maximum erreicht', `Sie können dieses Jahr noch ${remaining} Einwegbettschutz bestellen (max. ${p.maxQty}/Jahr).`);
      return;
    }
  }

  if (p.price > 0 && getTotal() - cur*p.price + newQty*p.price > BUDGET) return;
  state.qtys[id] = newQty;
  updateProductItem(id);
  updateKonfigBar();
}

function updateProductItem(id) {
  const qty = state.qtys[id]||0;
  const total = getTotal();
  const p = PRODUCTS.find(x=>x.id===id);
  const row = document.getElementById('prod-'+id);
  if (!row) return;
  document.getElementById('qty-'+id).textContent = qty;
  row.className = 'product-item' + (qty>0?' selected':'');
  const plus = document.getElementById('plus-'+id);
  if (p.maxQty) {
    plus.disabled = qty >= (p.maxQty - (state.bettschutzOrderedThisYear || 0));
  } else {
    plus.disabled = p.price > 0 && total + p.price > BUDGET;
  }
}

function updateKonfigBar() {
  const total = state.mode==='empfehlung'
    ? REC_BOX.reduce((s,r)=>{const p=PRODUCTS.find(x=>x.id===r.id);return s+r.qty*p.price;},0)
    : getTotal();
  const pct = total > 39 ? 100 : (total/BUDGET*100);
  const isFull = total > 39;
  const bar = document.getElementById('konfig-bar');
  const lbl = document.getElementById('konfig-bar-label');
  bar.style.width = pct+'%';
  bar.style.background = isFull ? 'var(--teal-600)' : 'var(--teal-400)';
  if (state.mode==='empfehlung'||isFull) { lbl.textContent='Box vollständig gefüllt'; lbl.style.color='var(--teal-600)'; }
  else if (total===0) { lbl.textContent='Fügen Sie Produkte hinzu'; lbl.style.color='var(--teal-400)'; }
  else { lbl.textContent='Noch etwas Platz'; lbl.style.color='var(--teal-400)'; }
  document.getElementById('konfig-weiter-btn').disabled =
    state.mode==='individuell' && PRODUCTS.every(p=>(state.qtys[p.id]||0)===0);
}

function setMode(mode) {
  state.mode = mode;
  syncModeUI();
  updateKonfigBar();
  if (mode==='individuell') PRODUCTS.forEach(p=>updateProductItem(p.id));
}

function syncModeUI() {
  const isEmp = state.mode==='empfehlung';
  document.getElementById('mode-btn-emp').className = 'mode-btn'+(isEmp?' active':'');
  document.getElementById('mode-btn-ind').className = 'mode-btn'+(!isEmp?' active':'');
  document.getElementById('mode-empfehlung').style.display = isEmp?'block':'none';
  document.getElementById('mode-individuell').style.display = !isEmp?'block':'none';
}

function toggleAbo() { state.aboActive = !state.aboActive; syncAboToggle(); }
function syncAboToggle() { document.getElementById('abo-toggle').className = 'toggle-switch'+(state.aboActive?' on':''); }

function showKonfiguratorContent() {
  document.getElementById('konfig-entry').style.display   = 'none';
  document.getElementById('konfig-content').style.display = 'block';
  document.getElementById('konfig-bar-wrap').style.display = 'block';
  document.getElementById('konfig-sticky').style.display  = 'block';
}

function selectBettschutz(n) {
  state.bettschutzAnzahl = n;
  [1,2,3,4].forEach(i => {
    const btn = document.getElementById('bett-btn-'+i);
    if (!btn) return;
    const active = i === n;
    btn.style.borderColor = active ? 'var(--teal-400)' : 'var(--gray-200)';
    btn.style.background  = active ? 'var(--teal-50)'  : 'transparent';
    btn.style.color       = active ? 'var(--teal-600)' : 'var(--gray-600)';
  });
  const info = document.getElementById('bett-selected-info');
  info.style.display = 'block';
  info.textContent = `${n} waschbare Bettschutzeinlage${n>1?'n':''} ausgewählt`;
}

function toggleDashAccordion(type) {
  const body = document.getElementById(type+'-dash-body');
  if (!body) return;
  const tile = document.getElementById('dash-tile-'+type);
  const isDone = tile && tile.dataset.done === '1';
  if (isDone) {
    if (body.style.display === 'none') {
      body.style.display = 'block';
      const btn = document.getElementById(type+'-toggle-btn');
      if (btn) { btn.textContent = 'Auswahl rückgängig machen'; btn.style.background = 'transparent'; btn.style.color = 'var(--red-400)'; btn.style.border = '1.5px solid var(--red-400)'; }
    } else { body.style.display = 'none'; }
  } else {
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
    const btn = document.getElementById(type+'-toggle-btn');
    if (btn) { btn.textContent = 'Jetzt kostenlos beantragen'; btn.style.background = '#1D9E75'; btn.style.color = '#fff'; btn.style.border = 'none'; }
  }
}

// ══════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════

function goToSummary() {
  const box = getCurrentBox();
  if (!box.length) return;

  const pc = document.getElementById('summary-products');
  pc.innerHTML = '';
  box.forEach((item, idx) => {
    const row = document.createElement('div');
    const isLast = idx === box.length - 1;
    row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:12px 16px;${isLast?'':'border-bottom:0.5px solid var(--gray-100);'}`;
    const groesse = item.groesse ? ` <span style="font-size:12px;color:var(--gray-400)">Gr. ${item.groesse}</span>` : '';
    row.innerHTML = `<div><span style="font-size:14px;font-weight:500;">${item.name}</span>${groesse}<div style="font-size:12px;color:var(--gray-400);margin-top:2px;">${item.detail||''}</div></div><span style="font-size:14px;font-weight:600;color:var(--teal-600);">× ${item.qty}</span>`;
    pc.appendChild(row);
  });

  const c = state.customer;
  const adressEl = document.getElementById('summary-address');
  if (c && (c.strasse || c.adresse)) {
    const name = [c.anrede, c.vorname, c.nachname].filter(Boolean).join(' ') || state.user?.email || '';
    const strasse = c.strasse && c.hausnummer ? `${c.strasse} ${c.hausnummer}` : (c.adresse || '');
    const ort = c.plz && c.stadt ? `${c.plz} ${c.stadt}` : '';
    adressEl.innerHTML = '';

const strong = document.createElement('strong');
strong.textContent = name;
adressEl.appendChild(strong);
adressEl.appendChild(document.createElement('br'));

adressEl.appendChild(document.createTextNode(strasse));

if (ort) {
  adressEl.appendChild(document.createElement('br'));
  adressEl.appendChild(document.createTextNode(ort));
}

if (c.abw_adresse) {
  adressEl.appendChild(document.createElement('br'));
  const extra = document.createElement('span');
  extra.style.fontSize = '12px';
  extra.style.color = 'var(--teal-600)';
  extra.textContent = `Abweichende Lieferadresse: ${c.abw_adresse}`;
  adressEl.appendChild(extra);
}
  } else {
    adressEl.innerHTML = '<span style="color:var(--red-400);font-size:13px;">⚠ Bitte zuerst Ihre Lieferadresse im Profil ergänzen.</span>';
  }

  const aboCard = document.getElementById('summary-abo-card');
  if (state.aboActive) {
    aboCard.style.borderColor = '#9FE1CB'; aboCard.style.background = '#E1F5EE';
    document.getElementById('summary-abo-title').textContent='Monatliches Abo aktiv';
    document.getElementById('summary-abo-sub').textContent='Diese Box wird automatisch jeden Monat wiederholt';
    document.getElementById('summary-abo-icon').textContent='✓';
    document.getElementById('summary-abo-icon').style.color='#1D9E75';
  } else {
    aboCard.style.borderColor = ''; aboCard.style.background = '';
    document.getElementById('summary-abo-title').textContent='Einmalige Bestellung';
    document.getElementById('summary-abo-sub').textContent='Kein Abo — nur diese Bestellung';
    document.getElementById('summary-abo-icon').textContent='○';
    document.getElementById('summary-abo-icon').style.color='var(--gray-400)';
  }

  document.getElementById('summary-change-notice').style.display =
    (state.customer?.abo_aktiv && state.mode!=='empfehlung') ? 'block' : 'none';

  const extrasDiv = document.getElementById('summary-extras');
  const extrasContent = document.getElementById('summary-extras-content');
  const hasExtras = state.bettschutzAktiv || state.hausnotrufAktiv;
  extrasDiv.style.display = hasExtras ? 'block' : 'none';
  if (hasExtras) {
    extrasContent.innerHTML = '';
    if (state.bettschutzAktiv) { const r = document.createElement('div'); r.className='summary-row'; r.innerHTML=`<span style="color:var(--teal-800)">Waschbare Bettschutzeinlage</span><span style="font-weight:600;color:var(--teal-600)">× ${state.bettschutzAnzahl}</span>`; extrasContent.appendChild(r); }
    if (state.hausnotrufAktiv) { const r = document.createElement('div'); r.className='summary-row'; r.style.borderBottom='none'; r.innerHTML=`<span style="color:var(--teal-800)">Hausnotrufsystem</span><span style="font-weight:600;color:var(--teal-600)">beantragt</span>`; extrasContent.appendChild(r); }
  }
  goTo('summary');
}

// ══════════════════════════════════════════════════
// SIGNATUR PAD
// ══════════════════════════════════════════════════

let sigCanvas, sigCtx, sigDrawing = false, sigHasData = false;

function initSignaturePad() {
  sigCanvas = document.getElementById('sig-canvas');
  if (!sigCanvas) return;
  const rect = sigCanvas.parentElement.getBoundingClientRect();
  sigCanvas.width  = rect.width * window.devicePixelRatio;
  sigCanvas.height = 180 * window.devicePixelRatio;
  sigCanvas.style.height = '180px';
  sigCtx = sigCanvas.getContext('2d');
  sigCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  sigCtx.strokeStyle = '#2563EB';
  sigCtx.fillStyle = '#2563EB';
  sigCtx.lineWidth = 2;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';
  sigHasData = false;
  function getPos(e) { const r=sigCanvas.getBoundingClientRect(); const src=e.touches?e.touches[0]:e; return {x:src.clientX-r.left,y:src.clientY-r.top}; }
  sigCanvas.addEventListener('mousedown',  e=>{sigDrawing=true;const p=getPos(e);sigCtx.beginPath();sigCtx.moveTo(p.x,p.y);});
  sigCanvas.addEventListener('mousemove',  e=>{if(!sigDrawing)return;const p=getPos(e);sigCtx.lineTo(p.x,p.y);sigCtx.stroke();sigHasData=true;hidePlaceholder();});
  sigCanvas.addEventListener('mouseup',    ()=>{sigDrawing=false;});
  sigCanvas.addEventListener('mouseleave', ()=>{sigDrawing=false;});
  sigCanvas.addEventListener('touchstart', e=>{e.preventDefault();sigDrawing=true;const p=getPos(e);sigCtx.beginPath();sigCtx.moveTo(p.x,p.y);},{passive:false});
  sigCanvas.addEventListener('touchmove',  e=>{e.preventDefault();if(!sigDrawing)return;const p=getPos(e);sigCtx.lineTo(p.x,p.y);sigCtx.stroke();sigHasData=true;hidePlaceholder();},{passive:false});
  sigCanvas.addEventListener('touchend',   ()=>{sigDrawing=false;});
}

function hidePlaceholder() { const ph=document.getElementById('sig-placeholder'); if(ph) ph.style.display='none'; }

function clearSignature() {
  if (!sigCtx || !sigCanvas) return;
  sigCtx.clearRect(0,0,sigCanvas.width/window.devicePixelRatio,sigCanvas.height/window.devicePixelRatio);
  sigCtx.strokeStyle = '#2563EB';
  sigCtx.fillStyle = '#2563EB';
  sigHasData = false;
  const ph = document.getElementById('sig-placeholder'); if(ph) ph.style.display='flex';
}

function getSignatureDataURL() { return (!sigCanvas||!sigHasData) ? null : sigCanvas.toDataURL('image/png'); }

function goToSignature() {
  const name = state.customer ? [state.customer.vorname, state.customer.nachname].filter(Boolean).join(' ') : '';
  document.getElementById('sig-name').value = name;
  document.getElementById('sig-checkbox').checked = false;
  clearSignature();
  goTo('signature');
  setTimeout(initSignaturePad, 100);
}

async function previewAntrag() {
  const box = getCurrentBox(); const c = state.customer; const month = nowMonth();
  const sigName = document.getElementById('sig-name')?.value || '';
  showToast('Antrag wird geladen...', 'Das PDF wird vorbereitet.');
  try {
    const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFLib) { showToast('Fehler', 'PDF-Bibliothek nicht geladen.'); return; }
    const doc = await generatePDF(box, c, month, null, sigName);
    const blob = doc.output('blob'); const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch(e) { console.error('Vorschau Fehler:', e); showToast('Fehler', 'PDF konnte nicht erstellt werden: ' + e.message); }
}

// ══════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════

function onVersartChange(val) {
  if (val === 'Privat') document.getElementById('privat-modal-wrap').classList.add('open');
}
function closePrivatModal() {
  document.getElementById('privat-modal-wrap').classList.remove('open');
}

// ══════════════════════════════════════════════════
// PROFIL
// ══════════════════════════════════════════════════

function switchProfilTab(tab) {
  document.getElementById('ptab-liefer').style.display  = tab==='liefer'  ? 'block' : 'none';
  document.getElementById('ptab-versich').style.display = tab==='versich' ? 'block' : 'none';
  document.getElementById('ptab-btn-liefer').className  = 'mode-btn' + (tab==='liefer'  ? ' active' : '');
  document.getElementById('ptab-btn-versich').className = 'mode-btn' + (tab==='versich' ? ' active' : '');
}

function toggleAbwAdresse() {
  document.getElementById('p-abw-fields').style.display = document.getElementById('p-abw-check').checked ? 'block' : 'none';
}

async function saveProfilData() {
  const pflegegrad=document.getElementById('p-pflegegrad').value, anrede=document.getElementById('p-anrede').value;
  const vorname=document.getElementById('profil-vorname').value.trim(), nachname=document.getElementById('profil-nachname').value.trim();
  const geburtsdatum=document.getElementById('p-geburtsdatum').value;
  const strasse=document.getElementById('p-strasse').value.trim(), hausnummer=document.getElementById('p-hausnummer').value.trim();
  const plz=document.getElementById('p-plz').value.trim(), stadt=document.getElementById('p-stadt').value.trim();
  const abwCheck=document.getElementById('p-abw-check').checked;
const abwBeziehung=document.getElementById('p-abw-beziehung')?.value||'';
const abwBetreuer=document.getElementById('p-abw-betreuer')?.checked||false;
const abwAnrede=document.getElementById('p-abw-anrede')?.value||'';
const abwVorname=document.getElementById('p-abw-vorname')?.value.trim()||'';
const abwNachname=document.getElementById('p-abw-nachname')?.value.trim()||'';
const abwStrasse=document.getElementById('p-abw-strasse')?.value.trim()||'';
const abwHausnummer=document.getElementById('p-abw-hausnummer')?.value.trim()||'';
const abwPlz=document.getElementById('p-abw-plz')?.value.trim()||'';
const abwStadt=document.getElementById('p-abw-stadt')?.value.trim()||'';
const abwAdresszusatz=document.getElementById('p-abw-adresszusatz')?.value.trim()||'';
  const fields=[['p-pflegegrad','err-pflegegrad',pflegegrad],['p-anrede','err-anrede',anrede],['profil-vorname','err-vorname',vorname],['profil-nachname','err-nachname',nachname],['p-geburtsdatum','err-geburtsdatum',geburtsdatum],['p-strasse','err-strasse',strasse],['p-hausnummer','err-hausnummer',hausnummer],['p-plz','err-plz',plz],['p-stadt','err-stadt',stadt]];
  let ok = true;
  fields.forEach(([,errId, val]) => { const el=document.getElementById(errId); if(el){el.classList.toggle('show',!val);if(!val) ok=false;} });
  if (!ok) return;
  if (abwCheck) {
  if (!abwStrasse || !abwHausnummer || !abwPlz || !abwStadt) {
    showToast('Abweichende Lieferadresse unvollständig', 'Bitte Straße, Hausnummer, PLZ und Ort vollständig angeben.');
    return;
  }
}
  

  const btn = document.getElementById('profil-save-btn');
  btn.disabled = true; btn.textContent = 'Wird gespeichert...';

  const fullName = anrede + ' ' + vorname + ' ' + nachname;
  const adresse = strasse + ' ' + hausnummer + ', ' + plz + ' ' + stadt;
  const abwAdresse = abwCheck
  ? [
      [abwStrasse, abwHausnummer].filter(Boolean).join(' '),
      [abwPlz, abwStadt].filter(Boolean).join(' '),
      abwAdresszusatz
    ].filter(Boolean).join(', ')
  : null;

const abwInfoObj = abwCheck
  ? {
      beziehung: abwBeziehung,
      betreuer: abwBetreuer,
      anrede: abwAnrede,
      vorname: abwVorname,
      nachname: abwNachname
    }
  : null;

  const { error } = await sb.from('customers').upsert({
    id:state.user.id, pflegegrad, anrede, vorname, nachname, name:fullName,
    geburtsdatum, strasse, hausnummer, plz, stadt, adresse,
    abw_adresse:abwAdresse,
abw_strasse:abwCheck ? abwStrasse : null,
abw_hausnummer:abwCheck ? abwHausnummer : null,
abw_plz:abwCheck ? abwPlz : null,
abw_stadt:abwCheck ? abwStadt : null,
abw_adresszusatz:abwCheck ? abwAdresszusatz : null,
abw_info:abwInfoObj,
abo_aktiv:state.aboActive
  });

  btn.disabled = false; btn.textContent = 'Lieferdaten speichern';
  if (error) { showToast('Fehler', 'Fehler beim Speichern: ' + error.message); return; }

  if (!state.customer) state.customer = {};
  Object.assign(state.customer, {
  pflegegrad, anrede, vorname, nachname, name:fullName,
  geburtsdatum, strasse, hausnummer, plz, stadt, adresse,
  abw_adresse: abwAdresse,
  abw_strasse: abwCheck ? abwStrasse : null,
  abw_hausnummer: abwCheck ? abwHausnummer : null,
  abw_plz: abwCheck ? abwPlz : null,
  abw_stadt: abwCheck ? abwStadt : null,
  abw_zusatz: abwCheck ? abwZusatz : null,
  abw_info: abwInfoObj
});

  document.getElementById('profil-save-success').style.display = 'block';
  setTimeout(() => { document.getElementById('profil-save-success').style.display = 'none'; }, 3000);
  document.getElementById('nav-avatar').textContent = getInitials(vorname + ' ' + nachname);
  const h = new Date().getHours();
  document.getElementById('dash-greeting').textContent = (h<12?'Guten Morgen':h<18?'Guten Tag':'Guten Abend') + ', ' + vorname + '!';
}

async function saveVersichData() {
  const versart=document.getElementById('p-versart').value, versnr=document.getElementById('p-versnr').value.trim();
  const telefon=document.getElementById('p-telefon').value.trim(), emailOpt=document.getElementById('p-email-opt').value.trim();
  const versorgung = document.querySelector('input[name="versorgung"]:checked')?.value || 'Erstversorgung';

  const fields=[['err-versart',versart],['err-versnr',versnr],['err-telefon',telefon]];
  let ok = true;
  fields.forEach(([errId, val]) => { const el=document.getElementById(errId); if(el){el.classList.toggle('show',!val);if(!val) ok=false;} });
  if (!ok) return;

  if (!isValidPhone(telefon)) {
  showToast('Ungültige Telefonnummer', 'Bitte geben Sie eine gültige Telefonnummer ein.');
  return;
}

if (emailOpt && !isValidEmail(emailOpt)) {
  showToast('Ungültige E-Mail', 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
  return;
}
   
  const btn = document.getElementById('versich-save-btn');
  btn.disabled = true; btn.textContent = 'Wird gespeichert...';

  const { error } = await sb.from('customers').upsert({
    id:state.user.id, versicherungsart:versart, versicherungsnummer:versnr, telefon, email_optional:emailOpt, versorgungsart:versorgung
  });

  btn.disabled = false; btn.textContent = 'Versicherungsdaten speichern';
  if (error) { showToast('Fehler', 'Fehler beim Speichern: ' + error.message); return; }

  if (!state.customer) state.customer = {};
  Object.assign(state.customer, {versicherungsart:versart,versicherungsnummer:versnr,telefon,email_optional:emailOpt,versorgungsart:versorgung});

  document.getElementById('versich-save-success').style.display = 'block';
  setTimeout(() => { document.getElementById('versich-save-success').style.display = 'none'; }, 3000);
}

async function toggleProfilAbo() {
  state.aboActive = !state.aboActive;
  document.getElementById('profil-abo-toggle').className = 'toggle-switch'+(state.aboActive?' on':'');
  document.getElementById('profil-abo-notice').style.display = 'block';
  document.getElementById('profil-abo-sub').textContent = state.aboActive
    ? 'Ihre Box wird automatisch jeden Monat bestellt' : 'Kein Abo — Sie bestellen manuell';
  if (state.user) {
    await sb.from('customers').update({abo_aktiv:state.aboActive}).eq('id',state.user.id);
    if (state.customer) state.customer.abo_aktiv = state.aboActive;
  }
  loadDashboard();
}

// ══════════════════════════════════════════════════
// DASHBOARD BEANTRAGEN (Zusatzleistungen)
// ══════════════════════════════════════════════════

async function dashBeantragen(type) {
  const tile=document.getElementById('dash-tile-'+type), sub=document.getElementById(type+'-tile-sub');
  const action=document.getElementById(type+'-tile-action'), body=document.getElementById(type+'-dash-body');
  const isDone = tile && tile.dataset.done === '1';

  if (!isDone) {
    if (body) body.style.display = 'none';
    if (tile) { tile.style.borderColor='#1D9E75'; tile.style.background='#E1F5EE'; tile.dataset.done='1'; }
    if (action) action.innerHTML = '<div style="width:24px;height:24px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg></div>';

    if (type === 'bett') {
      if (sub) sub.textContent = 'Beantragt – wird bearbeitet';
      state.bettschutzAktiv = true; if (state.bettschutzAnzahl === 0) state.bettschutzAnzahl = 1;
      showToast('Bettschutzeinlagen beantragt', 'Wir haben Ihre Anfrage erhalten.');
    } else {
      if (sub) sub.textContent = 'Beantragt – wir melden uns bei Ihnen';
      state.hausnotrufAktiv = true;
      showToast('Hausnotrufsystem beantragt', 'Unser Partner Vitalset GmbH wird sich melden.');
    }

    if (state.user) {
      const update = type==='bett' ? {bettschutz_beantragt:true, bettschutz_anzahl:state.bettschutzAnzahl} : {hausnotruf_beantragt:true};
      const {error} = await sb.from('customers').update(update).eq('id',state.user.id);
      if (error) { showToast('Fehler','Anfrage konnte nicht gespeichert werden.'); return; }

      const extraHtml = buildExtraEmail(type, state.customer, state.bettschutzAnzahl);
      const titel = type === 'bett' ? 'Bettschutzeinlagen' : 'Hausnotrufsystem';
      const vorname = escapeHtml(state.customer?.vorname || 'Kunde');
      await sendEmail(ADMIN_EMAIL, `Neuer Antrag: ${titel} — ${state.customer?.vorname || 'Kunde'}`, extraHtml);

      const kundeMsg = escapeHtml(
      type === 'bett'
       ? `Wir haben Ihren Antrag auf waschbare Bettschutzeinlagen (${state.bettschutzAnzahl} Stück) erhalten.`
       : 'Wir haben Ihren Antrag auf ein Hausnotrufsystem erhalten. Vitalset GmbH wird sich melden.'
   );

const safeAdminEmail = escapeHtml(ADMIN_EMAIL);

const kundeHtml = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0F6E56;padding:20px 24px;border-radius:8px 8px 0 0;"><h2 style="color:#fff;margin:0;font-size:18px;">Antrag eingegangen!</h2></div><div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;"><p>Guten Tag, ${vorname},</p><p>${kundeMsg}</p><p style="color:#888;font-size:13px;margin-top:24px;">Bei Fragen: <a href="mailto:${safeAdminEmail}" style="color:#1D9E75">${safeAdminEmail}</a></p></div></div>`;

await sendEmail(state.user.email, `Ihr Antrag: ${titel} — eingegangen`, kundeHtml);
    }
  } else {
    if (tile) { tile.style.borderColor=''; tile.style.background=''; tile.dataset.done='0'; }
    if (action) {
      const pill = type==='bett' ? '<div class="tile-pill" style="background:#FAEEDA;color:#633806;">Beantragen</div>' : '<div class="tile-pill" style="background:#E6F1FB;color:#185FA5;">Beantragen</div>';
      action.innerHTML = pill;
    }
    if (type==='bett') { if(sub) sub.textContent='Kostenlos · bis zu 4× pro Jahr'; state.bettschutzAktiv=false; }
    else { if(sub) sub.textContent='Kostenlos · einmalig · Vitalset GmbH'; state.hausnotrufAktiv=false; }
    if (state.user) {
      const update = type==='bett' ? {bettschutz_beantragt:false} : {hausnotruf_beantragt:false};
      await sb.from('customers').update(update).eq('id',state.user.id);
    }
  }
}

// ══════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════

async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<p style="color:var(--gray-400);font-size:15px;text-align:center;padding:40px 0;">Wird geladen...</p>';
  if (!state.user) return;
  const { data: orders } = await sb.from('orders').select('*').eq('customer_id', state.user.id).order('created_at', {ascending:false});
  list.innerHTML = '';
  if (!orders || !orders.length) { list.innerHTML='<p style="color:var(--gray-400);font-size:15px;text-align:center;padding:40px 0;">Noch keine Bestellungen vorhanden.</p>'; return; }
  orders.forEach(o => {
    const card = document.createElement('div'); card.className='card';
const statusRow = document.createElement('div');
statusRow.className = 'status-row';

const monthSpan = document.createElement('span');
monthSpan.style.fontWeight = '600';
monthSpan.style.fontSize = '16px';
monthSpan.textContent = o.monat || '—';

const badge = document.createElement('span');
badge.className = 'badge badge-teal';
badge.textContent = o.status || '—';

statusRow.appendChild(monthSpan);
statusRow.appendChild(badge);

const details = document.createElement('div');
details.style.fontSize = '14px';
details.style.color = 'var(--gray-600)';
details.style.paddingTop = '8px';
details.style.lineHeight = '1.7';
details.textContent = Array.isArray(o.produkte) ? boxToString(o.produkte) : '—';

card.appendChild(statusRow);
card.appendChild(details);    list.appendChild(card);
  });
}

// ══════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════

document.getElementById('login-pw').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
document.getElementById('login-email').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

// ══════════════════════════════════════════════════
// SESSION CHECK ON LOAD
// ══════════════════════════════════════════════════

(async () => {
  loading(true);
  const { data: { session } } = await sb.auth.getSession();
  if (session) { state.user = session.user; await loadCustomer(); goTo('dashboard'); }
  else { goTo('login'); }
  loading(false);
})();
