'use strict';
/* ===== Pure logic (no DOM) – easy to read and test ===== */
const Core = {
  formatJson: (t, n = 2) => JSON.stringify(JSON.parse(t), null, n),
  minifyJson: (t) => JSON.stringify(JSON.parse(t)),
  jsonError(text, err) {
    const m = /position (\d+)/.exec(err.message);
    if (!m || /line \d+/.test(err.message)) return err.message;
    const before = text.slice(0, +m[1]).split('\n');
    return `${err.message} (line ${before.length}, column ${before[before.length - 1].length + 1})`;
  },
  b64encode(s) {
    let bin = '';
    new TextEncoder().encode(s).forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  },
  b64decode(s) {
    const clean = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(clean); // throws on invalid Base64
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes); // throws if not UTF-8
  },
  uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  },
  stats(t) {
    const trimmed = t.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return {
      words,
      chars: [...t].length,
      noSpaces: [...t.replace(/\s/g, '')].length,
      lines: t === '' ? 0 : t.split(/\r\n|\r|\n/).length,
      minutes: words / 200,
    };
  },
  formatTime(min) {
    if (min === 0) return '0 min';
    return min < 1 ? 'Less than 1 min' : `${Math.ceil(min)} min`;
  },
  // Line diff using the longest common subsequence
  diff(a, b) {
    const A = a === '' ? [] : a.split(/\r\n|\r|\n/);
    const B = b === '' ? [] : b.split(/\r\n|\r|\n/);
    const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--)
      for (let j = B.length - 1; j >= 0; j--)
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < A.length && j < B.length) {
      if (A[i] === B[j]) { out.push({ type: 'same', text: A[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ type: 'del', text: A[i++] });
      else out.push({ type: 'add', text: B[j++] });
    }
    while (i < A.length) out.push({ type: 'del', text: A[i++] });
    while (j < B.length) out.push({ type: 'add', text: B[j++] });
    return out;
  },
};
if (typeof module !== 'undefined') module.exports = Core;

