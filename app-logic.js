/* ============================================================
   HYPERFLOW — APP-LOGIC.JS
   Full dApp logic: wallet, API calls, stream management, UI
============================================================ */
'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
const State = {
  account: null,
  activeTab: 'overview',
  outgoingStreams: [],
  incomingStreams: [],
  tokenInfo: null,
  vaultBalance: null,
  leaderboard: [],
  lbTrack: 'ALL',
};

/* ── TOAST SYSTEM ───────────────────────────────────────────── */
function toast(msg, type = 'info', duration = 4000) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 350); }, duration);
}

/* ── CONFIRM MODAL ──────────────────────────────────────────── */
function confirm(title, message) {
  return new Promise(resolve => {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('active');
    document.getElementById('confirm-ok-btn').onclick = () => { modal.classList.remove('active'); resolve(true); };
    document.getElementById('confirm-cancel-btn').onclick = () => { modal.classList.remove('active'); resolve(false); };
    document.getElementById('confirm-modal-close').onclick = () => { modal.classList.remove('active'); resolve(false); };
  });
}

/* ── TAB NAVIGATION ─────────────────────────────────────────── */
function switchTab(tabId) {
  State.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('active', el.id === `tab-content-${tabId}`));
  const titles = {
    overview: 'Overview', outgoing: 'Outgoing Streams',
    incoming: 'Incoming Streams', create: 'Create Stream',
    vault: 'Vault', grow: 'GROW Token', leaderboard: 'Leaderboard',
  };
  document.getElementById('page-title').textContent = titles[tabId] || tabId;
  // Load data for the tab
  if (State.account) {
    if (tabId === 'outgoing')    loadOutgoing();
    if (tabId === 'incoming')    loadIncoming();
    if (tabId === 'vault')       loadVaultBalances();
    if (tabId === 'grow')        loadTokenInfo();
    if (tabId === 'leaderboard') loadLeaderboard();
  }
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ── SIDEBAR TOGGLE ─────────────────────────────────────────── */
const sidebar = document.getElementById('sidebar');
const mainWrap = document.querySelector('.main-wrap');
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainWrap.classList.toggle('sidebar-collapsed');
});

/* ── WALLET MODAL WIRING ─────────────────────────────────────── */
function openWalletModal() { WalletManager.showConnectModal(); }
document.getElementById('wallet-modal-close').addEventListener('click', () => WalletManager.hideConnectModal());
document.getElementById('wallet-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) WalletManager.hideConnectModal();
});
document.getElementById('topbar-connect-btn').addEventListener('click', openWalletModal);
document.getElementById('ncb-connect-btn').addEventListener('click', openWalletModal);

/* ── WALLET EVENTS ───────────────────────────────────────────── */
window.addEventListener('hyperflow:wallet', async e => {
  const { type, data } = e.detail;
  if (type === 'connected') {
    State.account = data;
    onWalletConnected(data);
  } else if (type === 'disconnected') {
    State.account = null;
    onWalletDisconnected();
  }
});

function onWalletConnected(account) {
  // Update topbar
  const topbar = document.getElementById('topbar-wallet');
  topbar.innerHTML = `
    <div class="wallet-chip" id="wallet-chip">
      <div class="wallet-avatar">${account.name.charAt(0).toUpperCase()}</div>
      <div>
        <div class="wallet-name">${account.name}</div>
        <div class="wallet-addr">${WalletManager.shortenAddr(account.address)}</div>
      </div>
      <div class="wallet-dropdown">
        <div class="wallet-dd-addr">${account.address}</div>
        <button class="wallet-dd-btn" id="copy-addr-btn">
          📋 Copy Address
        </button>
        <button class="wallet-dd-btn" id="disconnect-btn">
          🔌 Disconnect
        </button>
      </div>
    </div>`;
  document.getElementById('disconnect-btn').addEventListener('click', () => WalletManager.disconnect());
  document.getElementById('copy-addr-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(account.address).then(() => toast('Address copied!', 'success'));
  });

  // Show/hide banners
  document.getElementById('not-connected-banner').classList.add('hidden');
  document.getElementById('overview-streams-section').classList.remove('hidden');
  document.getElementById('faucet-addr-display').textContent = account.address;

  toast(`Connected: ${WalletManager.shortenAddr(account.address)}`, 'success');
  loadOverview();
}

