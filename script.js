/* =========================================================
   Joyeux anniversaire — moteur d'animations (vanilla JS)
   ---------------------------------------------------------
   >>> PERSONNALISE ICI (les 3 seules lignes à changer) <<<
   ========================================================= */
const CONFIG = {
  prenom: "Ghyskaline",                              // prénom (utilisé dans le code </prénom>)
  nomComplet: "Jedidia Ghyskaline Louvouezo Nuchaku", // nom complet affiché sous le titre
  age: null,                                      // ex: 20  (ou null pour ne rien afficher)
  de: "quelqu'un qui croit en toi",               // signature (de la part de qui)
};
/* ========================================================= */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);

/* ---------- Petites infos dérivées ---------- */
document.title = `Joyeux anniversaire ${CONFIG.prenom} !`;
$('#heroName').textContent = `</${CONFIG.prenom}>`;
$('#signFrom').textContent = `— ${CONFIG.de}`;
if (CONFIG.nomComplet) $('#heroFull').textContent = CONFIG.nomComplet;
if (CONFIG.age != null) {
  const a = $('#heroAge');
  a.textContent = `niveau ${CONFIG.age} débloqué`;
  a.hidden = false;
}

/* =========================================================
   1) INTRO — terminal qui s'écrit tout seul
   ========================================================= */
const termBody = $('#termBody');
const launchBtn = $('#launchBtn');

const termLines = [
  { html: '<span class="muted">$</span> git clone party.git', d: 22 },
  { html: '<span class="ok">✓</span> <span class="muted">Clonage du bonheur…</span>', d: 12 },
  { html: '<span class="muted">$</span> npm run <span class="path">birthday</span>', d: 22 },
  { html: '<span class="ok">✓</span> confettis chargés', d: 12 },
  { html: '<span class="ok">✓</span> feux d\'artifice prêts', d: 12 },
  { html: '<span class="warn">!</span> <span class="muted">un message important détecté…</span>', d: 12 },
  { html: '<span class="ok">✓</span> build réussi en 0.42s', d: 12 },
  { html: '', d: 4 },
  { html: '<span class="path">→</span> prête ?', d: 30 },
];

async function typeTerminal() {
  for (const line of termLines) {
    const el = document.createElement('div');
    termBody.appendChild(el);
    if (line.html === '') { await sleep(120); continue; }
    // écrit le HTML caractère par caractère (en respectant les balises)
    await typeHTML(el, line.html, REDUCED ? 2 : line.d);
    await sleep(REDUCED ? 20 : 90);
  }
  launchBtn.classList.add('show');
}

function typeHTML(el, html, delay) {
  return new Promise(resolve => {
    let i = 0;
    (function step() {
      // avance jusqu'au prochain caractère "visible" en gardant les balises entières
      if (i >= html.length) { resolve(); return; }
      if (html[i] === '<') { i = html.indexOf('>', i) + 1; }
      else { i++; }
      el.innerHTML = html.slice(0, i) + '<span class="cursor">&nbsp;</span>';
      if (i >= html.length) { el.innerHTML = html; resolve(); return; }
      setTimeout(step, delay);
    })();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================================
   2) CANVAS — confettis + feux d'artifice
   ========================================================= */
const canvas = $('#fx');
const ctx = canvas.getContext('2d');
let W, H, DPR;
const confetti = [];
const rockets = [];
const sparks = [];
const PALETTE = ['#ff5c8a', '#22d3ee', '#a855f7', '#ffd166', '#37f0a0', '#ffffff'];
let running = false;
let ambientTimer = 0;
let sparklerOn = false;      // bougies-cierges actives
let candleFlames = [];       // positions des flammes (bougies)
let sparkTick = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

/* --- Confettis --- */
function spawnConfetti(count, originX, originY, spread) {
  const n = REDUCED ? Math.min(count, 24) : count;
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: originX ?? rand(0, W),
      y: originY ?? rand(-40, 0),
      vx: originX != null ? rand(-spread, spread) : rand(-1.2, 1.2),
      vy: originY != null ? rand(-14, -4) : rand(2, 5),
      g: rand(0.12, 0.24),
      size: rand(6, 12),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.2, 0.2),
      color: pick(PALETTE),
      shape: (Math.random() * 3) | 0,
      life: 1,
      wob: rand(0, Math.PI * 2),
    });
  }
}

