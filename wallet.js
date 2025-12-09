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
    return w;
  }

  function withdraw(amount) {
    var w = ensure();
    if (!amount || isNaN(amount) || amount <= 0) return false;
    if (w.balance < amount) return false;
    w.balance -= amount;
    if (w.balance < 0) w.balance = 0;
    save(w);
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

  window.DemoWallet = {
    getWallet: getWallet,
    addIncome: addIncome,
    applyToAssetsPage: applyToAssetsPage,
    grantSignupBonusOnce: grantSignupBonusOnce,
    withdraw: withdraw
  };
})(window);