function onWalletDisconnected() {
  document.getElementById('topbar-wallet').innerHTML = `
    <button class="btn-connect-top" id="topbar-connect-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      Connect Wallet
    </button>`;
  document.getElementById('topbar-connect-btn').addEventListener('click', openWalletModal);
  document.getElementById('not-connected-banner').classList.remove('hidden');
  document.getElementById('overview-streams-section').classList.add('hidden');
  document.getElementById('faucet-addr-display').textContent = 'Connect wallet first';
  toast('Wallet disconnected', 'info');
  resetStats();
}

function resetStats() {
  ['stat-active-streams','stat-grow-balance','stat-vault-balance','stat-total-streams'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
}

/* ── REFRESH BUTTON ──────────────────────────────────────────── */
document.getElementById('refresh-btn').addEventListener('click', async () => {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  await loadCurrentTab();
  setTimeout(() => btn.classList.remove('spinning'), 800);
});

async function loadCurrentTab() {
  if (!State.account) return;
  const tab = State.activeTab;
  if (tab === 'overview')     return loadOverview();
  if (tab === 'outgoing')     return loadOutgoing();
  if (tab === 'incoming')     return loadIncoming();
  if (tab === 'vault')        return loadVaultBalances();
  if (tab === 'grow')         return loadTokenInfo();
  if (tab === 'leaderboard')  return loadLeaderboard();
}

/* ── OVERVIEW ────────────────────────────────────────────────── */
async function loadOverview() {
  if (!State.account) return;
  // Load global stats
  try {
    const [activeRes, totalRes] = await Promise.allSettled([
      API.streams.active(),
      API.streams.total(),
    ]);
    if (activeRes.status === 'fulfilled') {
      const val = activeRes.value?.count ?? activeRes.value?.active ?? activeRes.value;
      document.getElementById('stat-active-streams').textContent = typeof val === 'number' ? val.toLocaleString() : (val ?? '—');
    }
    if (totalRes.status === 'fulfilled') {
      const val = totalRes.value?.count ?? totalRes.value?.total ?? totalRes.value;
      document.getElementById('stat-total-streams').textContent = typeof val === 'number' ? val.toLocaleString() : (val ?? '—');
    }
  } catch(e) {}

  // Load GROW balance
  try {
    const balRes = await API.token.balance(State.account.address);
    const raw = balRes?.balance ?? balRes?.result ?? balRes;
    const formatted = API.formatGROW(raw);
    document.getElementById('stat-grow-balance').textContent = formatted + ' GROW';
    document.getElementById('wallet-grow-balance').textContent = formatted;
  } catch(e) {
    document.getElementById('stat-grow-balance').textContent = '—';
  }

  // Load vault balance
  try {
    const vaultRes = await API.vault.balance(State.account.address, API.GROW_TOKEN);
    const deposited = vaultRes?.deposited ?? vaultRes?.balance ?? 0;
    const available = vaultRes?.available ?? 0;
    const allocated = vaultRes?.allocated ?? 0;
    document.getElementById('stat-vault-balance').textContent = API.formatGROW(deposited) + ' GROW';
    document.getElementById('vault-deposited').textContent = API.formatGROW(deposited) + ' GROW';
    document.getElementById('vault-available').textContent = API.formatGROW(available) + ' GROW';
    document.getElementById('vault-allocated').textContent = API.formatGROW(allocated) + ' GROW';
  } catch(e) {
    document.getElementById('stat-vault-balance').textContent = '—';
  }

  // Load recent streams
  loadStreamsList('overview-streams-list', 'both');
}

/* ── STREAMS ─────────────────────────────────────────────────── */
async function loadOutgoing() {
  loadStreamsList('outgoing-streams-list', 'outgoing');
}
async function loadIncoming() {
  loadStreamsList('incoming-streams-list', 'incoming');
}

async function loadStreamsList(containerId, direction) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '<div class="list-loading"><div class="spinner"></div> Loading streams...</div>';

  try {
    const addr = State.account.address;
    let streams = [];

    if (direction === 'outgoing' || direction === 'both') {
      const res = await API.streams.bySender(addr);
      const list = Array.isArray(res) ? res : (res?.streams ?? res?.data ?? []);
      streams.push(...list.map(s => ({ ...s, _dir: 'out' })));
    }
    if (direction === 'incoming' || direction === 'both') {
      const res = await API.streams.byReceiver(addr);
      const list = Array.isArray(res) ? res : (res?.streams ?? res?.data ?? []);
      streams.push(...list.map(s => ({ ...s, _dir: 'in' })));
    }

    if (streams.length === 0) {
      el.innerHTML = `<div class="list-empty">
        No streams found. <button class="btn-sm-primary" style="margin-left:12px" onclick="switchTab('create')">Create one →</button>
      </div>`;
      return;
    }

    el.innerHTML = streams.map(s => renderStreamItem(s)).join('');
    // Attach action listeners
    el.querySelectorAll('[data-stream-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        const action = e.currentTarget.dataset.streamAction;
        const id     = e.currentTarget.dataset.streamId;
        const stream = streams.find(s => String(s.id ?? s.stream_id) === String(id));
        handleStreamAction(action, id, stream);
      });
    });
    el.querySelectorAll('[data-stream-detail]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.streamDetail;
        const stream = streams.find(s => String(s.id ?? s.stream_id) === String(id));
        showStreamDetail(id, stream);
      });
    });
  } catch(err) {
    el.innerHTML = `<div class="list-error">Error loading streams: ${err.message}</div>`;
  }
}