/* --- Feux d'artifice --- */
function launchRocket(targetX) {
  const x = targetX ?? rand(W * 0.15, W * 0.85);
  rockets.push({
    x, y: H,
    vx: rand(-0.6, 0.6),
    vy: rand(-11, -8.5),
    color: pick(PALETTE),
    targetY: rand(H * 0.15, H * 0.45),
  });
}

function explode(x, y, color) {
  const n = REDUCED ? 24 : 54;
  const speed = rand(2.5, 4.5);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + rand(-0.05, 0.05);
    const s = speed * rand(0.5, 1);
    sparks.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      g: 0.06,
      color: Math.random() < 0.7 ? color : pick(PALETTE),
      life: 1,
      decay: rand(0.010, 0.022),
      size: rand(1.6, 3),
    });
  }
  if (soundOn) playBoom();
}

function loop() {
  ctx.clearRect(0, 0, W, H);

  // confettis
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.vy += p.g;
    p.wob += 0.1;
    p.x += p.vx + Math.sin(p.wob) * 0.6;
    p.y += p.vy;
    p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    else if (p.shape === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (p.y > H + 40) confetti.splice(i, 1);
  }

  // fusées
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.x += r.vx;
    r.y += r.vy;
    r.vy += 0.12;
    ctx.beginPath();
    ctx.fillStyle = r.color;
    ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillRect(r.x - 1, r.y, 2, 8);
    ctx.globalAlpha = 1;
    if (r.vy >= 0 || r.y <= r.targetY) {
      explode(r.x, r.y, r.color);
      rockets.splice(i, 1);
    }
  }

  // bougies-cierges : jet d'étincelles dorées depuis chaque flamme
  if (sparklerOn && !REDUCED) {
    sparkTick++;
    if (sparkTick % 2 === 0) {
      for (const fl of candleFlames) {
        const r = fl.getBoundingClientRect();
        if (r.width === 0) continue;
        const x = r.left + r.width / 2;
        const y = r.top + 2;
        for (let k = 0; k < 2; k++) {
          sparks.push({
            x: x + rand(-2, 2), y,
            vx: rand(-1.6, 1.6),
            vy: rand(-2.6, -0.3),
            g: 0.07,
            color: Math.random() < 0.5 ? '#ffd166' : '#fff3b0',
            life: 1,
            decay: rand(0.04, 0.08),
            size: rand(1, 2.1),
          });
        }
      }
    }
  }

  // étincelles
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.vx *= 0.985;
    s.vy = s.vy * 0.985 + s.g;
    s.x += s.vx;
    s.y += s.vy;
    s.life -= s.decay;
    if (s.life <= 0) { sparks.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(s.life, 0);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ambiance : feu d'artifice de temps en temps
  if (!REDUCED && running) {
    ambientTimer--;
    if (ambientTimer <= 0) {
      launchRocket();
      ambientTimer = rand(80, 170);
    }
  }

  requestAnimationFrame(loop);
}

/* =========================================================
   3) Pluie de symboles + ballons
   ========================================================= */
function buildCodeRain() {
  if (REDUCED) return;
  const host = $('#codeRain');
  const glyphs = ['{', '}', '<', '>', '/', ';', '()', '=>', '[]', '#', '*', '01', '&&'];
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('span');
    s.textContent = pick(glyphs);
    s.style.left = rand(0, 100) + 'vw';
    s.style.fontSize = rand(14, 40) + 'px';
    s.style.animationDuration = rand(9, 22) + 's';
    s.style.animationDelay = -rand(0, 20) + 's';
    host.appendChild(s);
  }
}

function spawnBalloon() {
  if (REDUCED) return;
  const b = document.createElement('div');
  b.className = 'balloon';
  const c = pick(PALETTE);
  b.style.background = `radial-gradient(circle at 32% 28%, #ffffffcc 0 6%, ${c} 40%, ${c} 100%)`;
  b.style.left = rand(2, 92) + 'vw';
  b.style.setProperty('--drift', rand(-60, 60) + 'px');
  b.style.animationDuration = rand(8, 15) + 's';
  const scale = rand(0.7, 1.3);
  b.style.transform = `scale(${scale})`;
  document.body.appendChild(b);
  b.addEventListener('animationend', () => b.remove());
}

