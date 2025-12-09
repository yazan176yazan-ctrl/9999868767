(function (window) {
  var STORAGE_KEY = "demoWallet_v1";

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function save(w) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
    } catch (e) {}
  }

var TX_KEY = STORAGE_KEY + "_txs";

function loadTransactions() {
  try {
    var raw = localStorage.getItem(TX_KEY);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) {
    return [];
  }
}

function saveTransactions(list) {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(list || []));
  } catch (e) {}
}

function addTransaction(tx) {
  if (!tx || typeof tx !== "object") return;
  var list = loadTransactions();
  var now = new Date().toISOString();
  if (!tx.id) tx.id = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  if (!tx.createdAt) tx.createdAt = now;
  if (!tx.status) tx.status = "SUCCESS";
  list.push(tx);
  saveTransactions(list);
  return tx;
}

  function ensure() {
    var w = load();
    if (!w) {
      // First time ever: give 3 USDT demo balance
      w = {
        balance: 3,
        totalIncome: 0,
        todayIncome: 0,
        lastIncomeDate: todayStr()
      };
      save(w);
      return w;
    }
    var t = todayStr();
    if (w.lastIncomeDate !== t) {
      w.todayIncome = 0;
      w.lastIncomeDate = t;
      save(w);
    }
    if (typeof w.balance !== "number") w.balance = 0;
    if (typeof w.totalIncome !== "number") w.totalIncome = 0;
    if (typeof w.todayIncome !== "number") w.todayIncome = 0;
    return w;
  }

  function getWallet() {
    return ensure();
  }

function grantSignupBonusOnce() {
  try {
    var flagKey = STORAGE_KEY + "_signup_bonus_v1";
    var already = localStorage.getItem(flagKey);
    if (already === "1") {
      return ensure();
    }
    var w = ensure();
    var t = todayStr();
    if (w.lastIncomeDate !== t) {
      w.todayIncome = 0;
      w.lastIncomeDate = t;
    }
    var bonus = 5;
    w.balance += bonus;
    w.totalIncome += bonus;
    w.todayIncome += bonus;
    localStorage.setItem(flagKey, "1");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
    addTransaction({
      type: "income",
      amount: bonus,
      currency: "USDT",
      net: bonus,
      source: "signup-bonus"
    });
    return w;
  } catch (e) {
    return ensure();
  }
}

  function addIncome(amount) {
    if (!amount || isNaN(amount)) amount = 0;
    var w = ensure();
    var t = todayStr();
    if (w.lastIncomeDate !== t) {
      w.todayIncome = 0;
      w.lastIncomeDate = t;
    }
    w.balance += amount;
    w.totalIncome += amount;
    w.todayIncome += amount;
    save(w);
    addTransaction({
      type: "income",
      amount: amount,
      currency: "USDT",
      net: amount,
      source: "ai-power"
    });
    return w;
  }

  function withdraw(amount) {
    var w = ensure();
    if (!amount || isNaN(amount) || amount <= 0) return false;
    if (w.balance < amount) return false;
    w.balance -= amount;
    if (w.balance < 0) w.balance = 0;
    save(w);
    addTransaction({
      type: "withdraw",
      amount: amount,
      currency: "USDT",
      fee: amount * 0.05,
      net: amount * 0.95,
      status: "PENDING"
    });
    return w;
  }

  function formatUsdt(v) {
    if (typeof v !== "number" || isNaN(v)) v = 0;
    var s = v.toFixed(2);
    if (s.endsWith(".00")) s = s.slice(0, -3);
    return s;
  }

  function applyToAssetsPage() {
    var w = ensure();

    // Main balance and donut
    var balanceEl = document.querySelector(".assets-usdt-balance");
    if (balanceEl) {
      balanceEl.textContent = formatUsdt(w.balance) + " USDT";
    }

    var donutInner = document.querySelector(".donut-inner");
    if (donutInner) {
      donutInner.innerHTML = "<strong>Total Assets</strong>≈$" + formatUsdt(w.balance);
    }

    // Personal income
    var totalPersonal = document.querySelector(".assets-total-personal");
    if (totalPersonal) {
      totalPersonal.textContent = formatUsdt(w.totalIncome) + " USDT";
    }

    var todayPersonal = document.querySelector(".assets-today-personal");
    if (todayPersonal) {
      todayPersonal.textContent = formatUsdt(w.todayIncome) + " USDT";
    }

    // Simple demo: team incomes stay 0
    var totalTeam = document.querySelector(".assets-total-team");
    if (totalTeam) {
      totalTeam.textContent = "0 USDT";
    }
    var todayTeam = document.querySelector(".assets-today-team");
    if (todayTeam) {
      todayTeam.textContent = "0 USDT";
    }

    // Currency list: first row (USDT) shows current balance, others 0
    var rows = document.querySelectorAll(".currency-list .currency-row");
    if (rows && rows.length) {
      rows.forEach(function (row, index) {
        var amountEl = row.querySelector(".currency-amount");
        if (!amountEl) return;
        if (index === 0) {
          amountEl.textContent = formatUsdt(w.balance);
        } else {
          amountEl.textContent = "0";
        }
      });
    }

    // Token percentages: all balance in USDT for the demo
    var tokenRows = document.querySelectorAll(".token-row");
    tokenRows.forEach(function (row, index) {
      var percentEl = row.querySelector(".token-percent");
      if (!percentEl) return;
      if (index === 0) {
        percentEl.textContent = "100%";
      } else {
        percentEl.textContent = "0.00%";
      }
    });
  }

