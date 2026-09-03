(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  var emailInput = document.getElementById("email");
  var honey = document.getElementById("company");
  var button = document.getElementById("submit-btn");
  var statusEl = document.getElementById("form-status");
  var thanks = document.getElementById("thanks");
  var cfg = window.RUTHIE_WAITLIST || {};

  function resolveSource() {
    var q = new URLSearchParams(window.location.search);
    var utmSource = (q.get("utm_source") || "").trim();
    if (utmSource) {
      var bits = [utmSource];
      var medium = (q.get("utm_medium") || "").trim();
      var campaign = (q.get("utm_campaign") || "").trim();
      if (medium) bits.push(medium);
      if (campaign) bits.push(campaign);
      return bits.join("/").slice(0, 200);
    }
    var refQ = (q.get("ref") || q.get("source") || "").trim();
    if (refQ) return refQ.slice(0, 200);
    try {
      if (document.referrer) {
        var host = new URL(document.referrer).hostname;
        if (host && host !== window.location.hostname) return host.slice(0, 200);
      }
    } catch (e) {}
    return "direct";
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
  }

  function showError(message) {
    statusEl.textContent = message;
  }

  function showThanks() {
    form.hidden = true;
    thanks.hidden = false;
  }

  async function persist(payload) {
    var hash = (cfg.formsubmitHash || "").trim();
    if (!hash) {
      throw new Error("no-backend");
    }
    var body = {
      email: payload.email,
      createdAt: payload.createdAt,
      source: payload.source,
      _subject: "Ruthie waitlist",
      _template: "table"
    };
    var res = await fetch("https://formsubmit.co/ajax/" + hash, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok || data.success === false || data.success === "false") {
      throw new Error("server");
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("");

    if ((honey.value || "").trim()) {
      showThanks();
      return;
    }

    var email = (emailInput.value || "").trim().toLowerCase();
    if (!isEmail(email)) {
      showError("Need a valid email.");
      emailInput.focus();
      return;
    }

    var payload = {
      email: email,
      createdAt: new Date().toISOString(),
      source: resolveSource()
    };

    button.disabled = true;
    persist(payload)
      .then(showThanks)
      .catch(function (err) {
        button.disabled = false;
        if (err && err.message === "no-backend") {
          showError("The list isn’t connected yet. Try again in a little while.");
        } else {
          showError("Couldn’t save that. Try again.");
        }
      });
  });
})();