/* =========================================================
   4) SON — WebAudio (aucun fichier requis)
   ========================================================= */
let audioCtx = null, master = null, soundOn = true;

function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);
  } catch (e) { soundOn = false; }
}

function note(freq, start, dur, type = 'triangle', vol = 0.3) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g); g.connect(master);
  const t = audioCtx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function playFanfare() {
  if (!soundOn || !audioCtx) return;
  // do - mi - sol - do (accord montant joyeux)
  const seq = [523.25, 659.25, 783.99, 1046.5];
  seq.forEach((f, i) => note(f, i * 0.12, 0.5, 'triangle', 0.28));
  note(392, 0.48, 0.7, 'sine', 0.2);
}

function playBoom() {
  if (!audioCtx) return;
  note(rand(180, 320), 0, 0.18, 'sawtooth', 0.08);
}

function playPop() {
  if (!soundOn || !audioCtx) return;
  note(880, 0, 0.12, 'square', 0.18);
  note(1320, 0.05, 0.2, 'triangle', 0.15);
}

// souffle sur les bougies : bruit filtré descendant ("whoosh")
function playPuff() {
  if (!soundOn || !audioCtx) return;
  const dur = 0.45;
  const buffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); // bruit qui s'éteint
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  const t = audioCtx.currentTime;
  lp.frequency.setValueAtTime(1500, t);
  lp.frequency.exponentialRampToValueAtTime(280, t + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(lp); lp.connect(g); g.connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

/* =========================================================
   5) Machine à écrire (hero + message)
   ========================================================= */
const heroSub = $('#heroSub');
const heroPhrases = [
  '// developpeuse',
  '// battante',
  '// future ingénieure',
  "// celle qui n'abandonne jamais",
];
let hp = 0;
function heroLoop() {
  const txt = heroPhrases[hp % heroPhrases.length];
  let i = 0;
  const type = () => {
    heroSub.innerHTML = txt.slice(0, i) + '<span class="cursor">&nbsp;</span>';
    i++;
    if (i <= txt.length) setTimeout(type, 55);
    else setTimeout(erase, 1400);
  };
  const erase = () => {
    heroSub.innerHTML = txt.slice(0, i) + '<span class="cursor">&nbsp;</span>';
    i--;
    if (i >= 0) setTimeout(erase, 28);
    else { hp++; setTimeout(type, 250); }
  };
  type();
}

/* ---- Message : tokens colorés, tapés au scroll ---- */
const MSG = [
  [['cm', "/* message.js */"]],
  [],
  [['kw', 'const '], ['', 'toi = '], ['fn', 'developpeuse'], ['', ';']],
  [],
  [['kw', 'function '], ['fn', 'pourTonAnniversaire'], ['', '() {']],
  [['cm', "  // D'abord : joyeux anniversaire."]],
  [['cm', "  // Vraiment, de tout mon coeur."]],
  [],
  [['', '  '], ['fn', 'console'], ['', '.'], ['fn', 'log'], ['', '('], ['str', '"Tu as choisi de coder,"'], ['', ');']],
  [['', '  '], ['fn', 'console'], ['', '.'], ['fn', 'log'], ['', '('], ['str', '"et ca, c\'est deja du courage."'], ['', ');']],
  [],
  [['cm', "  // Ici, ce n'est pas la Silicon Valley."]],
  [['cm', "  // Il y a les bugs qui resistent a 2h du matin,"]],
  [['cm', "  // la connexion qui lache au pire moment,"]],
  [['cm', "  // et l'electricite qui coupe en plein build."]],
  [],
  [['kw', '  while '], ['', '('], ['accent', 'obstacles'], ['', ') {']],
  [['', '    toi.'], ['fn', 'respire'], ['', '();']],
  [['', '    toi.'], ['fn', 'recommence'], ['', '();   '], ['cm', '// encore. et encore.']],
  [['', '    toi.'], ['fn', 'continue'], ['', '();     '], ['cm', '// c\'est ca, une vraie dev.']],
  [['', '  }']],
  [],
  [['cm', '  // Chaque bug resolu te rend plus forte.']],
  [['cm', "  // Chaque ligne t'approche de la femme"]],
  [['cm', '  // que tu es en train de devenir.']],
  [],
  [['kw', '  return '], ['str', '"Ne lache rien."'], ['', ';']],
  [['', '}']],
  [],
  [['cm', '// Joyeux anniversaire, '], ['gold', '__PRENOM__'], ['cm', '.']],
  [['fn', 'pourTonAnniversaire'], ['', '();']],
];

function buildGutter(lines) {
  const g = $('#gutter');
  g.innerHTML = '';
  for (let i = 1; i <= lines; i++) {
    const s = document.createElement('span');
    s.textContent = i;
    g.appendChild(s);
  }
}

let msgTyped = false;
function typeMessage() {
  if (msgTyped) return;
  msgTyped = true;
  const codeEl = $('#code');
  // remplace le prénom
  const lines = MSG.map(line =>
    line.map(([c, t]) => [c, t.replace('__PRENOM__', CONFIG.prenom)])
  );
  buildGutter(lines.length);
  codeEl.innerHTML = '';

  function finishInstant() {
    codeEl.innerHTML = lines.map(line =>
      line.map(([c, t]) => c ? `<span class="${c}">${escapeHtml(t)}</span>` : escapeHtml(t)).join('')
    ).join('\n');
  }

  if (REDUCED) { finishInstant(); return; }

  let li = 0, ti = 0, ci = 0, curSpan = null, done = false;

  // permet de tout afficher d'un coup en tapant sur l'éditeur
  $('#message').addEventListener('click', () => {
    if (done) return;
    done = true;
    finishInstant();
  }, { once: true });

  function step() {
    if (done || li >= lines.length) return;
    const line = lines[li];

    if (ti >= line.length) {                 // fin de ligne
      codeEl.appendChild(document.createTextNode('\n'));
      li++; ti = 0; ci = 0; curSpan = null;
    } else {
      const [cls, text] = line[ti];
      if (ci === 0) {
        curSpan = document.createElement('span');
        if (cls) curSpan.className = cls;
        codeEl.appendChild(curSpan);
      }
      if (ci < text.length) {
        curSpan.textContent += text[ci];
        ci++;
      } else {
        ti++; ci = 0; curSpan = null;
      }
    }
    setTimeout(step, 8);
  }
  step();
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

/* =========================================================
   6) Révélation au scroll
   ========================================================= */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      if (e.target.id === 'message' || e.target.closest('#message')) typeMessage();
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.18 });

