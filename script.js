/* ============ CONFIG: edit these ============ */
const CONFIG = {
  name: 'Al Latif',
  email: 'abrarjahinlatif@gmail.com',          // where the contact form sends mail
  formEndpoint: '',                     // optional Formspree/Formsubmit URL. Empty = opens the visitor's mail app
  feedUrl: 'projects.json',             // the file your automation updates
  feedPollMs: 60000,                    // how often the page checks for new projects
  timezone: 'Asia/Dhaka',
  socials: [
    { name: 'YouTube',     url: 'https://www.youtube.com/@serial.hobbyist26' },
    { name: 'Instagram',   url: 'https://www.instagram.com/al.latif_/' },
    { name: 'GitHub',      url: 'https://github.com/abrarjahinlatif-crypto' },
    { name: 'Facebook', url: 'https://www.facebook.com/share/1HnA88nVh4/' }
  ]
};

/* shown only if projects.json can't be loaded (e.g. file opened directly) */
const FALLBACK = { updated: '', projects: [
  { id: 'f1', title: 'Pocket weather station', platform: 'youtube', url: '#', thumbnail: '', date: '2026-11-12', description: 'A tiny ESP32 build that tells me whether to bring a jacket.', tags: ['electronics'] },
  { id: 'f2', title: 'I automated my whole desk', platform: 'instagram', url: '#', thumbnail: '', date: '2026-11-08', description: 'Lights, fans and music, all triggered by one button.', tags: ['automation'] },
  { id: 'f3', title: 'Retro terminal clock', platform: 'github', url: '#', thumbnail: '', date: '2026-11-02', description: 'A glowing green clock for people who miss CRT monitors.', tags: ['code'] }
]};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- split text into animated letters (keeps <em>, skips <br>) ---------- */
function split(root) {
  let i = 0;
  (function walk(node) {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); i++; return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(chr => {
            const c = document.createElement('span'); c.className = 'c';
            c.style.setProperty('--i', i++); c.textContent = chr; w.appendChild(c);
          });
          frag.appendChild(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
    });
  })(root);
}
$$('[data-split]').forEach(split);

