(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  var emailInput = document.getElementById("email");
  var honey = document.getElementById("company");
  var button = document.getElementById("submit-btn");
  var statusEl = document.getElementById("form-status");
  var thanks = document.getElementById("thanks");
  var cfg = window.RUTHIE_WAITLIST || {};

  window.ruthieEvents = window.ruthieEvents || [];

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

  function track(name, props) {
    var row = {
      event: name,
      ts: new Date().toISOString(),
      path: window.location.pathname || "/",
      source: (props && props.source) || resolveSource()
    };
    if (props && props.reason) row.reason = props.reason;
    window.ruthieEvents.push(row);

    // Durable friction events only (not page_view — that would flood the inbox).
    // Signup count = Web3Forms rows with subject [RUTHIE waitlist].
    if (name === "waitlist_submit_attempt" || name === "waitlist_submit_error") {
      var key = (cfg.web3formsKey || "").trim();
      if (!key) return;
      var body = {
        access_key: key,
        subject: "[RUTHIE waitlist event]",
        from_name: "Ruthie waitlist events",
        email: "events@ruthie.waitlist",
        event: row.event,
        createdAt: row.ts,
        source: row.source,
        path: row.path,
        botcheck: false
      };
      if (row.reason) body.reason = row.reason;
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        keepalive: true
      }).catch(function () {});
    }
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
    var key = (cfg.web3formsKey || "").trim();
    if (!key) {
      throw new Error("no-backend");
    }
    var body = {
      access_key: key,
      subject: "[RUTHIE waitlist]",
      from_name: "Ruthie waitlist",
      email: payload.email,
      createdAt: payload.createdAt,
      source: payload.source,
      event: "waitlist_submit_success",
      botcheck: false
    };
    var res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok || data.success === false) {
      throw new Error("server");
    }
  }

  track("page_view", { source: resolveSource() });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showError("");

    var source = resolveSource();
    track("waitlist_submit_attempt", { source: source });

    if ((honey.value || "").trim()) {
      showThanks();
      return;
    }

    var email = (emailInput.value || "").trim().toLowerCase();
    if (!isEmail(email)) {
      track("waitlist_submit_error", { source: source, reason: "validation" });
      showError("Need a valid email.");
      emailInput.focus();
      return;
    }

    var payload = {
      email: email,
      createdAt: new Date().toISOString(),
      source: source
    };

    button.disabled = true;
    persist(payload)
      .then(function () {
        track("waitlist_submit_success", { source: source });
        showThanks();
      })
      .catch(function (err) {
        button.disabled = false;
        track("waitlist_submit_error", { source: source, reason: "server" });
        if (err && err.message === "no-backend") {
          showError("The list isn’t connected yet. Try again in a little while.");
        } else {
          showError("Couldn’t save that. Try again.");
        }
      });
  });
})();