function renderStreamItem(s) {
  const id       = s.id ?? s.stream_id ?? '?';
  const status   = API.streamStatus(s);
  const flowRate = s.flow_rate ?? s.flowRate ?? s.rate ?? 0;
  const isOut    = s._dir === 'out';
  const addr     = isOut ? (s.receiver ?? s.to ?? '—') : (s.sender ?? s.from ?? '—');
  const label    = isOut ? 'To' : 'From';

  const statusClass = status === 'active' ? 'active' : (status === 'paused' ? 'paused' : 'stopped');

  const actions = isOut
    ? `${status === 'active'
        ? `<button class="si-action-btn" data-stream-action="pause" data-stream-id="${id}">Pause</button>`
        : `<button class="si-action-btn" data-stream-action="resume" data-stream-id="${id}">Resume</button>`}
       <button class="si-action-btn" data-stream-action="deposit" data-stream-id="${id}">+ Deposit</button>
       <button class="si-action-btn danger" data-stream-action="stop" data-stream-id="${id}">Stop</button>`
    : `<button class="si-action-btn success" data-stream-action="withdraw" data-stream-id="${id}">Withdraw</button>`;

  return `
    <div class="stream-item">
      <div class="si-status ${statusClass}" title="${status}"></div>
      <div class="si-info">
        <div class="si-id">Stream #${id} · ${label}: ${WalletManager.shortenAddr(addr)}</div>
        <div class="si-addr">${addr}</div>
        <div class="si-rate">${API.formatFlowRate(flowRate)}</div>
      </div>
      <div class="si-balance">
        <span class="si-balance-val">${API.formatGROW(s.balance ?? s.deposited ?? 0)}</span>
        <span class="si-balance-lbl">GROW</span>
      </div>
      <div class="si-actions">
        <button class="si-action-btn" data-stream-detail="${id}">Details</button>
        ${actions}
      </div>
    </div>`;
}

