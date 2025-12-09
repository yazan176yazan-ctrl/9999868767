
(function() {
  var WALLET_KEY = 'demoWallet_v1';

  function createDefaultWallet() {
    return {
      usdt: 3,
      btc: 0,
      eth: 0,
      usdc: 0,
      trx: 0,
      totalPersonalIncome: 0,
      todayPersonalIncome: 0,
      totalTeamIncome: 0,
      todayTeamIncome: 0,
      transactions: []
    };
  }

  function normalizeWallet(raw) {
    var base = createDefaultWallet();
    if (!raw || typeof raw !== 'object') return base;

    // numeric fields
    ['usdt','btc','eth','usdc','trx',
     'totalPersonalIncome','todayPersonalIncome',
     'totalTeamIncome','todayTeamIncome'].forEach(function(key) {
      var v = Number(raw[key]);
      if (!isNaN(v)) base[key] = v;
    });

    if (Array.isArray(raw.transactions)) {
      base.transactions = raw.transactions.slice();
    }
    return base;
  }

  function loadWallet() {
    try {
      var raw = localStorage.getItem(WALLET_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return normalizeWallet(parsed);
      }
    } catch (e) {}
    var w = createDefaultWallet();
    saveWallet(w);
    return w;
  }

  function saveWallet(wallet) {
    try {
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    } catch (e) {}
  }

  function addTransaction(tx) {
    var w = loadWallet();
    if (!Array.isArray(w.transactions)) w.transactions = [];
    w.transactions.push(tx);
    saveWallet(w);
  }

  function getTransactions() {
    var w = loadWallet();
    return Array.isArray(w.transactions) ? w.transactions.slice() : [];
  }

  // Expose minimal API for pages that want direct access
  window.demoWallet = {
    getWallet: loadWallet,
    saveWallet: saveWallet,
    addTransaction: addTransaction,
    getTransactions: getTransactions
  };

  // ---------- My Assets page ----------
  function updateAssetsView() {
    var hasAssetsEl =
      document.querySelector('.assets-usdt-balance') ||
      document.querySelector('.donut-inner') ||
      document.querySelector('.currency-row');
    if (!hasAssetsEl) return;

    var wallet = loadWallet();
    var total =
      (wallet.usdt || 0) +
      (wallet.btc || 0) +
      (wallet.eth || 0) +
      (wallet.usdc || 0) +
      (wallet.trx || 0);

    var usdtBalanceEl = document.querySelector('.assets-usdt-balance');
    if (usdtBalanceEl) {
      usdtBalanceEl.textContent = (wallet.usdt || 0).toFixed(2) + ' USDT';
    }

    var donutInner = document.querySelector('.donut-inner');
    if (donutInner) {
      donutInner.innerHTML =
        '<strong>Total Assets</strong>' + '≈$' + total.toFixed(2);
    }

    var tokenRows = document.querySelectorAll('.token-row');
    tokenRows.forEach(function(row) {
      var nameEl = row.querySelector('.token-name');
      var percentEl = row.querySelector('.token-percent');
      if (!nameEl || !percentEl) return;
      var name = nameEl.textContent.trim();
      var val = 0;
      if (name === 'USDT') val = wallet.usdt || 0;
      else if (name === 'BTC') val = wallet.btc || 0;
      else if (name === 'ETH') val = wallet.eth || 0;
      else if (name === 'USDC') val = wallet.usdc || 0;
      else if (name === 'TRX') val = wallet.trx || 0;

      if (total > 0) {
        percentEl.textContent = (val * 100 / total).toFixed(2) + '%';
      } else {
        percentEl.textContent = '0.00%';
      }
    });

    var currencyRows = document.querySelectorAll('.currency-row');
    currencyRows.forEach(function(row) {
      var nameEl = row.querySelector('.currency-name');
      var amountEl = row.querySelector('.currency-amount');
      if (!nameEl || !amountEl) return;

      var name = nameEl.textContent.trim();
      var val = 0;
      if (name === 'USDT') val = wallet.usdt || 0;
      else if (name === 'BTC') val = wallet.btc || 0;
      else if (name === 'ETH') val = wallet.eth || 0;
      else if (name === 'USDC') val = wallet.usdc || 0;
      else if (name === 'TRX') val = wallet.trx || 0;

      amountEl.textContent = val.toFixed(2);

      var withdrawBtn = row.querySelector('.currency-btn[data-action="Withdraw"]');
      if (withdrawBtn) {
        if (val <= 0) {
          withdrawBtn.style.display = 'none';
        } else {
          withdrawBtn.style.display = '';
        }
      }
    });

    var totalPersonal = document.querySelector('.assets-total-personal');
    if (totalPersonal) {
      totalPersonal.textContent =
        (wallet.totalPersonalIncome || 0).toFixed(2) + ' USDT';
    }
    var totalTeam = document.querySelector('.assets-total-team');
    if (totalTeam) {
      totalTeam.textContent =
        (wallet.totalTeamIncome || 0).toFixed(2) + ' USDT';
    }
    var todayPersonal = document.querySelector('.assets-today-personal');
    if (todayPersonal) {
      todayPersonal.textContent =
        (wallet.todayPersonalIncome || 0).toFixed(2) + ' USDT';
    }
    var todayTeam = document.querySelector('.assets-today-team');
    if (todayTeam) {
      todayTeam.textContent =
        (wallet.todayTeamIncome || 0).toFixed(2) + ' USDT';
    }

    // actions (Deposit / Withdraw / Bills) navigation
    var rowsWithActions = document.querySelectorAll('.currency-row');
    rowsWithActions.forEach(function(row) {
      var arrowBtn = row.querySelector('.currency-arrow-btn');
      var actions = row.querySelector('.currency-actions');
      if (arrowBtn && actions) {
        arrowBtn.addEventListener('click', function() {
          row.classList.toggle('open');
        });
      }
      var buttons = row.querySelectorAll('.currency-btn');
      buttons.forEach(function(btn) {
        var action = btn.getAttribute('data-action');
        btn.addEventListener('click', function() {
          if (action === 'Deposit') {
            window.location.href = 'deposit.html';
          } else if (action === 'Withdraw') {
            window.location.href = 'withdraw.html';
          } else if (action === 'Bills') {
            window.location.href = 'bills.html';
          }
        });
      });
    });
  }

  function setupMyAssetsIfPresent() {
    var hasAssetsEl =
      document.querySelector('.assets-usdt-balance') ||
      document.querySelector('.donut-inner') ||
      document.querySelector('.currency-row');
    if (!hasAssetsEl) return;
    updateAssetsView();
    // ensure wallet is saved/normalized
    saveWallet(loadWallet());
  }

  // ---------- AI Power page ----------
  function setupAiPowerIfPresent() {
    var runButtons = document.querySelectorAll('.gpu-card .btn-gradient');
    if (!runButtons.length) return;

    var nativeAlert = window.alert;

    runButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var label = (btn.textContent || '').trim();
        // only block when in "Run" state
        if (label !== 'Run') return;

        var wallet = loadWallet();
        if ((wallet.usdt || 0) < 1) {
          nativeAlert('Insufficient balance. You need at least 1 USDT to run.');
          e.stopImmediatePropagation();
        }
      }, true);
    });

    window.alert = function(msg) {
      try {
        if (typeof msg === 'string' && msg.indexOf('Run completed.') === 0) {
          var profitMatch = msg.match(/Profit \+([\d.]+)\s*USDT/);
          var profit = profitMatch ? parseFloat(profitMatch[1]) : 0;
          if (isNaN(profit)) profit = 0;

          var wallet = loadWallet();

          // cost 1 USDT per run
          wallet.usdt = (wallet.usdt || 0) - 1;
          if (wallet.usdt < 0) wallet.usdt = 0;

          // credit profit
          wallet.usdt = (wallet.usdt || 0) + profit;
          wallet.totalPersonalIncome =
            (wallet.totalPersonalIncome || 0) + profit;
          wallet.todayPersonalIncome =
            (wallet.todayPersonalIncome || 0) + profit;

          // record transaction as income
          if (!Array.isArray(wallet.transactions)) wallet.transactions = [];
          wallet.transactions.push({
            id: 'ai_' + Date.now(),
            type: 'income',
            amount: profit,
            fee: 0,
            net: profit,
            status: 'COMPLETED',
            currency: 'USDT',
            createdAt: new Date().toISOString()
          });

          saveWallet(wallet);
        }
      } catch (e) {}
      return nativeAlert.apply(window, arguments);
    };
  }

  // ---------- Withdraw page ----------
  function setupWithdrawIfPresent() {
    var withdrawBtn = document.getElementById('withdrawBtn');
    var qtyInput = document.getElementById('qtyInput');
    var feeVal = document.getElementById('feeVal');
    var recvVal = document.getElementById('recvVal');
    var maxLink = document.getElementById('maxLink');
    var availableVal = document.getElementById('availableVal');
    var minQtyEl = document.getElementById('minQty');

    if (!withdrawBtn || !qtyInput || !feeVal || !recvVal || !availableVal) {
      return;
    }

    var wallet = loadWallet();
    var balance = wallet.usdt || 0;
    var minQty = 20;
    if (minQtyEl) {
      var parsedMin = parseFloat(minQtyEl.textContent);
      if (!isNaN(parsedMin) && parsedMin > 0) {
        minQty = parsedMin;
      }
    }

    function refreshAvailable() {
      availableVal.textContent = balance.toFixed(2) + ' USDT';
    }

    function updateValues() {
      var v = parseFloat(qtyInput.value);
      if (isNaN(v) || v <= 0) {
        feeVal.textContent = '0';
        recvVal.textContent = '0';
        return;
      }
      var fee = v * 0.05;
      var received = v - fee;
      feeVal.textContent = fee.toFixed(2);
      recvVal.textContent = received.toFixed(2);
    }

    refreshAvailable();
    updateValues();

    qtyInput.addEventListener('input', updateValues);

    if (maxLink) {
      maxLink.addEventListener('click', function() {
        qtyInput.value = balance.toFixed(2);
        updateValues();
      });
    }

    withdrawBtn.addEventListener('click', function() {
      var v = parseFloat(qtyInput.value);
      if (isNaN(v) || v <= 0) {
        alert('Please enter a valid amount.');
        return;
      }
      if (v < minQty) {
        alert('The minimum withdrawal amount is ' + minQty + ' USDT.');
        return;
      }
      if (v > balance) {
        alert('Insufficient balance.');
        return;
      }

      var fee = v * 0.05;
      var received = v - fee;

      var walletNow = loadWallet();
      var balNow = walletNow.usdt || 0;
      if (v > balNow) {
        alert('Insufficient balance.');
        return;
      }

      walletNow.usdt = parseFloat((balNow - v).toFixed(2));
      if (!Array.isArray(walletNow.transactions)) walletNow.transactions = [];
      walletNow.transactions.push({
        id: 'wd_' + Date.now(),
        type: 'withdraw',
        amount: v,
        fee: fee,
        net: received,
        status: 'PENDING',
        currency: 'USDT',
        createdAt: new Date().toISOString()
      });
      saveWallet(walletNow);

      // update local balance & UI
      balance = walletNow.usdt;
      refreshAvailable();
      qtyInput.value = '';
      updateValues();

      alert('Withdrawal request submitted and is pending review.');
    });
  }

  // ---------- Bills page ----------
  function setupBillsIfPresent() {
    var container = document.getElementById('billsContainer');
    if (!container) return;

    var startInput = document.getElementById('startDate');
    var endInput = document.getElementById('endDate');
    var resetBtn = document.querySelector('.btn-reset');
    var confirmBtn = document.querySelector('.btn-confirm');
    var typeRow = document.getElementById('typeRow');
    var typeLabel = document.getElementById('typeLabel');
    var currencyRow = document.getElementById('currencyRow');
    var currencyLabel = document.getElementById('currencyLabel');
    var backBtn = document.querySelector('.back-btn');

    if (backBtn) {
      backBtn.addEventListener('click', function() {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }

    var allTxs = [];
    var filters = {
      startDate: '',
      endDate: '',
      type: 'all',
      currency: 'USDT'
    };

    function showEmpty() {
      container.className = 'empty-state';
      container.textContent = 'No bills yet.';
    }

    function renderBills(list) {
      if (!list || !list.length) {
        showEmpty();
        return;
      }

      container.className = 'bill-list';
      container.innerHTML = '';

      list.forEach(function(tx) {
        var item = document.createElement('div');
        item.className = 'bill-item';

        var typeLabelText =
          tx.type === 'withdraw' ? 'Withdraw' :
          tx.type === 'deposit' ? 'Deposit' :
          tx.type === 'income' ? 'Income' :
          tx.type === 'swap' ? 'Swap' :
          (tx.type || 'Record');

        var status = tx.status || 'PENDING';
        var createdAt = tx.createdAt
          ? tx.createdAt.replace('T', ' ').slice(0, 19)
          : '';

        var amount = (typeof tx.amount === 'number'
          ? tx.amount.toFixed(2)
          : String(tx.amount || '0'));
        var currency = (tx.currency || filters.currency || 'USDT').toUpperCase();
        var amountStr = amount + ' ' + currency;

        var feeStr = typeof tx.fee === 'number'
          ? tx.fee.toFixed(2) + ' ' + currency
          : '';
        var netStr = typeof tx.net === 'number'
          ? tx.net.toFixed(2) + ' ' + currency
          : '';

        item.innerHTML =
          '<div class="bill-main-row">' +
            '<span class="bill-type">' + typeLabelText + '</span>' +
            '<span class="bill-amount">' + amountStr + '</span>' +
          '</div>' +
          '<div class="bill-sub-row">' +
            '<span class="bill-status">' + status + '</span>' +
            (createdAt
              ? '<span class="bill-time">' + createdAt + '</span>'
              : '') +
          '</div>' +
          (feeStr || netStr
            ? '<div class="bill-sub-row">' +
                (feeStr ? '<span class="bill-fee">Fee: ' + feeStr + '</span>' : '') +
                (netStr ? '<span class="bill-net">Net: ' + netStr + '</span>' : '') +
              '</div>'
            : '');

        container.appendChild(item);
      });
    }

    function applyFilters() {
      if (!allTxs.length) {
        showEmpty();
        return;
      }

      var filtered = allTxs.filter(function(tx) {
        var createdAt = tx.createdAt ? new Date(tx.createdAt) : null;

        if (filters.startDate && createdAt) {
          var start = new Date(filters.startDate + 'T00:00:00');
          if (createdAt < start) return false;
        }
        if (filters.endDate && createdAt) {
          var end = new Date(filters.endDate + 'T23:59:59');
          if (createdAt > end) return false;
        }

        if (filters.type && filters.type !== 'all') {
          if (!tx.type || tx.type.toLowerCase() !== filters.type) return false;
        }

        if (filters.currency) {
          var txCurrency = (tx.currency || 'USDT').toUpperCase();
          if (txCurrency !== filters.currency.toUpperCase()) return false;
        }

        return true;
      });

      renderBills(filtered);
    }

    function loadTransactionsForBills() {
      var txs = getTransactions();
      if (!txs || !txs.length) {
        showEmpty();
        return;
      }

      allTxs = txs.slice().sort(function(a, b) {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

      applyFilters();
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        filters.startDate = '';
        filters.endDate = '';
        filters.type = 'all';
        filters.currency = 'USDT';
        if (typeLabel) typeLabel.textContent = 'All';
        if (currencyLabel) currencyLabel.textContent = 'USDT';
        applyFilters();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        if (startInput) filters.startDate = startInput.value || '';
        if (endInput) filters.endDate = endInput.value || '';
        applyFilters();
      });
    }

    if (typeRow) {
      var typeOptions = ['all', 'deposit', 'withdraw', 'income', 'swap'];
      var typeLabels = {
        all: 'All',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        income: 'Income',
        swap: 'Swap'
      };
      var index = 0;

      typeRow.addEventListener('click', function() {
        index = (index + 1) % typeOptions.length;
        var key = typeOptions[index];
        filters.type = key;
        if (typeLabel) typeLabel.textContent = typeLabels[key];
        applyFilters();
      });
    }

    if (currencyRow) {
      var currencyOptions = ['USDT', 'BTC', 'ETH', 'USDC', 'TRX'];
      var currencyIndex = 0;

      currencyRow.addEventListener('click', function() {
        currencyIndex = (currencyIndex + 1) % currencyOptions.length;
        var cur = currencyOptions[currencyIndex];
        filters.currency = cur;
        if (currencyLabel) currencyLabel.textContent = cur;
        applyFilters();
      });
    }

    loadTransactionsForBills();
  }

  // Initialize wallet once (ensures default 3 USDT)
  loadWallet();

  // Page-specific setups on DOM ready
  function initAll() {
    setupMyAssetsIfPresent();
    setupAiPowerIfPresent();
    setupWithdrawIfPresent();
    setupBillsIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