/* ---------- scramble on hover (techy) ---------- */
const GLYPHS = '01<>/\\[]{}#%&*+=';
function scramble(el) {
  if (reduced || el._s) return;
  const chars = $$('.c', el);
  if (!chars.length) return;
  el._s = true;
  const orig = chars.map(c => c.textContent), t0 = performance.now(), dur = 600;
  (function f(t) {
    const k = Math.min(1, (t - t0) / dur);
    chars.forEach((c, i) => {
      c.textContent = (k >= (i + 1) / chars.length * .85 || orig[i] === ' ') ? orig[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    });
    if (k < 1) requestAnimationFrame(f);
    else { chars.forEach((c, i) => c.textContent = orig[i]); el._s = false; }
  })(t0);
}
$$('[data-scramble]').forEach(el => el.addEventListener('pointerenter', () => { scramble(el); Sound.sfx('scan'); }));

/* ---------- sound: ambient bed + techy UI effects (all generated, no files) ---------- */
const Sound = (() => {
  let ctx, master, sfxBus, built = false, on = false, timer, lastHover = 0;
  const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

    // UI effects bus
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9;
    hp.connect(sfxBus); sfxBus.connect(ctx.destination); sfxBus._in = hp;

    // pad
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800; lp.Q.value = .3; lp.connect(master);
    [110, 164.81, 220, 277.18, 329.63].forEach(f => {
      [-7, 7].forEach(d => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.detune.value = d; g.gain.value = .04;
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = .04 + Math.random() * .08; lg.gain.value = .028;
        lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(lp); o.start(); lfo.start();
      });
    });
    // air
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 500;
    const nlfo = ctx.createOscillator(), nlg = ctx.createGain(); nlfo.frequency.value = .07; nlg.gain.value = 240;
    nlfo.connect(nlg); nlg.connect(nf.frequency);
    const ng = ctx.createGain(); ng.gain.value = .45;
    src.connect(nf); nf.connect(ng); ng.connect(master); src.start(); nlfo.start();
    // echo for chimes
    const delay = ctx.createDelay(); delay.delayTime.value = .55;
    const fb = ctx.createGain(); fb.gain.value = .4;
    const wet = ctx.createBiquadFilter(); wet.type = 'lowpass'; wet.frequency.value = 2200;
    delay.connect(wet); wet.connect(fb); fb.connect(delay); wet.connect(master);
    ctx._echo = delay;
    built = true; return true;
  }

  function chime() {
    if (!on) return;
    const f = scale[Math.floor(Math.random() * scale.length)], t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + 3);
    o.connect(g); g.connect(master); g.connect(ctx._echo); o.start(t); o.stop(t + 3.2);
    timer = setTimeout(chime, 4500 + Math.random() * 7000);
  }

  function tone(o) {
    const { f = 800, to = null, d = .05, type = 'square', v = .03, at = 0 } = o;
    const t = ctx.currentTime + at, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    osc.connect(g); g.connect(sfxBus._in); osc.start(t); osc.stop(t + d + .03);
  }
  function sfx(kind) {
    if (!on || !built) return;
    const now = performance.now();
    switch (kind) {
      case 'hover':
        if (now - lastHover < 70) return; lastHover = now;
        tone({ f: 2000, to: 3000, d: .035, v: .02 }); tone({ f: 1300, d: .02, v: .012, at: .035 }); break;
      case 'click':
        tone({ f: 540, to: 240, d: .09, type: 'sawtooth', v: .035 }); tone({ f: 1080, d: .05, v: .02, at: .05 }); break;
      case 'scan':
        for (let i = 0; i < 5; i++) tone({ f: 900 + i * 260, d: .03, v: .014, at: i * .045 }); break;
      case 'key':
        tone({ f: 1100 + Math.random() * 400, d: .018, v: .018 }); break;
      case 'error':
        tone({ f: 220, d: .09, type: 'sawtooth', v: .035 }); tone({ f: 165, d: .14, type: 'sawtooth', v: .035, at: .1 }); break;
      case 'enter':
        tone({ f: 160, to: 1800, d: .55, type: 'sawtooth', v: .04 }); tone({ f: 320, to: 3200, d: .55, type: 'sine', v: .03 }); break;
      case 'drop':
        tone({ f: 880, d: .08, type: 'sine', v: .05 }); tone({ f: 1320, d: .12, type: 'sine', v: .05, at: .09 }); tone({ f: 1760, d: .2, type: 'sine', v: .05, at: .2 }); break;
    }
  }

  async function start() {
    if (!built && !build()) return false;
    try { await ctx.resume(); } catch (e) {}
    on = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(.5, ctx.currentTime, 1.3);
    clearTimeout(timer); timer = setTimeout(chime, 1500);
    return true;
  }
  function stop() {
    if (!built) return;
    on = false; clearTimeout(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, .4);
    setTimeout(() => { if (!on) ctx.suspend(); }, 1800);
  }
  return { start, stop, sfx, get on() { return on; } };
})();

const soundBtn = $('#soundBtn');
function setSoundUI(v) { soundBtn.setAttribute('aria-pressed', v ? 'true' : 'false'); }
soundBtn.addEventListener('click', async () => {
  if (Sound.on) { Sound.stop(); setSoundUI(false); }
  else { const ok = await Sound.start(); setSoundUI(ok); if (ok) Sound.sfx('click'); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && Sound.on) { Sound.stop(); setSoundUI(false); } });

/* hover + click sounds on anything interactive */
const SFX_SEL = 'a, button, .svc, .card, .chip, .portrait, .term';
let lastEl = null;
document.addEventListener('pointerover', e => {
  const t = e.target.closest(SFX_SEL);
  if (t && t !== lastEl) Sound.sfx('hover');
  lastEl = t;
});
document.addEventListener('click', e => { if (e.target.closest('a, button, .chip')) Sound.sfx('click'); });

/* ---------- loader ---------- */
const loader = $('#loader'), num = $('#ldNum'), bar = $('#ldBar');
loader.classList.add('show');
let p = 0;
const tick = setInterval(() => {
  p = Math.min(100, p + (reduced ? 25 : 2 + Math.random() * 5));
  num.textContent = Math.round(p);
  bar.style.transform = `scaleX(${p / 100})`;
  if (p >= 100) {
    clearInterval(tick);
    loader.classList.add('ready');
    $('#enter').disabled = false; $('#enterQuiet').disabled = false;
  }
}, 60);

function enterSite(withSound) {
  const go = () => {
    loader.classList.add('out');
    document.body.classList.remove('locked');
    setTimeout(() => {
      $$('.hero [data-split], .hero .reveal').forEach(el => el.classList.add('in'));
    }, 450);
  };
  if (withSound) Sound.start().then(ok => { setSoundUI(ok); Sound.sfx('enter'); });
  go();
}
$('#enter').addEventListener('click', () => enterSite(true));
$('#enterQuiet').addEventListener('click', () => enterSite(false));