/* ── STREAM ACTIONS ──────────────────────────────────────────── */
async function handleStreamAction(action, id, stream) {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }

  try {
    if (action === 'pause') {
      const ok = await confirm('Pause Stream', `Pause stream #${id}? Tokens will stop flowing until you resume.`);
      if (!ok) return;
      setLoading(true);
      await API.streams.pause(id);
      toast('Stream paused ✓', 'success');
    }
    else if (action === 'resume') {
      setLoading(true);
      await API.streams.resume(id);
      toast('Stream resumed ✓', 'success');
    }
    else if (action === 'stop') {
      const ok = await confirm('Stop Stream', `Permanently stop stream #${id}? This cannot be undone.`);
      if (!ok) return;
      setLoading(true);
      await API.streams.stop(id);
      toast('Stream stopped', 'success');
    }
    else if (action === 'withdraw') {
      setLoading(true);
      await API.streams.withdraw(id);
      toast('Tokens withdrawn ✓', 'success');
    }
    else if (action === 'deposit') {
      const amount = window.prompt('Enter amount to deposit (GROW):');
      if (!amount || isNaN(parseFloat(amount))) return;
      setLoading(true);
      await API.streams.deposit(id, API.toRaw(amount));
      toast(`Deposited ${amount} GROW ✓`, 'success');
    }
  } catch(err) {
    toast(`Error: ${err.message}`, 'error');
  } finally {
    setLoading(false);
    await loadCurrentTab();
  }
}

/* ── STREAM DETAIL MODAL ─────────────────────────────────────── */
async function showStreamDetail(id, stream) {
  const modal = document.getElementById('stream-action-modal');
  const body  = document.getElementById('sam-body');
  document.getElementById('sam-title').textContent = `Stream #${id}`;
  modal.classList.add('active');
  body.innerHTML = '<div class="list-loading"><div class="spinner"></div> Loading...</div>';

  try {
    const [detail, bal, buf] = await Promise.allSettled([
      API.streams.get(id),
      API.streams.balance(id),
      API.streams.buffer(id),
    ]);
    const s = detail.status === 'fulfilled' ? detail.value : (stream || {});
    const b = bal.status === 'fulfilled' ? bal.value : {};
    const bf = buf.status === 'fulfilled' ? buf.value : {};

    const status   = API.streamStatus(s);
    const flowRate = s.flow_rate ?? s.flowRate ?? s.rate ?? 0;
    const balance  = b.balance ?? b.withdrawable ?? b.amount ?? s.balance ?? 0;
    const buffer   = bf.buffer ?? bf.remaining ?? 0;

    body.innerHTML = `
      <div class="sam-balance-big">
        <span class="big-val">${API.formatGROW(balance)}</span>
        <span class="big-lbl">Withdrawable Balance (GROW)</span>
      </div>
      <div class="sam-detail-rows">
        <div class="sam-row"><span>Status</span><span class="sam-val ${status === 'active' ? 'green' : 'gold'}">${status.toUpperCase()}</span></div>
        <div class="sam-row"><span>Flow Rate</span><span class="sam-val cyan">${API.formatFlowRate(flowRate)}</span></div>
        <div class="sam-row"><span>Token</span><span class="sam-val">GROW</span></div>
        <div class="sam-row"><span>Sender</span><span class="sam-val">${WalletManager.shortenAddr(s.sender ?? s.from ?? '—')}</span></div>
        <div class="sam-row"><span>Receiver</span><span class="sam-val">${WalletManager.shortenAddr(s.receiver ?? s.to ?? '—')}</span></div>
        <div class="sam-row"><span>Buffer Remaining</span><span class="sam-val">${API.formatGROW(buffer)} GROW</span></div>
        <div class="sam-row"><span>Created</span><span class="sam-val">${s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</span></div>
      </div>
      <div class="sam-actions">
        <button class="sa-cyan"   onclick="handleStreamAction('withdraw','${id}',null);document.getElementById('stream-action-modal').classList.remove('active')">Withdraw</button>
        <button class="sa-indigo" onclick="handleStreamAction('pause','${id}',null);document.getElementById('stream-action-modal').classList.remove('active')">Pause</button>
        <button class="sa-gold"   onclick="handleStreamAction('resume','${id}',null);document.getElementById('stream-action-modal').classList.remove('active')">Resume</button>
        <button class="sa-red"    onclick="handleStreamAction('stop','${id}',null);document.getElementById('stream-action-modal').classList.remove('active')">Stop</button>
      </div>`;
  } catch(err) {
    body.innerHTML = `<div class="list-error">Failed to load: ${err.message}</div>`;
  }
}