/* ===== Interface ===== */
if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);

  function toast(msg, isErr) {
    const el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
  function setStatus(id, msg, kind) {
    const el = $(id);
    el.textContent = msg;
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  async function copy(text, label = 'Copied to clipboard') {
    if (!text) return toast('Nothing to copy yet.', true);
    try {
      await navigator.clipboard.writeText(text);
      return toast(label);
    } catch (e) {
      try { // fallback for blocked clipboard API
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) return toast(label);
      } catch (e2) { /* ignore */ }
      toast('Copy was blocked by the browser. Select the text and press Ctrl+C.', true);
    }
  }

  /* Theme */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    const b = $('themeBtn');
    b.textContent = t === 'dark' ? 'Light theme' : 'Dark theme';
    b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    try { localStorage.setItem('vegaman-theme', t); } catch (e) { /* storage unavailable */ }
  }
  let saved = 'dark';
  try { saved = localStorage.getItem('vegaman-theme') || 'dark'; } catch (e) { /* ignore */ }
  setTheme(saved === 'light' ? 'light' : 'dark');
  $('themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  /* Navigation (hash based, no reload) */
  const panels = [...document.querySelectorAll('.panel')];
  function openMenu(open) {
    $('sidebar').classList.toggle('open', open);
    $('scrim').hidden = !open;
    $('menuBtn').setAttribute('aria-expanded', String(open));
  }
  function route() {
    const id = location.hash.slice(1);
    const target = panels.some((p) => p.id === id) ? id : 'home';
    panels.forEach((p) => (p.hidden = p.id !== target));
    document.querySelectorAll('.sidebar a[href^="#"]').forEach((a) => {
      if (a.getAttribute('href') === '#' + target) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = (target === 'home' ? '' : $(target).querySelector('h1').textContent + ' – ') + 'VEGAMAN DevKit';
    openMenu(false);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  $('menuBtn').onclick = () => openMenu(!$('sidebar').classList.contains('open'));
  $('scrim').onclick = () => openMenu(false);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openMenu(false); });

  /* Search */
  $('search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('#nav li, #cards .card').forEach((el) => {
      const hay = (el.textContent + ' ' + el.dataset.tool).toLowerCase();
      const match = !q || hay.includes(q);
      el.hidden = !match;
      if (match && el.tagName === 'LI') shown++;
    });
    $('noMatch').hidden = shown > 0;
  });

  /* Tool 1: JSON */
  const SAMPLE_JSON = '{"company":"VEGAMAN","tools":["json","base64","uuid"],"version":1,"free":true}';
  function jsonRun(fn, okMsg) {
    const text = $('jsonIn').value;
    if (!text.trim()) { setStatus('jsonStatus', 'Paste some JSON first, or select Load sample.', 'err'); return; }
    try {
      const out = fn(text);
      $('jsonOut').value = out;
      setStatus('jsonStatus', okMsg, 'ok');
      return true;
    } catch (e) {
      $('jsonOut').value = '';
      setStatus('jsonStatus', 'Invalid JSON: ' + Core.jsonError(text, e), 'err');
    }
  }
  $('jsonFormat').onclick = () => jsonRun(Core.formatJson, 'Valid JSON. Formatted with 2-space indentation.');
  $('jsonMinify').onclick = () => jsonRun(Core.minifyJson, 'Valid JSON. Minified.');
  $('jsonValidate').onclick = () => { if (jsonRun(Core.formatJson, 'Valid JSON.')) toast('JSON is valid'); };
  $('jsonSample').onclick = () => { $('jsonIn').value = SAMPLE_JSON; setStatus('jsonStatus', ''); };
  $('jsonClear').onclick = () => { $('jsonIn').value = ''; $('jsonOut').value = ''; setStatus('jsonStatus', ''); };
  $('jsonCopy').onclick = () => copy($('jsonOut').value);

  /* Tool 2: Base64 */
  $('b64Enc').onclick = () => {
    const t = $('b64Plain').value;
    if (!t) return setStatus('b64Status', 'Enter text in the Encode box first.', 'err');
    $('b64Coded').value = Core.b64encode(t);
    setStatus('b64Status', 'Encoded to Base64.', 'ok');
  };
  $('b64Dec').onclick = () => {
    const t = $('b64Coded').value;
    if (!t.trim()) return setStatus('b64Status', 'Paste Base64 in the Decode box first.', 'err');
    try {
      $('b64Plain').value = Core.b64decode(t);
      setStatus('b64Status', 'Decoded to UTF-8 text.', 'ok');
    } catch (e) {
      setStatus('b64Status', 'Could not decode: the input is not valid Base64 for UTF-8 text.', 'err');
    }
  };
  $('b64Sample').onclick = () => { $('b64Plain').value = 'Hello, VEGAMAN! नमस्ते 👋 café'; setStatus('b64Status', ''); };
  $('b64CopyPlain').onclick = () => copy($('b64Plain').value);
  $('b64CopyCoded').onclick = () => copy($('b64Coded').value);
  $('b64Clear').onclick = () => { $('b64Plain').value = ''; $('b64Coded').value = ''; setStatus('b64Status', ''); };

  /* Tool 3: UUID */
  let uuids = [];
  function renderUuids() {
    const list = $('uuidList');
    list.replaceChildren();
    uuids.forEach((id) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = id;
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = 'Copy';
      b.setAttribute('aria-label', 'Copy ' + id);
      b.onclick = () => copy(id, 'UUID copied');
      li.append(span, b);
      list.appendChild(li);
    });
    $('uuidEmpty').hidden = uuids.length > 0;
  }
  $('uuidGen').onclick = () => {
    const raw = $('uuidCount').value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 1 || n > 100) {
      return setStatus('uuidStatus', 'Enter a whole number from 1 to 100.', 'err');
    }
    uuids = Array.from({ length: n }, () => Core.uuid());
    renderUuids();
    setStatus('uuidStatus', `Generated ${n} UUID${n > 1 ? 's' : ''}.`, 'ok');
  };
  $('uuidCopyAll').onclick = () => copy(uuids.join('\n'), 'All UUIDs copied');
  $('uuidClear').onclick = () => { uuids = []; renderUuids(); setStatus('uuidStatus', ''); };
  renderUuids();

  /* Tool 4: Text analyzer */
  function analyze() {
    const s = Core.stats($('anaIn').value);
    $('stWords').textContent = s.words;
    $('stChars').textContent = s.chars;
    $('stNoSp').textContent = s.noSpaces;
    $('stLines').textContent = s.lines;
    $('stTime').textContent = Core.formatTime(s.minutes);
  }
  $('anaIn').addEventListener('input', analyze);
  $('anaSample').onclick = () => {
    $('anaIn').value = 'VEGAMAN DevKit runs entirely in your browser.\nPaste an article, an email or a README.\nThe numbers update as you type.';
    analyze();
  };
  $('anaClear').onclick = () => { $('anaIn').value = ''; analyze(); };

  /* Tool 5: Text compare */
  function clearDiff() { $('cmpOut').replaceChildren(); $('cmpEmpty').hidden = false; setStatus('cmpStatus', ''); }
  $('cmpRun').onclick = () => {
    const a = $('cmpA').value, b = $('cmpB').value;
    if (!a && !b) return setStatus('cmpStatus', 'Enter text in at least one editor.', 'err');
    const rows = Core.diff(a, b);
    const out = $('cmpOut');
    out.replaceChildren();
    const sym = { add: '+', del: '−', same: ' ' };
    const word = { add: 'Added', del: 'Removed', same: 'Unchanged' };
    rows.forEach((r) => {
      const d = document.createElement('div');
      d.className = r.type;
      const s = document.createElement('b');
      s.textContent = sym[r.type];
      s.setAttribute('aria-label', word[r.type]);
      const t = document.createElement('span');
      t.textContent = r.text === '' ? ' ' : r.text; // textContent keeps user text inert
      d.append(s, t);
      out.appendChild(d);
    });
    $('cmpEmpty').hidden = true;
    const c = (t) => rows.filter((r) => r.type === t).length;
    const changed = c('add') + c('del');
    setStatus('cmpStatus', changed ? `${c('add')} added, ${c('del')} removed, ${c('same')} unchanged.` : 'The texts are identical.', 'ok');
  };
  $('cmpSwap').onclick = () => {
    const a = $('cmpA'), b = $('cmpB');
    [a.value, b.value] = [b.value, a.value];
    if ($('cmpOut').children.length) $('cmpRun').click();
  };
  $('cmpSample').onclick = () => {
    $('cmpA').value = 'apple\nbanana\ncherry\ndate';
    $('cmpB').value = 'apple\nblueberry\ncherry\ndate\nelderberry';
    clearDiff();
  };
  $('cmpClear').onclick = () => { $('cmpA').value = ''; $('cmpB').value = ''; clearDiff(); };

  route();
}
