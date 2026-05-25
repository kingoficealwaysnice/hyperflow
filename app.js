/* ============================================================
   HYPERFLOW — APP.JS
   Particles · Stream animations · Counters · Interactions
============================================================ */

'use strict';

/* ── NAVBAR SCROLL ─────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* ── HAMBURGER MENU ────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});
navLinks.querySelectorAll('.nav-link').forEach(l => {
  l.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
  });
});

/* ── AOS (Animate on Scroll) ───────────────────────────────── */
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  elements.forEach(el => observer.observe(el));
}

/* ── PARTICLE CANVAS BACKGROUND ────────────────────────────── */
function initParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [], animFrame;

  const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#818cf8'];
  const N = 90;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.6 + 0.2);
      this.r  = Math.random() * 1.8 + 0.4;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = Math.random() * 0.6 + 0.2;
      this.life = 0; this.maxLife = Math.random() * 300 + 200;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }
    draw() {
      const progress = this.life / this.maxLife;
      const alpha = this.alpha * Math.sin(progress * Math.PI);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  resize();
  for (let i = 0; i < N; i++) particles.push(new Particle());

  // Draw connections
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const alpha = (1 - dist / 110) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animFrame = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); }, { passive: true });
  animate();
}

/* ── HERO STREAM CANVAS ─────────────────────────────────────── */
function initStreamCanvas() {
  const canvas = document.getElementById('streamCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width;
    H = canvas.height = rect.height;
  }

  const streams = [];
  const STREAM_COLORS = [
    ['rgba(99,102,241,', 0.18],
    ['rgba(6,182,212,',  0.14],
    ['rgba(168,85,247,', 0.12],
    ['rgba(129,140,248,',0.10],
  ];

  class Stream {
    constructor() { this.init(); }
    init() {
      this.x    = Math.random() * W;
      this.y    = -50;
      this.len  = Math.random() * 120 + 60;
      this.speed= Math.random() * 1.2 + 0.5;
      this.col  = STREAM_COLORS[Math.floor(Math.random() * STREAM_COLORS.length)];
      this.w    = Math.random() * 2 + 0.5;
      this.angle= (Math.random() - 0.5) * 0.3;
    }
    update() {
      this.y += this.speed;
      this.x += Math.sin(this.angle) * 0.3;
      if (this.y > H + 100) this.init();
    }
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y - this.len, this.x, this.y);
      grad.addColorStop(0, this.col[0] + '0)');
      grad.addColorStop(0.5, this.col[0] + this.col[1] + ')');
      grad.addColorStop(1, this.col[0] + '0)');
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.len);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = this.w;
      ctx.stroke();

      // Glowing head
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.w + 1, 0, Math.PI * 2);
      ctx.fillStyle = this.col[0] + (this.col[1] * 2) + ')';
      ctx.fill();
    }
  }

  resize();
  for (let i = 0; i < 28; i++) {
    const s = new Stream();
    s.y = Math.random() * H; // scatter initial positions
    streams.push(s);
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    streams.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
  }
  window.addEventListener('resize', resize, { passive: true });
  animate();
}

/* ── COUNTER ANIMATION ──────────────────────────────────────── */
function animateCounter(el, target, prefix = '', suffix = '', duration = 2000) {
  const start = performance.now();
  const isLarge = target > 10000;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(easeOut(progress) * target);

    if (isLarge) {
      el.textContent = prefix + '$' + current.toLocaleString();
    } else {
      el.textContent = prefix + current.toLocaleString() + suffix;
    }

    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = prefix + (isLarge ? '$' + target.toLocaleString() : target.toLocaleString() + suffix);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  // Hero counters
  const tvlEl = document.querySelector('#counter-tvl .counter-value');
  const streamsEl = document.querySelector('#counter-streams .counter-value');

  const heroObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounter(tvlEl, 4820391, '$', '', 2500);
      animateCounter(streamsEl, 1247, '', '', 2000);
      heroObs.disconnect();
    }
  }, { threshold: 0.5 });
  heroObs.observe(document.getElementById('stream-counter'));

  // Stats section counters
  const statNums = document.querySelectorAll('.stat-number[data-target]');
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = +el.dataset.target;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, prefix, suffix, 2200);
        statsObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNums.forEach(el => statsObs.observe(el));
}

/* ── LIVE FLOW RATE TICKER ──────────────────────────────────── */
function initFlowTicker() {
  const flowRateEl = document.getElementById('flow-rate');
  let base = 0.0482;

  function updateRate() {
    const jitter = (Math.random() - 0.5) * 0.003;
    base = Math.max(0.04, Math.min(0.06, base + jitter));
    flowRateEl.textContent = '$' + base.toFixed(4);
  }
  updateRate();
  setInterval(updateRate, 1200);
}