document.getElementById('sam-close').addEventListener('click', () => {
  document.getElementById('stream-action-modal').classList.remove('active');
});

/* ── CREATE STREAM FORM ──────────────────────────────────────── */
const flowRateInput   = document.getElementById('cs-flow-rate');
const depositInput    = document.getElementById('cs-deposit');

flowRateInput.addEventListener('input', updateStreamPreview);
depositInput.addEventListener('input', updateStreamPreview);

function updateStreamPreview() {
  const flowPerHr = parseFloat(flowRateInput.value) || 0;
  const deposit   = parseFloat(depositInput.value) || 0;
  const flowPerSec = flowPerHr / 3600;

  document.getElementById('cs-flow-hint').textContent = `≈ ${flowPerSec.toFixed(8)} GROW/sec`;
  document.getElementById('preview-rate').textContent  = `${flowPerHr.toFixed(6)} GROW/hr`;

  const minBuf = flowPerHr; // 1 hr minimum
  document.getElementById('preview-buffer').textContent = `${minBuf.toFixed(4)} GROW`;

  if (deposit > 0 && flowPerHr > 0) {
    const hrs = deposit / flowPerHr;
    const days = Math.floor(hrs / 24);
    const remHrs = Math.floor(hrs % 24);
    document.getElementById('preview-duration').textContent = `~${days}d ${remHrs}h at this rate`;
  } else {
    document.getElementById('preview-duration').textContent = '—';
  }

  document.getElementById('cs-deposit-hint').textContent = `Min buffer: ${minBuf.toFixed(4)} GROW (1 hr of flow)`;
}

