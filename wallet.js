/* ============================================================
   HYPERFLOW — WALLET.JS
   Polkadot.js / SubWallet connection (mirrors GrowStreams)
============================================================ */
'use strict';

const WalletManager = (() => {
  let selectedAccount = null;
  let allAccounts = [];
  let extensionName = null;

  const STORAGE_KEY = 'hyperflow_wallet';

  /* ── DETECT EXTENSIONS ─────────────────────────────────── */
  function getAvailableExtensions() {
    const injected = window.injectedWeb3 || {};
    const known = [
      { key: 'subwallet-js', name: 'SubWallet', icon: '🔵' },
      { key: 'polkadot-js', name: 'Polkadot.js', icon: '🟠' },
      { key: 'talisman',    name: 'Talisman',    icon: '🟣' },
      { key: 'nova',        name: 'Nova Wallet',  icon: '🔴' },
    ];
    return known.filter(e => injected[e.key]);
  }

  /* ── ENABLE EXTENSION ───────────────────────────────────── */
  async function enableExtension(key) {
    const ext = window.injectedWeb3[key];
    if (!ext) throw new Error(`Extension ${key} not found`);
    await ext.enable('HyperFlow');
    extensionName = key;
    const accounts = await ext.accounts.get();
    allAccounts = accounts.map(a => ({
      address: a.address,
      name: a.name || shortenAddr(a.address),
      source: key,
    }));
    return allAccounts;
  }

  /* ── SELECT ACCOUNT ─────────────────────────────────────── */
  function selectAccount(account) {
    selectedAccount = account;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: account.address, name: account.name, source: account.source })); } catch(e) {}
    dispatchWalletEvent('connected', account);
  }

  /* ── DISCONNECT ─────────────────────────────────────────── */
  function disconnect() {
    selectedAccount = null;
    allAccounts = [];
    extensionName = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    dispatchWalletEvent('disconnected', null);
  }

  /* ── RESTORE SESSION ────────────────────────────────────── */
  async function restoreSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) return false;
      const exts = getAvailableExtensions();
      const match = exts.find(e => e.key === saved.source);
      if (!match) return false;
      await enableExtension(saved.source);
      const account = allAccounts.find(a => a.address === saved.address);
      if (account) { selectAccount(account); return true; }
    } catch(e) {}
    return false;
  }

  /* ── SIGN MESSAGE ───────────────────────────────────────── */
  async function signMessage(message) {
    if (!selectedAccount) throw new Error('No account selected');
    const ext = window.injectedWeb3[extensionName];
    const signer = ext.signer;
    if (!signer || !signer.signRaw) throw new Error('Signer not available');
    const result = await signer.signRaw({
      address: selectedAccount.address,
      data: message,
      type: 'bytes',
    });
    return result.signature;
  }

  /* ── UTILS ─────────────────────────────────────────────── */
  function shortenAddr(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  function dispatchWalletEvent(type, data) {
    window.dispatchEvent(new CustomEvent('hyperflow:wallet', { detail: { type, data } }));
  }

  /* ── UI: SHOW CONNECT MODAL ─────────────────────────────── */
  function showConnectModal() {
    const exts = getAvailableExtensions();
    const modalEl = document.getElementById('wallet-modal');
    if (!modalEl) return;

    if (exts.length === 0) {
      document.getElementById('wallet-modal-body').innerHTML = `
        <div class="wallet-no-ext">
          <div class="no-ext-icon">🔌</div>
          <h3>No Wallet Found</h3>
          <p>Install a Polkadot-compatible wallet to use HyperFlow.</p>
          <div class="ext-install-links">
            <a href="https://www.subwallet.app/" target="_blank" class="btn-install">Install SubWallet</a>
            <a href="https://polkadot.js.org/extension/" target="_blank" class="btn-install btn-install-secondary">Install Polkadot.js</a>
          </div>
        </div>`;
      modalEl.classList.add('active');
      return;
    }

    document.getElementById('wallet-modal-body').innerHTML = `
      <div class="wallet-ext-list">
        <p class="wallet-hint">Select your wallet extension</p>
        ${exts.map(e => `
          <button class="ext-btn" data-ext="${e.key}" id="ext-btn-${e.key}">
            <span class="ext-icon">${e.icon}</span>
            <span class="ext-name">${e.name}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>`).join('')}
      </div>`;

    exts.forEach(e => {
      document.getElementById(`ext-btn-${e.key}`)?.addEventListener('click', async () => {
        try {
          showLoadingInModal('Connecting...');
          const accounts = await enableExtension(e.key);
          if (accounts.length === 0) {
            showLoadingInModal('No accounts found. Create an account in your wallet.');
            return;
          }
          showAccountPicker(accounts);
        } catch (err) {
          showLoadingInModal('Connection rejected. Please approve in your wallet.');
        }
      });
    });

    modalEl.classList.add('active');
  }

  function showLoadingInModal(msg) {
    document.getElementById('wallet-modal-body').innerHTML = `
      <div class="wallet-loading">
        <div class="wallet-spinner"></div>
        <p>${msg}</p>
      </div>`;
  }

  function showAccountPicker(accounts) {
    document.getElementById('wallet-modal-body').innerHTML = `
      <div class="account-list">
        <p class="wallet-hint">Select an account</p>
        ${accounts.map((a, i) => `
          <button class="account-btn" data-index="${i}" id="acc-btn-${i}">
            <div class="acc-avatar">${a.name.charAt(0).toUpperCase()}</div>
            <div class="acc-info">
              <span class="acc-name">${a.name}</span>
              <span class="acc-addr">${shortenAddr(a.address)}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>`).join('')}
      </div>`;

    accounts.forEach((acc, i) => {
      document.getElementById(`acc-btn-${i}`)?.addEventListener('click', () => {
        selectAccount(acc);
        hideConnectModal();
      });
    });
  }

  function hideConnectModal() {
    const modalEl = document.getElementById('wallet-modal');
    if (modalEl) modalEl.classList.remove('active');
  }

  /* Public API */
  return {
    getAvailableExtensions,
    enableExtension,
    selectAccount,
    disconnect,
    restoreSession,
    signMessage,
    showConnectModal,
    hideConnectModal,
    getAccount: () => selectedAccount,
    getAccounts: () => allAccounts,
    shortenAddr,
    isConnected: () => !!selectedAccount,
  };
})();

window.WalletManager = WalletManager;
