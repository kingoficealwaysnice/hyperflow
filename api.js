/* ============================================================
   HYPERFLOW — API.JS
   Client for GrowStreams backend API
   Base: https://growstreams-core-production.up.railway.app
============================================================ */
'use strict';

const API = (() => {
  const BASE = 'https://growstreams-core-production.up.railway.app';
  const GROW_TOKEN = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
  const STREAM_CORE = '0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56';
  const TOKEN_VAULT = '0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b';
  const DECIMALS = 1e12; // 12 decimals

  async function request(path, options = {}) {
    const url = BASE + path;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `API error ${res.status}`);
    return data;
  }

  const get  = (path) => request(path);
  const post = (path, body) => request(path, { method: 'POST', body });

  /* ── GROW TOKEN ─────────────────────────────────────────── */
  const token = {
    meta:        ()      => get('/api/grow-token/meta'),
    balance:     (addr)  => get(`/api/grow-token/balance/${addr}`),
    allowance:   (o, s)  => get(`/api/grow-token/allowance/${o}/${s}`),
    totalSupply: ()      => get('/api/grow-token/total-supply'),
    faucet:      (to)    => post('/api/grow-token/faucet', { to }),
    transfer:    (b)     => post('/api/grow-token/transfer', b),
    approve:     (b)     => post('/api/grow-token/approve', b),
    mint:        (b)     => post('/api/grow-token/mint', b),
    burn:        (b)     => post('/api/grow-token/burn', b),
  };

  /* ── STREAMS ─────────────────────────────────────────────── */
  const streams = {
    config:         ()    => get('/api/streams/config'),
    total:          ()    => get('/api/streams/total'),
    active:         ()    => get('/api/streams/active'),
    get:            (id)  => get(`/api/streams/${id}`),
    balance:        (id)  => get(`/api/streams/${id}/balance`),
    buffer:         (id)  => get(`/api/streams/${id}/buffer`),
    bySender:       (addr)=> get(`/api/streams/sender/${addr}`),
    byReceiver:     (addr)=> get(`/api/streams/receiver/${addr}`),
    create:         (b)   => post('/api/streams', b),
    pause:          (id)  => post(`/api/streams/${id}/pause`, {}),
    resume:         (id)  => post(`/api/streams/${id}/resume`, {}),
    deposit:        (id,a)=> post(`/api/streams/${id}/deposit`, { amount: a }),
    withdraw:       (id)  => post(`/api/streams/${id}/withdraw`, {}),
    stop:           (id)  => post(`/api/streams/${id}/stop`, {}),
    liquidate:      (id)  => post(`/api/streams/${id}/liquidate`, {}),
  };

  /* ── VAULT ───────────────────────────────────────────────── */
  const vault = {
    config:          ()           => get('/api/vault/config'),
    paused:          ()           => get('/api/vault/paused'),
    balance:         (owner, tok) => get(`/api/vault/balance/${owner}/${tok}`),
    allocation:      (streamId)   => get(`/api/vault/allocation/${streamId}`),
    deposit:         (b)          => post('/api/vault/deposit', b),
    withdraw:        (b)          => post('/api/vault/withdraw', b),
    depositNative:   (b)          => post('/api/vault/deposit-native', b),
    withdrawNative:  (b)          => post('/api/vault/withdraw-native', b),
  };

  /* ── CAMPAIGN ─────────────────────────────────────────────── */
  const campaign = {
    register:     (b)   => post('/api/campaign/register', b),
    participant:  (w)   => get(`/api/campaign/participant/${w}`),
    config:       ()    => get('/api/campaign/config'),
    leaderboard:  (q)   => get(`/api/leaderboard?${new URLSearchParams(q)}`),
    leaderboardStats: () => get('/api/leaderboard/stats'),
  };

  /* ── HELPERS ─────────────────────────────────────────────── */
  function formatGROW(raw) {
    if (raw === undefined || raw === null) return '0.00';
    const n = typeof raw === 'string' ? BigInt(raw) : BigInt(Math.floor(raw));
    const whole = n / BigInt(DECIMALS);
    const frac  = n % BigInt(DECIMALS);
    return `${whole.toLocaleString()}.${frac.toString().padStart(12,'0').slice(0,4)}`;
  }

  function toRaw(amount) {
    return Math.floor(parseFloat(amount) * DECIMALS).toString();
  }

  function formatFlowRate(ratePerSec) {
    const r = parseFloat(ratePerSec) / DECIMALS;
    return (r * 3600).toFixed(6) + ' GROW/hr';
  }

  function streamStatus(stream) {
    if (!stream) return 'unknown';
    const s = stream.status || stream.state || '';
    return s.toLowerCase();
  }

  return {
    BASE, GROW_TOKEN, STREAM_CORE, TOKEN_VAULT, DECIMALS,
    token, streams, vault, campaign,
    formatGROW, toRaw, formatFlowRate, streamStatus,
  };
})();

window.API = API;