/* ---------- rotating word ---------- */
const words = ['build', 'tinker with', 'break', 'film', 'ship', 'obsess over'];
const rot = $('#rotator');
let wi = 0;
if (!reduced) setInterval(() => {
  rot.classList.add('out');
  setTimeout(() => {
    wi = (wi + 1) % words.length;
    rot.textContent = words[wi];
    rot.classList.remove('out'); rot.classList.add('pre');
    void rot.offsetWidth;
    rot.classList.remove('pre');
  }, 600);
}, 2600);

/* ---------- cursor, hero parallax, magnetic buttons ---------- */
let mx = innerWidth / 2, my = innerHeight / 2;
const hero = $('.hero'), portrait = $('.hero .portrait'), spot = $('.hero .spot');
addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY;
  const sec = e.target.closest ? e.target.closest('[data-theme]') : null;
  document.body.dataset.cur = sec ? sec.dataset.theme : 'dark';
}, { passive: true });

if (fine) {
  document.body.classList.add('has-cursor');
  const dot = $('.cur-dot'), ring = $('.cur-ring'), txt = $('.cur-txt');
  let rx = mx, ry = my;
  addEventListener('pointermove', () => { dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
  document.addEventListener('pointerover', e => {
    const label = e.target.closest('[data-cursor]');
    if (label) { txt.textContent = label.dataset.cursor; ring.classList.add('txt'); ring.classList.remove('big'); }
    else {
      ring.classList.remove('txt');
      ring.classList.toggle('big', !!e.target.closest('a,button,input,textarea,.chip'));
    }
  });
  (function loop() {
    rx += (mx - rx) * .17; ry += (my - ry) * .17;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
}
hero.addEventListener('pointermove', e => {
  const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  spot.style.setProperty('--mx', (x + .5) * 100 + '%'); spot.style.setProperty('--my', (y + .5) * 100 + '%');
  if (!reduced) { portrait.style.setProperty('--px', x * -34 + 'px'); portrait.style.setProperty('--py', y * -26 + 'px'); }
});
if (fine && !reduced) $$('[data-mag]').forEach(b => {
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
  });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});

/* portrait fallback when latif.jpg is missing */
$$('.portrait img').forEach(img => {
  const miss = () => img.closest('.portrait').classList.add('noimg');
  if (img.complete && !img.naturalWidth) miss();
  img.addEventListener('error', miss);
});

/* ---------- scroll: progress bar + marquee skew ---------- */
const progress = $('.progress i');
let lastY = scrollY, vel = 0;
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
}, { passive: true });
const skews = $$('.skew');
if (!reduced) (function skewLoop() {
  const dy = scrollY - lastY; lastY = scrollY;
  vel += (dy - vel) * .12;
  const s = Math.max(-9, Math.min(9, vel * -.35));
  skews.forEach(el => el.style.transform = `skewX(${s}deg)`);
  requestAnimationFrame(skewLoop);
})();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
function observe(root = document) {
  $$('.reveal:not(.in), .card:not(.in), [data-split]:not(.in)', root)
    .filter(el => !el.closest('.hero') && !el.closest('#loader')).forEach(el => io.observe(el));
}
$$('.hero .reveal').forEach((el, i) => el.style.setProperty('--rd', 700 + i * 140 + 'ms'));
observe();
$('#year').textContent = new Date().getFullYear();

/* ---------- clock + session timer ---------- */
const clock = $('#clock'), session = $('#session'), t0 = Date.now();
const pad = n => String(n).padStart(2, '0');
function tickClock() {
  try {
    clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: CONFIG.timezone }).format(new Date());
  } catch (e) { clock.textContent = '--:--'; }
  const s = Math.floor((Date.now() - t0) / 1000);
  session.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
}
tickClock(); setInterval(tickClock, 1000);

/* ---------- projects feed ---------- */
const grid = $('#grid'), filters = $('#filters'), empty = $('#empty');
let projects = [], activePlatform = 'all', lastSig = '';
const PLATFORM = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', x: 'X', twitter: 'X', github: 'GitHub', facebook: 'Facebook', other: 'Project' };
const safeUrl = u => { try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch (e) { return '#'; } };
const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const plat = pj => (pj.platform || 'other').toLowerCase();