function recordSwap(fromToken, toToken, amountFrom, amountTo) {
  addTransaction({
    type: "swap",
    amount: amountFrom,
    currency: String(fromToken || "USDT").toUpperCase(),
    net: amountTo,
    toCurrency: String(toToken || "USDT").toUpperCase(),
    status: "SUCCESS"
  });
}

function getTransactions() {
  return loadTransactions();
}

  window.DemoWallet = {
    getWallet: getWallet,
    addIncome: addIncome,
    applyToAssetsPage: applyToAssetsPage,
    grantSignupBonusOnce: grantSignupBonusOnce,
    withdraw: withdraw,
    recordSwap: recordSwap,
    getTransactions: getTransactions
  };
})(window);


/**
 * Extra demo logic: user profile, invite, team, and VIP levels.
 * All data is stored locally in the browser (localStorage) for demo purposes only.
 */
(function (window) {
  var USER_KEY = "demoUser_v1";

  function randomCode(len) {
    var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var out = "";
    for (var i = 0; i < len; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  function loadUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function saveUser(u) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u || {}));
    } catch (e) {}
  }

  function ensureUser() {
    var u = loadUser();
    if (!u) {
      u = {
        id: "U" + Date.now(),
        inviteCode: randomCode(6),
        team: {
          members: [],          // demo-only list of referred users
          todayIncome: 0,
          totalIncome: 0,
          perGeneration: {
            "1": { percent: 0, income: 0 },
            "2": { percent: 0, income: 0 },
            "3": { percent: 0, income: 0 }
          }
        }
      };
      saveUser(u);
    }
    if (!u.team) {
      u.team = {
        members: [],
        todayIncome: 0,
        totalIncome: 0,
        perGeneration: {
          "1": { percent: 0, income: 0 },
          "2": { percent: 0, income: 0 },
          "3": { percent: 0, income: 0 }
        }
      };
    }
    if (!u.team.members) u.team.members = [];
    return u;
  }

  function getUserProfile() {
    return ensureUser();
  }

  function getInviteInfo() {
    var u = ensureUser();
    var code = u.inviteCode;
    var base = (function () {
      try {
        if (typeof window !== "undefined" && window.location) {
          var loc = window.location;
          var origin = (loc.origin && typeof loc.origin === "string")
            ? loc.origin
            : (loc.protocol + "//" + loc.host);
          var path = (loc.pathname && typeof loc.pathname === "string") ? loc.pathname : "/";
          var basePath = path.replace(/[^\/]*$/, "");
          if (origin) {
            return origin.replace(/\/$/, "") + basePath + "signup.html?code=";
          }
        }
      } catch (e) {}
      return "signup.html?code=";
    })();
    return {
      code: code,
      link: base + code
    };
  }

  /**
   * Demo hook: record that a new user registered using a given invite code.
   * In a real project this must be done on a backend server.
   * Here we only support a local demo scenario.
   */
  function 
  var TEAM_STORE_KEY = "DEMO_WALLET_TEAM_V1";

  function loadTeamStore() {
    try {
      var raw = localStorage.getItem(TEAM_STORE_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return {};
      return obj;
    } catch (e) {
      return {};
    }
  }

  function saveTeamStore(store) {
    try {
      localStorage.setItem(TEAM_STORE_KEY, JSON.stringify(store || {}));
    } catch (e) {}
  }

  function registerReferral(inviteCode, info) {
    if (!inviteCode) return false;
    var code = String(inviteCode).trim();
    if (!code) return false;

    var store = loadTeamStore();
    if (!store[code]) {
      store[code] = {
        members: [],
        todayIncome: 0,
        totalIncome: 0
      };
    }
    var bucket = store[code];
    var members = bucket.members || [];
    var now = new Date();
    var item = {
      account: (info && info.account) || ("demo" + (members.length + 1)),
      userId: (info && info.userId) || ("ID" + Date.now()),
      level: (info && info.level) || 1,
      generation: (info && info.generation) || 1,
      registeredAt: (info && info.registeredAt) || now.toISOString().slice(0, 19).replace("T", " ")
    };
    members.push(item);
    bucket.members = members;
    store[code] = bucket;
    saveTeamStore(store);
    return true;
  }

  function computeTeamSummary() {
    var u = ensureUser();
    var code = u.inviteCode;
    var store = loadTeamStore();
    var bucket = store[code] || { members: [], todayIncome: 0, totalIncome: 0 };
    var members = bucket.members || [];
    var todayIncome = bucket.todayIncome || 0;
    var totalIncome = bucket.totalIncome || 0;

    var generations = {
      1: { effective: 0, percent: 20, income: 0 },
      2: { effective: 0, percent: 5, income: 0 },
      3: { effective: 0, percent: 3, income: 0 }
    };

    members.forEach(function (m) {
      var g = m.generation || 1;
      if (g === 1 || g === 2 || g === 3) {
        generations[g].effective += 1;
      }
    });

    return {
      teamSize: members.length,
      todayIncome: todayIncome,
      totalIncome: totalIncome,
      generations: generations,
      members: members
    };
  }

  function getTeamSummary() {
    return computeTeamSummary();
  }
 });

    return {
      teamSize: members.length,
      todayIncome: todayIncome,
      totalIncome: totalIncome,
      generations: generations,
      members: members
    };
  }


  function getTeamSummary() {
    return computeTeamSummary();
  }

  /**
   * VIP levels & withdraw rules are computed on top of the wallet balance
   * and number of "effective" users (level >= 1) in the team.
   */
  function computeVipInfo() {
    var w = window.DemoWallet && window.DemoWallet.getWallet ? window.DemoWallet.getWallet() : { balance: 0 };
    var u = ensureUser();
    var members = u.team && u.team.members ? u.team.members : [];
    var effectiveUsers = members.filter(function (m) {
      return m.level && m.level >= 1;
    }).length;

    var balance = (typeof w.balance === "number" ? w.balance : 0);

    var levels = [
      { name: "V1", minBalance: 50,    minUsers: 5,  minWithdraw: 20, maxWithdraw: 500  },
      { name: "V2", minBalance: 500,   minUsers: 5,  minWithdraw: 20, maxWithdraw: 1000 },
      { name: "V3", minBalance: 3000,  minUsers: 10, minWithdraw: 20, maxWithdraw: 2000 },
      { name: "V4", minBalance: 10000, minUsers: 10, minWithdraw: 20, maxWithdraw: 3000 },
      { name: "V5", minBalance: 30000, minUsers: 10, minWithdraw: 20, maxWithdraw: 5000 },
      { name: "V6", minBalance: 100000,minUsers: 10, minWithdraw: 20, maxWithdraw: 7000 }
    ];

    var current = "V0";
    var currentRules = null;

    for (var i = 0; i < levels.length; i++) {
      var lv = levels[i];
      if (balance >= lv.minBalance && effectiveUsers >= lv.minUsers) {
        current = lv.name;
        currentRules = lv;
      } else {
        break;
      }
    }

    var next = null;
    for (var j = 0; j < levels.length; j++) {
      if (levels[j].name === current) {
        next = levels[j + 1] ? levels[j + 1].name : null;
        break;
      }
      if (current === "V0") {
        next = levels[0].name;
      }
    }

    var rulesByLevel = {};
    levels.forEach(function (lv) {
      rulesByLevel[lv.name] = {
        minBalance: lv.minBalance,
        minUsers: lv.minUsers,
        minWithdraw: lv.minWithdraw,
        maxWithdraw: lv.maxWithdraw,
        feePercent: 5
      };
    });

    return {
      balance: balance,
      effectiveUsers: effectiveUsers,
      currentLevel: current,
      nextLevel: next,
      rulesByLevel: rulesByLevel
    };
  }

  function getVipInfo() {
    return computeVipInfo();
  }

  /**
   * Helper to get withdraw rules for the current VIP level.
   */
  function getCurrentWithdrawRules() {
    var info = computeVipInfo();
    if (!info.currentLevel || !info.rulesByLevel[info.currentLevel]) {
      return {
        minWithdraw: 20,
        maxWithdraw: 500,
        feePercent: 5
      };
    }
    var r = info.rulesByLevel[info.currentLevel];
    return {
      minWithdraw: r.minWithdraw,
      maxWithdraw: r.maxWithdraw,
      feePercent: r.feePercent
    };
  }

  // Optional: wrapper for withdraw that respects VIP rules.
  var originalWithdraw = window.DemoWallet && window.DemoWallet.withdraw
    ? window.DemoWallet.withdraw
    : null;

  function vipAwareWithdraw(amount) {
    if (!originalWithdraw) return false;
    var rules = getCurrentWithdrawRules();
    if (!amount || isNaN(amount) || amount <= 0) return false;
    if (amount < rules.minWithdraw || amount > rules.maxWithdraw) {
      return false;
    }
    return originalWithdraw(amount);
  }

  // Merge into existing DemoWallet object
  if (!window.DemoWallet) {
    window.DemoWallet = {};
  }
  window.DemoWallet.getUserProfile = getUserProfile;
  window.DemoWallet.getInviteInfo = getInviteInfo;
  window.DemoWallet.getTeamSummary = getTeamSummary;
  window.DemoWallet.getVipInfo = getVipInfo;
  window.DemoWallet.getCurrentWithdrawRules = getCurrentWithdrawRules;
  window.DemoWallet.vipAwareWithdraw = vipAwareWithdraw;
  window.DemoWallet.registerReferral = registerReferral;
})(window);