/* ── LIVE STREAM BALANCE DEMO ───────────────────────────────── */
function initStreamDemo() {
  const balanceEl  = document.getElementById('stream-balance');
  const progressEl = document.getElementById('stream-progress');
  const progressPct = document.querySelector('.progress-labels span:nth-child(2)');

  if (!balanceEl) return;

  let amount   = 5284.3847214;
  const total  = 10000;
  const perTick = 0.0000386; // VARA per ~100ms

  function tick() {
    amount += perTick;
    if (amount >= total) amount = total;

    const pct = (amount / total) * 100;
    balanceEl.textContent = amount.toFixed(7);
    progressEl.style.width = pct.toFixed(4) + '%';
    if (progressPct) progressPct.textContent = pct.toFixed(2) + '%';
  }

  setInterval(tick, 100);

  // Withdraw button sparkle
  const withdrawBtn = document.getElementById('withdraw-btn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      withdrawBtn.textContent = '✓ Tokens Withdrawn!';
      withdrawBtn.style.background = 'rgba(16,185,129,0.15)';
      withdrawBtn.style.borderColor = 'rgba(16,185,129,0.4)';
      withdrawBtn.style.color = '#10b981';
      setTimeout(() => {
        withdrawBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Withdraw Streamed Tokens`;
        withdrawBtn.style.background = '';
        withdrawBtn.style.borderColor = '';
        withdrawBtn.style.color = '';
      }, 2500);
    });
  }
}

/* ── SMOOTH SCROLL ──────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── CURSOR GLOW EFFECT ─────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    opacity: 0;
  `;
  document.body.appendChild(glow);

  let mx = 0, my = 0, gx = 0, gy = 0;
  let visible = false;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!visible) { glow.style.opacity = '1'; visible = true; }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    glow.style.opacity = '0'; visible = false;
  });

  function animGlow() {
    gx += (mx - gx) * 0.1;
    gy += (my - gy) * 0.1;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animGlow);
  }
  animGlow();
}

/* ── CARD MAGNETIC HOVER ────────────────────────────────────── */
function initMagneticCards() {
  document.querySelectorAll('.use-case-card, .feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'all 0.5s cubic-bezier(0.23,1,0.32,1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

/* ── BUTTON RIPPLE ──────────────────────────────────────────── */
function initButtonRipples() {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute; border-radius: 50%; pointer-events: none;
        width: 4px; height: 4px;
        left: ${x}px; top: ${y}px;
        background: rgba(255,255,255,0.4);
        transform: scale(0);
        animation: rippleAnim 0.6s ease-out forwards;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  // Inject ripple keyframe
  const style = document.createElement('style');
  style.textContent = `@keyframes rippleAnim { to { transform: scale(80); opacity: 0; } }`;
  document.head.appendChild(style);
}

/* ── NAVBAR ACTIVE LINK ─────────────────────────────────────── */
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.style.color = l.getAttribute('href') === '#' + id ? 'var(--text)' : '';
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => obs.observe(s));
}

/* ── TILT HERO TITLE ON MOUSE ───────────────────────────────── */
function initHeroParallax() {
  const hero  = document.querySelector('.hero-container');
  const visual = document.querySelector('.hero-visual');
  if (!hero || !visual) return;

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    hero.style.transform  = `translate(${x * 6}px, ${y * 4}px)`;
    visual.style.transform = `translate(${x * -12}px, ${y * -8}px)`;
  }, { passive: true });
}

/* ── SCROLL PROGRESS BAR ────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 2px; z-index: 9999;
    background: linear-gradient(90deg, #6366f1, #06b6d4, #a855f7);
    transition: width 0.1s;
    box-shadow: 0 0 10px rgba(99,102,241,0.6);
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    bar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });
}

/* ── SECTION GLOW ON ENTER ──────────────────────────────────── */
function initSectionGlow() {
  const sections = document.querySelectorAll('.section');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.style.opacity = entry.isIntersecting ? '1' : '';
    });
  }, { threshold: 0.05 });
  sections.forEach(s => obs.observe(s));
}

/* ── NUMBER TICKER (hero TVL live update) ───────────────────── */
function initLiveTVLTicker() {
  const tvlEl = document.querySelector('#counter-tvl .counter-value');
  if (!tvlEl) return;

  let base = 4820391;
  // Only start after counters have animated
  setTimeout(() => {
    setInterval(() => {
      base += Math.floor(Math.random() * 80 + 10);
      tvlEl.textContent = '$' + base.toLocaleString();
    }, 2000);
  }, 3000);
}

/* ── INIT ALL ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas();
  initStreamCanvas();
  initAOS();
  initCounters();
  initFlowTicker();
  initStreamDemo();
  initSmoothScroll();
  initCursorGlow();
  initMagneticCards();
  initButtonRipples();
  initActiveNavLink();
  initHeroParallax();
  initScrollProgress();
  initSectionGlow();
  initLiveTVLTicker();
});