/* =========================================================
   7) Gâteau interactif
   ========================================================= */
function setupCake() {
  const cake = $('#cake');
  candleFlames = Array.from(document.querySelectorAll('.candle .flame'));
  let blown = false;

  // le gâteau se monte + les cierges s'allument quand il est visible
  const cakeIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        cake.classList.add('cake--in');
        sparklerOn = !blown;
      } else {
        sparklerOn = false;
      }
    });
  }, { threshold: 0.35 });
  cakeIO.observe(cake);

  const emitSmoke = () => {
    document.querySelectorAll('.candle').forEach(c => {
      // deux volutes par bougie, décalées, qui partent dans deux sens
      for (let k = 0; k < 2; k++) {
        const s = document.createElement('span');
        s.className = 'smoke';
        s.style.animationDelay = (k * 0.14) + 's';
        s.style.setProperty('--sx', (k ? rand(4, 9) : rand(-9, -4)) + 'px');
        c.appendChild(s);
        setTimeout(() => s.remove(), 2700);
      }
    });
  };

  // envoie une lumière (le vœu) depuis les bougies vers le ciel
  const sendWishToSky = (x, y) => {
    if (REDUCED) return;
    const light = document.createElement('div');
    light.className = 'wish-light';
    light.style.left = x + 'px';
    light.style.top = y + 'px';
    document.body.appendChild(light);
    light.addEventListener('animationend', () => light.remove());
  };

  const blow = () => {
    if (blown) return;
    blown = true;
    sparklerOn = false;
    cake.classList.add('blown');
    $('#cakeHint').textContent = '';

    const r = cake.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const topY = r.top - 40;               // hauteur des flammes

    // 1) le souffle : bruit doux + fumée
    if (soundOn) playPuff();
    emitSmoke();

    // 2) le vœu s'élève vers le ciel
    setTimeout(() => sendWishToSky(cx, topY), 350);

    // 3) la célébration, une fois les bougies bien éteintes
    setTimeout(() => {
      spawnConfetti(150, cx, r.top, 8);
      for (let i = 0; i < 5; i++) setTimeout(() => launchRocket(rand(W * 0.2, W * 0.8)), i * 160);
      if (soundOn) { playPop(); playFanfare(); }
    }, 750);

    // 4) le message du vœu
    setTimeout(() => $('#wish').classList.add('show'), 1500);
  };
  cake.addEventListener('click', blow);
  cake.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blow(); } });
}