document.getElementById('create-stream-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  const receiver    = document.getElementById('cs-receiver').value.trim();
  const flowPerHr   = parseFloat(flowRateInput.value);
  const deposit     = parseFloat(depositInput.value);
  const token       = document.getElementById('cs-token').value;

  if (!receiver) { toast('Enter a receiver address', 'error'); return; }
  if (!flowPerHr || flowPerHr <= 0) { toast('Enter a valid flow rate', 'error'); return; }
  if (!deposit || deposit <= 0) { toast('Enter an initial deposit', 'error'); return; }

  const flowPerSec = flowPerHr / 3600;
  const minBuffer  = flowPerSec * 3600; // 1 hr
  if (deposit < minBuffer) { toast(`Deposit must be at least ${minBuffer.toFixed(4)} GROW (1 hr buffer)`, 'error'); return; }

  const ok = await confirm('Create Stream', `Stream ${flowPerHr.toFixed(4)} GROW/hr to ${WalletManager.shortenAddr(receiver)}?`);
  if (!ok) return;

  try {
    setLoading(true);
    const btn = document.getElementById('create-stream-btn');
    btn.disabled = true; btn.textContent = 'Creating...';

    const payload = {
      receiver,
      token,
      flowRate: API.toRaw(flowPerSec),
      initialDeposit: API.toRaw(deposit),
      sender: State.account.address,
    };
    const res = await API.streams.create(payload);
    const newId = res?.id ?? res?.stream_id ?? res?.streamId ?? '?';
    toast(`Stream #${newId} created! ✓`, 'success');
    document.getElementById('cs-receiver').value = '';
    flowRateInput.value = '';
    depositInput.value = '';
    updateStreamPreview();
    switchTab('outgoing');
  } catch(err) {
    toast(`Failed: ${err.message}`, 'error');
  } finally {
    setLoading(false);
    const btn = document.getElementById('create-stream-btn');
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Create Stream`;
  }
});

document.getElementById('overview-create-btn')?.addEventListener('click', () => switchTab('create'));
document.getElementById('outgoing-create-btn')?.addEventListener('click', () => switchTab('create'));

/* ── VAULT ───────────────────────────────────────────────────── */
async function loadVaultBalances() {
  if (!State.account) return;
  try {
    const vaultRes = await API.vault.balance(State.account.address, API.GROW_TOKEN);
    const deposited = vaultRes?.deposited ?? vaultRes?.balance ?? 0;
    const available = vaultRes?.available ?? 0;
    const allocated = vaultRes?.allocated ?? 0;
    document.getElementById('vault-deposited').textContent = API.formatGROW(deposited) + ' GROW';
    document.getElementById('vault-available').textContent = API.formatGROW(available) + ' GROW';
    document.getElementById('vault-allocated').textContent = API.formatGROW(allocated) + ' GROW';
    document.getElementById('stat-vault-balance').textContent = API.formatGROW(deposited) + ' GROW';
  } catch(err) {
    toast(`Vault error: ${err.message}`, 'error');
  }
  // Also load wallet GROW balance for hint
  try {
    const bal = await API.token.balance(State.account.address);
    const raw = bal?.balance ?? bal?.result ?? bal;
    document.getElementById('wallet-grow-balance').textContent = API.formatGROW(raw);
  } catch(e) {}
}

document.getElementById('vault-refresh-btn').addEventListener('click', loadVaultBalances);

document.getElementById('vault-deposit-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  const amount = parseFloat(document.getElementById('vault-deposit-amount').value);
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  try {
    setLoading(true);
    await API.vault.deposit({ token: API.GROW_TOKEN, amount: API.toRaw(amount), account: State.account.address });
    toast(`Deposited ${amount} GROW to vault ✓`, 'success');
    document.getElementById('vault-deposit-amount').value = '';
    await loadVaultBalances();
  } catch(err) {
    toast(`Deposit failed: ${err.message}`, 'error');
  } finally { setLoading(false); }
});

document.getElementById('vault-withdraw-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  const amount = parseFloat(document.getElementById('vault-withdraw-amount').value);
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

  const ok = await confirm('Withdraw from Vault', `Withdraw ${amount} GROW from vault to your wallet?`);
  if (!ok) return;

  try {
    setLoading(true);
    await API.vault.withdraw({ token: API.GROW_TOKEN, amount: API.toRaw(amount), account: State.account.address });
    toast(`Withdrew ${amount} GROW ✓`, 'success');
    document.getElementById('vault-withdraw-amount').value = '';
    await loadVaultBalances();
  } catch(err) {
    toast(`Withdraw failed: ${err.message}`, 'error');
  } finally { setLoading(false); }
});

/* ── GROW TOKEN ──────────────────────────────────────────────── */
async function loadTokenInfo() {
  try {
    const meta = await API.token.meta();
    const supply = await API.token.totalSupply();
    const supplyRaw = supply?.total_supply ?? supply?.totalSupply ?? supply ?? 0;
    document.getElementById('token-info-rows').innerHTML = `
      <div class="ti-item"><div class="ti-lbl">Name</div><div class="ti-val">${meta?.name ?? 'GROW'}</div></div>
      <div class="ti-item"><div class="ti-lbl">Symbol</div><div class="ti-val indigo">${meta?.symbol ?? 'GROW'}</div></div>
      <div class="ti-item"><div class="ti-lbl">Decimals</div><div class="ti-val">${meta?.decimals ?? 12}</div></div>
      <div class="ti-item"><div class="ti-lbl">Total Supply</div><div class="ti-val cyan">${API.formatGROW(supplyRaw)}</div></div>`;
  } catch(err) {
    document.getElementById('token-info-rows').innerHTML = `<div class="list-error">Error: ${err.message}</div>`;
  }
  // Load allowance
  if (State.account) {
    try {
      const al = await API.token.allowance(State.account.address, API.TOKEN_VAULT);
      const raw = al?.allowance ?? al?.result ?? al ?? 0;
      document.getElementById('allowance-display').textContent = API.formatGROW(raw) + ' GROW';
    } catch(e) {
      document.getElementById('allowance-display').textContent = '—';
    }
    // Load wallet balance
    try {
      const bal = await API.token.balance(State.account.address);
      const raw = bal?.balance ?? bal?.result ?? bal;
      document.getElementById('wallet-grow-balance').textContent = API.formatGROW(raw);
      document.getElementById('stat-grow-balance').textContent = API.formatGROW(raw) + ' GROW';
    } catch(e) {}
  }
}

document.getElementById('faucet-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  try {
    const btn = document.getElementById('faucet-btn');
    btn.disabled = true; btn.textContent = 'Minting...';
    await API.token.faucet(State.account.address);
    toast('1,000 GROW minted from faucet! ✓', 'success');
    await loadTokenInfo();
  } catch(err) {
    toast(`Faucet error: ${err.message}`, 'error');
  } finally {
    const btn = document.getElementById('faucet-btn');
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg> Mint 1,000 GROW`;
  }
});

