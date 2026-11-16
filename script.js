// Rate & Tip — github.com/veraetogrex-portfolio · zero dependencies
// Rate the courier with one sweep across the stars; five stars unlock the tip options.
// Pick a tip: the order total rolls up. Send: the button collapses into a check and the courier's day counts up.

const root   = document.querySelector('#ratetip');
const stars  = [...root.querySelectorAll('.rt-star')];
const chips  = [...root.querySelectorAll('.rt-chip')];
const send   = root.querySelector('.rt-send');
const label  = root.querySelector('.rt-send .lbl');
const sumEl  = root.querySelector('.rt-sum');
const tipEl  = root.querySelector('.rt-tipv');
const today  = root.querySelector('.rt-today');
const ring   = root.querySelector('.rt-ava .ring circle');
const doneT  = root.querySelector('.rt-done-t');

const ORDER = 28, TODAY = 18;
let rating = 0, pct = null, sent = false, rolls = new Map();
const money = v => '$' + v.toFixed(2);

function reset() {
  root.classList.add('is-reset');                         // jump straight to the first frame
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-reset')));
  rating = 0; pct = null; sent = false; rolls = new Map();
  root.classList.remove('is-rated', 'has-tip', 'is-sent');
  stars.forEach(s => { s.classList.remove('is-on', 'is-pop'); s.setAttribute('aria-checked', 'false'); });
  chips.forEach((c, k) => { c.setAttribute('aria-checked', 'false'); c.style.transitionDelay = ''; c.tabIndex = -1; });
  ring.getAnimations().forEach(a => a.cancel()); ring.style.strokeDashoffset = 641;
  sumEl.textContent = money(ORDER); tipEl.textContent = money(0); today.textContent = money(TODAY); today.classList.remove('is-up');
  sendState();
}

// ── rating: tap a star or sweep across them ──
function rate(n) {
  if (sent || n === rating) return;
  const up = n > rating; rating = n;
  stars.forEach((s, k) => {
    const on = k < n; s.classList.toggle('is-on', on); s.setAttribute('aria-checked', k === n - 1 ? 'true' : 'false');
    if (on && up && k === n - 1) { s.classList.remove('is-pop'); void s.offsetWidth; s.classList.add('is-pop'); }
  });
  const open = n === 5;
  if (open && !root.classList.contains('is-rated')) chips.forEach((c, k) => { c.style.transitionDelay = `${120 + k * 70}ms`; c.tabIndex = 0; });
  root.classList.toggle('is-rated', open);
  sendState();
}
const starAt = e => { const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('rt-star')); return el ? +el.dataset.n : 0; };
root.querySelector('.rt-stars').addEventListener('pointerdown', e => {
  const n = starAt(e); if (!n || sent) return; rate(n);
  const move = ev => { const m = starAt(ev); if (m && m > rating) rate(m); };
  const end = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); };
  addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
});
stars.forEach(s => s.addEventListener('click', e => { if (e.detail === 0) rate(+s.dataset.n); }));   // keyboard

// ── tip: the tip row slides into the order, the total rolls ──
function tip(p) {
  if (sent || !root.classList.contains('is-rated')) return;
  pct = p;
  chips.forEach(c => { c.style.transitionDelay = ''; c.setAttribute('aria-checked', +c.dataset.p === p ? 'true' : 'false'); });
  const t = ORDER * p / 100;
  root.classList.toggle('has-tip', p > 0);
  roll(tipEl, t); roll(sumEl, ORDER + t);
  sendState();
}
chips.forEach(c => c.addEventListener('click', () => tip(+c.dataset.p)));

function roll(el, to, ms = 520) {
  const from = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0, t0 = performance.now(), id = {};
  rolls.set(el, id);
  const step = now => {
    if (rolls.get(el) !== id) return;
    const p = Math.min(1, (now - t0) / ms), e = 1 - (1 - p) ** 3;
    el.textContent = money(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function sendState() {
  const ready = rating > 0 && (rating < 5 || pct !== null);
  send.classList.toggle('is-ready', ready && !sent); send.setAttribute('aria-disabled', ready && !sent ? 'false' : 'true');
  label.textContent = !rating ? 'Rate to continue' : rating < 5 ? 'Send rating' : pct === null ? 'Choose a tip' : pct === 0 ? 'Send rating' : `Send ${money(ORDER * pct / 100)} to Alex`;
}

// ── send: the button folds into a check, the courier's day counts up ──
send.addEventListener('click', () => {
  if (sent || send.getAttribute('aria-disabled') === 'true') return;
  sent = true;
  const t = pct ? ORDER * pct / 100 : 0;
  doneT.textContent = t ? `${money(t)} sent to Alex` : 'Rating sent to Alex';
  root.classList.add('is-sent'); sendState();
  chips.forEach(c => c.tabIndex = -1);
  ring.animate([{ strokeDashoffset: 641 }, { strokeDashoffset: 0 }], { duration: 700, delay: 250, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  if (t) setTimeout(() => { today.classList.add('is-up'); roll(today, TODAY + t, 700); }, 350);
});

// fade back to the first frame (used when a demo loops)
function rewind() {
  root.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)', offset: .45 }, { opacity: 0, filter: 'blur(8px)', offset: .55 }, { opacity: 1, filter: 'blur(0px)' }], { duration: 700, easing: 'ease-in-out' });
  setTimeout(reset, 320);
}

reset();
root.ratetip = { reset, rewind, star: n => stars[n - 1], chip: p => chips.find(c => +c.dataset.p === p), send };   // for scripted demos