/* =========================================================
   7bis) Tilt 3D des photos (doigt + gyroscope) + reflet
   ========================================================= */
function setupTilt() {
  const state = Array.from(document.querySelectorAll('.polaroid')).map(card => ({
    card,
    img: card.querySelector('.polaroid__img'),
    shine: card.querySelector('.polaroid__shine'),
    pointer: false,
  }));

  const apply = (s, px, py) => {
    const rx = clamp(-py * 12, -14, 14);
    const ry = clamp(px * 14, -16, 16);
    s.img.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (s.shine) {
      s.shine.style.opacity = '0.5';
      s.shine.style.transform = `translate(${px * 45}%, ${py * 45}%)`;
    }
  };
  const reset = (s) => {
    s.img.style.transform = '';
    if (s.shine) s.shine.style.opacity = '0';
  };

  state.forEach(s => {
    s.card.addEventListener('pointermove', e => {
      const r = s.card.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 2 - 1;
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.pointer = true;
      apply(s, px, py);
    });
    const leave = () => { s.pointer = false; reset(s); };
    s.card.addEventListener('pointerleave', leave);
    s.card.addEventListener('pointercancel', leave);
  });

  // gyroscope : inclinaison douce des cartes non touchées
  let gpx = 0, gpy = 0, gyroOn = false;
  const onOrient = (e) => {
    if (e.gamma == null || e.beta == null) return;
    gyroOn = true;
    gpx = clamp(e.gamma / 30, -1, 1);
    gpy = clamp((e.beta - 45) / 30, -1, 1);
  };
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(st => { if (st === 'granted') window.addEventListener('deviceorientation', onOrient); })
      .catch(() => {});
  } else if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', onOrient);
  }

  (function gyroLoop() {
    if (gyroOn && !REDUCED) {
      state.forEach(s => { if (!s.pointer) apply(s, gpx * 0.7, gpy * 0.7); });
    }
    requestAnimationFrame(gyroLoop);
  })();
}

/* =========================================================
   8) Lancement
   ========================================================= */
function startParty() {
  initAudio();
  running = true;
  $('#intro').classList.add('hide');
  const site = $('#site');
  site.setAttribute('aria-hidden', 'false');
  site.classList.add('show');
  $('#soundToggle').hidden = false;

  requestAnimationFrame(loop);
  spawnConfetti(REDUCED ? 40 : 160);
  for (let i = 0; i < 5; i++) setTimeout(() => launchRocket(), i * 220);
  if (soundOn) playFanfare();
  heroLoop();

  // ballons réguliers
  if (!REDUCED) setInterval(spawnBalloon, 1400);

  // observe les sections à révéler
  document.querySelectorAll('.reveal, #message').forEach(el => io.observe(el));
  setupCake();
  setupTilt();
}

launchBtn.addEventListener('click', startParty, { once: true });

/* Rejouer les confettis */
$('#replay').addEventListener('click', () => {
  spawnConfetti(REDUCED ? 40 : 150);
  for (let i = 0; i < 4; i++) setTimeout(() => launchRocket(), i * 200);
  if (soundOn) playFanfare();
});

/* Bouton son */
$('#soundToggle').addEventListener('click', (e) => {
  soundOn = !soundOn;
  e.currentTarget.classList.toggle('muted', !soundOn);
  if (master) master.gain.value = soundOn ? 0.5 : 0;
});

/* =========================================================
   Go
   ========================================================= */
buildCodeRain();
typeTerminal();