document.getElementById('approve-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  const amount = parseFloat(document.getElementById('approve-amount').value);
  if (!amount || amount <= 0) { toast('Enter amount to approve', 'error'); return; }
  try {
    setLoading(true);
    await API.token.approve({ spender: API.TOKEN_VAULT, amount: API.toRaw(amount), account: State.account.address });
    toast(`Approved ${amount} GROW for vault ✓`, 'success');
    document.getElementById('approve-amount').value = '';
    await loadTokenInfo();
  } catch(err) {
    toast(`Approve failed: ${err.message}`, 'error');
  } finally { setLoading(false); }
});

document.getElementById('transfer-btn').addEventListener('click', async () => {
  if (!State.account) { toast('Connect wallet first', 'error'); return; }
  const to     = document.getElementById('transfer-to').value.trim();
  const amount = parseFloat(document.getElementById('transfer-amount').value);
  if (!to)     { toast('Enter recipient address', 'error'); return; }
  if (!amount) { toast('Enter amount', 'error'); return; }

  const ok = await confirm('Transfer GROW', `Send ${amount} GROW to ${WalletManager.shortenAddr(to)}?`);
  if (!ok) return;

  try {
    setLoading(true);
    await API.token.transfer({ to, amount: API.toRaw(amount), from: State.account.address });
    toast(`Transferred ${amount} GROW ✓`, 'success');
    document.getElementById('transfer-to').value = '';
    document.getElementById('transfer-amount').value = '';
  } catch(err) {
    toast(`Transfer failed: ${err.message}`, 'error');
  } finally { setLoading(false); }
});