function card(pj, idx) {
  const a = document.createElement('a');
  a.className = 'card'; a.href = safeUrl(pj.url); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.dataset.cursor = 'open';

  const thumb = document.createElement('div'); thumb.className = 'thumb';
  const ph = document.createElement('div'); ph.className = 'ph';
  // placeholder stays on-palette: black, red and white only
  const flip = hue(pj.title || 'x') % 2;
  ph.style.background = flip
    ? 'linear-gradient(135deg,#ff2b2b 0 55%,#0a0a0a 55% 100%)'
    : 'linear-gradient(135deg,#0a0a0a 0 45%,#ff2b2b 45% 100%)';
  thumb.appendChild(ph);
  if (pj.thumbnail) {
    const img = new Image(); img.src = safeUrl(pj.thumbnail); img.alt = ''; img.loading = 'lazy';
    img.onerror = () => img.remove(); thumb.appendChild(img);
  } else {
    const pt = document.createElement('span'); pt.className = 'ph-t'; pt.textContent = (pj.title || '').split(' ').slice(0, 2).join(' '); thumb.appendChild(pt);
  }
  const badge = document.createElement('span'); badge.className = 'badge mono'; badge.textContent = PLATFORM[plat(pj)] || pj.platform;
  const arrow = document.createElement('span'); arrow.className = 'arrow';
  arrow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  thumb.append(badge, arrow);

  const body = document.createElement('div'); body.className = 'body';
  const meta = document.createElement('div'); meta.className = 'meta mono';
  const ix = document.createElement('span'); ix.className = 'idx'; ix.textContent = pad(idx + 1);
  const d = new Date(pj.date), tm = document.createElement('time');
  tm.textContent = isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  meta.append(ix, tm);
  const h3 = document.createElement('h3'); h3.textContent = pj.title || 'Untitled';
  const desc = document.createElement('p'); desc.textContent = pj.description || '';
  const tags = document.createElement('div'); tags.className = 'tags';
  (pj.tags || []).slice(0, 4).forEach(t => { const s = document.createElement('span'); s.textContent = t; tags.appendChild(s); });
  body.append(meta, h3, desc, tags);
  a.append(thumb, body);

  if (!reduced && fine) {
    a.addEventListener('pointermove', e => {
      const r = a.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      a.style.transform = `rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg)`;
      a.style.setProperty('--mx', x * 100 + '%'); a.style.setProperty('--my', y * 100 + '%');
    });
    a.addEventListener('pointerleave', () => { a.style.transform = ''; });
  }
  return a;
}
function renderFilters() {
  const platforms = ['all', ...new Set(projects.map(plat))];
  filters.textContent = '';
  platforms.forEach(pl => {
    const b = document.createElement('button');
    b.className = 'chip' + (pl === activePlatform ? ' on' : '');
    b.textContent = pl === 'all' ? 'all' : (PLATFORM[pl] || pl);
    b.addEventListener('click', () => { activePlatform = pl; renderFilters(); renderGrid(); });
    filters.appendChild(b);
  });
}
function renderGrid() {
  grid.textContent = '';
  const list = projects.filter(p => activePlatform === 'all' || plat(p) === activePlatform);
  empty.hidden = list.length > 0;
  list.forEach((p, i) => { const c = card(p, i); c.style.transitionDelay = Math.min(i, 8) * 70 + 'ms'; grid.appendChild(c); });
  requestAnimationFrame(() => observe(grid));
}
function countUp(el, to) {
  const from = +el.textContent || 0;
  if (reduced || from === to) { el.textContent = to; return; }
  const s0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - s0) / 900);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  })(s0);
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3500);
}
function setLatest(pj) {
  const el = $('#latest');
  if (!pj) { el.hidden = true; return; }
  $('b', el).textContent = pj.title || 'new project';
  el.href = safeUrl(pj.url) === '#' ? '#work' : safeUrl(pj.url);
  if (el.href.startsWith('http')) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
  el.hidden = false;
}
async function loadFeed(first) {
  let data;
  try {
    const r = await fetch(`${CONFIG.feedUrl}?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    data = await r.json();
  } catch (e) { if (!first) return; data = FALLBACK; }
  const list = (Array.isArray(data) ? data : data.projects || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const sig = JSON.stringify(list);
  if (sig === lastSig) return;
  const prev = projects.length;
  lastSig = sig; projects = list;
  if (!list.some(p => plat(p) === activePlatform)) activePlatform = 'all';
  renderFilters(); renderGrid();
  countUp($('#count'), list.length); countUp($('#platCount'), new Set(list.map(plat)).size);
  setLatest(list[0]);
  if (data.updated) { const d = new Date(data.updated); if (!isNaN(d)) $('#updated').textContent = '/ updated ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  if (!first && list.length > prev) { toast('✦ new project just dropped'); Sound.sfx('drop'); }
}
grid.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
loadFeed(true);
setInterval(() => { if (!document.hidden) loadFeed(false); }, CONFIG.feedPollMs);

/* ---------- terminal ---------- */
const termBody = $('#termBody'), termIn = $('#termIn'), history = [];
let hi = 0;
function out(text, cls = 'ok') { const p = document.createElement('p'); p.className = cls; p.textContent = text; termBody.appendChild(p); termBody.scrollTop = termBody.scrollHeight; return p; }
function outLink(label, href) {
  const p = document.createElement('p'); p.className = 'ok';
  const a = document.createElement('a'); a.href = safeUrl(href); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label;
  p.appendChild(a); termBody.appendChild(p); termBody.scrollTop = termBody.scrollHeight;
}
const COMMANDS = {
  help: () => out('commands:\n  whoami     who is this\n  hobbies    what I get obsessed with\n  projects   everything in the feed\n  latest     newest drop\n  socials    where to find me\n  contact    get in touch\n  date       dhaka time\n  sound on|off\n  clear'),
  whoami: () => out(`${CONFIG.name}: serial hobbyist. builds things, documents them, posts them.`),
  hobbies: () => out('electronics, code, video, automation, and whatever I find next week.'),
  projects: () => projects.length ? projects.forEach((p, i) => out(`${pad(i + 1)}  ${p.title}  [${PLATFORM[plat(p)] || plat(p)}]`)) : out('feed is empty. first drop coming soon.'),
  latest: () => projects[0] ? outLink(`${projects[0].title} ↗`, projects[0].url) : out('nothing yet.'),
  socials: () => CONFIG.socials.forEach(s => outLink(`${s.name} ↗`, s.url)),
  contact: () => outLink(CONFIG.email, 'mailto:' + CONFIG.email),
  date: () => out(new Date().toLocaleString('en-GB', { timeZone: CONFIG.timezone, dateStyle: 'full', timeStyle: 'short' }) + ' (Dhaka)'),
  clear: () => { termBody.textContent = ''; },
  sudo: () => { out('nice try.', 'err'); Sound.sfx('error'); }
};
out('booting al-latif v1.0 ...', 'ok');
out('type "help" to see what I can do.', 'ok');
$('#termForm').addEventListener('submit', async e => {
  e.preventDefault();
  const raw = termIn.value.trim(); termIn.value = '';
  if (!raw) return;
  history.push(raw); hi = history.length;
  out('$ ' + raw, 'cmd');
  const [cmd, arg] = raw.toLowerCase().split(/\s+/);
  if (cmd === 'sound') {
    if (arg === 'on') { const ok = await Sound.start(); setSoundUI(ok); out(ok ? 'sound on.' : 'audio not supported here.'); }
    else if (arg === 'off') { Sound.stop(); setSoundUI(false); out('sound off.'); }
    else out('usage: sound on | sound off', 'err');
  } else if (cmd === 'mailto' || cmd === 'email') COMMANDS.contact();
  else if (COMMANDS[cmd]) COMMANDS[cmd]();
  else { out(`command not found: ${cmd}. try "help".`, 'err'); Sound.sfx('error'); }
});
termIn.addEventListener('keydown', e => {
  if (e.key.length === 1) Sound.sfx('key');
  if (e.key === 'ArrowUp' && history.length) { hi = Math.max(0, hi - 1); termIn.value = history[hi]; e.preventDefault(); }
  if (e.key === 'ArrowDown' && history.length) { hi = Math.min(history.length, hi + 1); termIn.value = history[hi] || ''; e.preventDefault(); }
});

/* ---------- contact ---------- */
const socials = $('#socials');
CONFIG.socials.forEach(s => {
  const li = document.createElement('li'), a = document.createElement('a');
  a.href = safeUrl(s.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.innerHTML = '<span></span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  a.firstChild.textContent = s.name;
  li.appendChild(a); socials.appendChild(li);
});
const mail = $('#mail'); mail.href = 'mailto:' + CONFIG.email; mail.textContent = CONFIG.email;

$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, msg = $('#formMsg');
  const name = f.name.value.trim(), email = f.email.value.trim(), message = f.message.value.trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) { msg.textContent = 'please fill in every field with a valid email.'; Sound.sfx('error'); return; }
  if (CONFIG.formEndpoint) {
    msg.textContent = 'sending...';
    try {
      const r = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name, email, message }) });
      if (!r.ok) throw new Error();
      f.reset(); msg.textContent = 'sent. talk soon ✦'; Sound.sfx('drop');
    } catch (err) { msg.textContent = 'something broke. try emailing me directly.'; Sound.sfx('error'); }
  } else {
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Hello from ' + name)}&body=${body}`;
    msg.textContent = 'opening your mail app...';
  }
});