/* ── LEADERBOARD ─────────────────────────────────────────────── */
async function loadLeaderboard() {
  // Load stats
  try {
    const stats = await API.campaign.leaderboardStats();
    document.getElementById('lb-total-participants').textContent = (stats?.total_participants ?? stats?.participants ?? '—').toLocaleString();
    document.getElementById('lb-total-xp').textContent = (stats?.total_xp ?? '—').toLocaleString();
    document.getElementById('lb-prize-pool').textContent = '$' + (stats?.prize_pool ?? stats?.usdc_pool ?? '—');
  } catch(e) {
    document.getElementById('lb-total-participants').textContent = '—';
  }

  // Load entries
  const tbody = document.getElementById('lb-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="lb-loading"><div class="spinner"></div></td></tr>';
  try {
    const query = State.lbTrack !== 'ALL' ? { track: State.lbTrack, limit: 50 } : { limit: 50 };
    const res = await API.campaign.leaderboard(query);
    const entries = Array.isArray(res) ? res : (res?.data ?? res?.leaderboard ?? res?.entries ?? []);

    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="lb-loading">No entries yet. Be the first!</td></tr>';
      return;
    }

    tbody.innerHTML = entries.map((e, i) => {
      const rank = i + 1;
      const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
      const track = (e.track || 'OSS').toLowerCase();
      const payout = e.estimated_payout ? '$' + parseFloat(e.estimated_payout).toFixed(2) : '—';
      return `<tr>
        <td class="lb-rank ${rankClass}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}</td>
        <td class="lb-addr">${WalletManager.shortenAddr(e.wallet ?? e.address)}</td>
        <td>${e.github_handle ? `<a href="https://github.com/${e.github_handle}" target="_blank" style="color:var(--cyan)">@${e.github_handle}</a>` : '—'}</td>
        <td class="lb-xp">${(e.xp ?? e.total_xp ?? 0).toLocaleString()}</td>
        <td><span class="lb-track ${track}">${(e.track ?? 'OSS').toUpperCase()}</span></td>
        <td class="lb-payout">${payout}</td>
      </tr>`;
    }).join('');
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="6" class="lb-loading" style="color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

document.querySelectorAll('.lb-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lb-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    State.lbTrack = btn.dataset.track;
    loadLeaderboard();
  });
});
document.getElementById('lb-refresh-btn').addEventListener('click', loadLeaderboard);
document.getElementById('lb-register-btn').addEventListener('click', async () => {
  if (!State.account) { openWalletModal(); return; }
  const github = window.prompt('Your GitHub handle (optional, for OSS track):');
  const twitter = window.prompt('Your Twitter/X handle (optional, for Content track):');
  const track = github && twitter ? 'BOTH' : github ? 'OSS' : twitter ? 'CONTENT' : 'OSS';
  try {
    await API.campaign.register({
      wallet: State.account.address,
      github_handle: github || undefined,
      x_handle: twitter || undefined,
      track,
    });
    toast(`Registered for ${track} track! ✓`, 'success');
    await loadLeaderboard();
  } catch(err) {
    toast(`Registration failed: ${err.message}`, 'error');
  }
});

/* ── GLOBAL LOADING ──────────────────────────────────────────── */
let loadingEl = null;
function setLoading(on) {
  if (on && !loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.style.cssText = `
      position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);`;
    loadingEl.innerHTML = '<div class="spinner" style="width:40px;height:40px;border-width:3px"></div>';
    document.body.appendChild(loadingEl);
  } else if (!on && loadingEl) {
    loadingEl.remove(); loadingEl = null;
  }
}

/* ── GLOBAL STATS POLL ───────────────────────────────────────── */
async function pollGlobalStats() {
  try {
    const [active, total] = await Promise.allSettled([ API.streams.active(), API.streams.total() ]);
    if (active.status === 'fulfilled') {
      const v = active.value?.count ?? active.value?.active ?? active.value;
      document.getElementById('stat-active-streams').textContent = typeof v === 'number' ? v.toLocaleString() : (v ?? '—');
    }
    if (total.status === 'fulfilled') {
      const v = total.value?.count ?? total.value?.total ?? total.value;
      document.getElementById('stat-total-streams').textContent = typeof v === 'number' ? v.toLocaleString() : (v ?? '—');
    }
  } catch(e) {}
}
setInterval(pollGlobalStats, 30000);
pollGlobalStats();

/* ── INIT ────────────────────────────────────────────────────── */
async function init() {
  // Try to restore wallet session
  const restored = await WalletManager.restoreSession();
  if (!restored) {
    // Show not connected state
    document.getElementById('not-connected-banner').classList.remove('hidden');
    document.getElementById('overview-streams-section').classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
