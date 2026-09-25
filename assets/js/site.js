/* VAMA Consulting Group - site behavior
   No framework. Progressive enhancement: every page reads and links without JS;
   forms fall back to a pre-filled email when no endpoint is configured. */
(function () {
  "use strict";

  var CFG = window.VAMA_CONFIG || {};
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  doc.classList.add("js");

  /* ---------------- Analytics hook ---------------- */
  window.dataLayer = window.dataLayer || [];
  window.vamaTrack = function (event, props) {
    props = props || {};
    try {
      window.dataLayer.push(Object.assign({ event: event }, props));
      if (typeof window.plausible === "function") window.plausible(event, { props: props });
      if (typeof window.gtag === "function") window.gtag("event", event, props);
    } catch (e) { /* never block the visitor */ }
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) window.vamaTrack(el.getAttribute("data-track"), { label: (el.textContent || "").trim().slice(0, 60), path: location.pathname });
  });

  /* ---------------- Header ---------------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); toggle.focus(); } });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1060) setNav(false); });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Stagger groups ---------------- */
  var staggerEls = document.querySelectorAll("[data-stagger]");
  staggerEls.forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.transitionDelay = Math.min(i * 60, 480) + "ms"; });
  });
  if ("IntersectionObserver" in window && staggerEls.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); so.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    staggerEls.forEach(function (el) { so.observe(el); });
  } else {
    staggerEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Layered heroes: scroll + pointer, transform only ---------------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.querySelectorAll(".hero-stage").forEach(function (stage) {
    stage.querySelectorAll(".plane").forEach(function (pl) { pl.style.setProperty("--rate", pl.getAttribute("data-rate") || "0.3"); });
    requestAnimationFrame(function () { stage.classList.add("is-live"); });
    if (reduce) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = stage.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));  // 0 entering, 1 leaving
      stage.style.setProperty("--hp", (p - 0.5).toFixed(3));
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    if (finePointer) {
      var host = stage.closest(".page-hero, .home-hero") || stage;
      host.addEventListener("pointermove", function (e) {
        var b = host.getBoundingClientRect();
        stage.style.setProperty("--mx", ((e.clientX - b.left) / b.width - 0.5).toFixed(3));
        stage.style.setProperty("--my", ((e.clientY - b.top) / b.height - 0.5).toFixed(3));
      });
      host.addEventListener("pointerleave", function () { stage.style.setProperty("--mx", "0"); stage.style.setProperty("--my", "0"); });
    }
  });

  /* ---------------- Signature move: the assumptions log writes itself ---------------- */
  var log = document.querySelector(".evidence-log");
  var logged = document.querySelectorAll("[data-log]");
  if (log && logged.length) {
    var list = log.querySelector(".evidence-log__list");
    var count = log.querySelector(".evidence-log__count");
    var seen = 0, total = logged.length;
    var wide = window.matchMedia("(min-width: 1181px)").matches;
    function add(el) {
      if (el.dataset.logged) return;
      el.dataset.logged = "1";
      seen++;
      var li = document.createElement("li");
      var id = el.id;
      li.innerHTML = id ? '<a href="#' + id + '">' + el.getAttribute("data-log") + "</a>" : el.getAttribute("data-log");
      list.appendChild(li);
      if (count) count.textContent = seen + " of " + total;
      if (list.children.length > 6) list.removeChild(list.firstElementChild);
      log.classList.add("is-on");
    }
    if (wide && "IntersectionObserver" in window) {
      var lo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { add(en.target); lo.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -35% 0px", threshold: 0.2 });
      logged.forEach(function (el) { lo.observe(el); });
      // hide once the footer is reached so it never covers the end
      var footer = document.querySelector(".site-footer");
      if (footer) new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { log.classList.toggle("is-on", !en.isIntersecting && seen > 0); });
      }, { threshold: 0.05 }).observe(footer);
    } else {
      // narrow screens: render the full log as a static list before the footer
      log.classList.add("evidence-log--static");
      logged.forEach(add);
      if (count) count.textContent = total + " logged on this page";
    }
    window.vamaTrack && log.addEventListener("click", function (e) { if (e.target.closest("a")) window.vamaTrack("assumptions_log_click"); });
  }

  /* ---------------- Filter chips (cases, insights) ---------------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var target = document.getElementById(group.getAttribute("data-filter-group"));
    if (!target) return;
    var chips = group.querySelectorAll("[data-filter]");
    var items = target.querySelectorAll("[data-tags]");
    var empty = target.querySelector("[data-empty]");
    function apply(value) {
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === value ? "true" : "false"); });
      items.forEach(function (it) {
        var tags = (it.getAttribute("data-tags") || "").split("|");
        var ok = value === "all" || tags.indexOf(value) !== -1;
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        apply(c.getAttribute("data-filter"));
        window.vamaTrack("filter_used", { group: group.getAttribute("data-filter-group"), value: c.getAttribute("data-filter") });
      });
    });
    var pre = new URLSearchParams(location.search).get("filter");
    if (pre && group.querySelector('[data-filter="' + pre + '"]')) apply(pre);
  });

  /* ---------------- Form helpers ---------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldWrap(el) { return el.closest(".field") || el.closest("fieldset"); }
  function setError(el, on) {
    var w = fieldWrap(el);
    if (w) w.classList.toggle("has-error", !!on);
    if (el.matches("input, select, textarea")) el.setAttribute("aria-invalid", on ? "true" : "false");
  }

  function validate(form) {
    var firstBad = null;
    form.querySelectorAll("[required]").forEach(function (el) {
      var bad;
      if (el.type === "radio") {
        bad = !form.querySelector('input[name="' + el.name + '"]:checked');
      } else if (el.type === "email") {
        bad = !EMAIL_RE.test(el.value.trim());
      } else {
        bad = !el.value.trim();
      }
      setError(el, bad);
      if (bad && !firstBad) firstBad = el;
    });
    form.querySelectorAll("[data-required-group]").forEach(function (fs) {
      var bad = !fs.querySelector("input:checked");
      fs.classList.toggle("has-error", bad);
      if (bad && !firstBad) firstBad = fs.querySelector("input");
    });
    if (firstBad) {
      var target = fieldWrap(firstBad) || firstBad;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { try { firstBad.focus({ preventScroll: true }); } catch (e) {} }, 300);
      return false;
    }
    return true;
  }

  function labelFor(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return name;
    if (el.getAttribute("data-label")) return el.getAttribute("data-label");
    var fs = el.closest("fieldset");
    if ((el.type === "radio" || el.type === "checkbox") && fs) {
      var lg = fs.querySelector("legend");
      if (lg) return lg.textContent.replace(/^\s*\d+\s*/, "").trim();
    }
    var lab = form.querySelector('label[for="' + el.id + '"]');
    return lab ? lab.childNodes[0].textContent.trim() : name;
  }

  function collect(form) {
    var fd = new FormData(form);
    var out = [];
    var seen = {};
    fd.forEach(function (v, k) {
      if (k === "_gotcha" || k === "_subject" || k === "_replyto") return;
      if (seen[k]) { seen[k].value += ", " + v; return; }
      var row = { key: k, label: labelFor(form, k), value: String(v) };
      seen[k] = row;
      out.push(row);
    });
    return out.filter(function (r) { return r.value.trim() !== ""; });
  }

  function summaryText(rows) {
    return rows.map(function (r) { return r.label + ": " + r.value; }).join("\n");
  }

  function endpointFor(inbox) { return CFG["form_endpoint_" + inbox] || ""; }
  function emailFor(inbox) { return CFG["email_" + inbox] || CFG.email_general || ""; }

  function send(form, opts) {
    // opts: inbox, subject, success, rows
    var endpoint = endpointFor(opts.inbox);
    var body = summaryText(opts.rows);
    var record = { inbox: emailFor(opts.inbox), subject: opts.subject, body: body, at: new Date().toISOString() };
    try { sessionStorage.setItem("vama_last_request", JSON.stringify(record)); } catch (e) {}

    if (endpoint) {
      var fd = new FormData(form);
      fd.set("_subject", opts.subject);
      var em = form.querySelector('input[type="email"]');
      if (em) fd.set("_replyto", em.value.trim());
      return fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return "endpoint"; });
    }
    var href = "mailto:" + record.inbox + "?subject=" + encodeURIComponent(opts.subject) + "&body=" + encodeURIComponent(body + "\n\n(Sent from vamacg.com)");
    window.location.href = href;
    return Promise.resolve("email");
  }

  function goSuccess(url, via) {
    if (!url) return;
    setTimeout(function () { window.location.href = url + (via === "email" ? "?via=email" : ""); }, via === "email" ? 900 : 50);
  }

  function statusMsg(form, html, kind) {
    var s = form.querySelector(".form-status");
    if (!s) return;
    s.innerHTML = html ? '<div class="notice notice--' + (kind || "info") + '">' + html + "</div>" : "";
  }

  /* ---------------- Prefill from links (?visa=E-2&doc=rfe-audit&role=counsel&workflow=...) ---------------- */
  var PREFILL = { visa: "visa_category", doc: "documents", role: "role", stage: "stage", workflow: "workflow" };
  new URLSearchParams(location.search).forEach(function (val, key) {
    var name = PREFILL[key];
    if (!name) return;
    document.querySelectorAll("form").forEach(function (f) {
      f.querySelectorAll('input[name="' + name + '"]').forEach(function (i) { if (i.value === val) i.checked = true; });
    });
  });

  /* ---------------- Immigration scope form ---------------- */
  var imm = document.getElementById("scope-form");
  if (imm) {

    var applicantNote = document.getElementById("applicant-note");
    var counselField = document.getElementById("counsel-field");
    var firmLabel = document.getElementById("org-label");
    function syncRole() {
      var r = imm.querySelector('input[name="role"]:checked');
      var val = r ? r.value : "";
      if (applicantNote) applicantNote.hidden = val !== "applicant";
      if (counselField) counselField.hidden = val !== "applicant";
      if (firmLabel) firmLabel.firstChild.textContent = val === "counsel" ? "Law firm " : "Company or firm ";
    }
    imm.addEventListener("change", function (e) { if (e.target.name === "role") syncRole(); });
    syncRole();

    var dl = document.getElementById("deadline");
    var rush = document.getElementById("rush-note");
    var prio = document.getElementById("priority");
    function syncDeadline() {
      if (!dl || !rush) return;
      var days = null;
      if (dl.value) {
        var d = new Date(dl.value + "T12:00:00");
        days = Math.ceil((d - new Date()) / 86400000);
      }
      var isRush = days !== null && days < (CFG.rush_threshold_days || 14);
      rush.hidden = !isRush;
      if (prio) prio.value = isRush ? "rush (" + days + " days to deadline)" : "standard";
    }
    if (dl) { dl.addEventListener("change", syncDeadline); dl.addEventListener("input", syncDeadline); }

    imm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (imm.querySelector(".hp") && imm.querySelector(".hp").value) return;
      if (!validate(imm)) { window.vamaTrack("scope_form_invalid"); return; }
      syncDeadline();
      var rows = collect(imm);
      var visa = (imm.querySelector('input[name="visa_category"]:checked') || {}).value || "Visa TBD";
      var docs = Array.prototype.map.call(imm.querySelectorAll('input[name="documents"]:checked'), function (i) { return i.getAttribute("data-short") || i.value; }).join(", ");
      var due = dl && dl.value ? " - due " + dl.value : "";
      var isRush = prio && prio.value.indexOf("rush") === 0;
      var subject = (isRush ? "[RUSH] " : "") + "Scope request - " + visa + " - " + (docs || "documents TBD") + due;
      var btn = imm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
      send(imm, { inbox: "immigration", subject: subject, rows: rows })
        .then(function (via) {
          window.vamaTrack("scope_request_submitted", { visa: visa, rush: isRush, via: via });
          goSuccess(imm.getAttribute("data-success"), via);
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Send the matter details"; }
          statusMsg(imm, "<strong>That did not go through.</strong> Please email <a href=\"mailto:" + emailFor("immigration") + "\">" + emailFor("immigration") + "</a> directly - your answers are below so nothing is lost.<pre style=\"white-space:pre-wrap;margin:.75rem 0 0;font:inherit\">" + summaryText(rows).replace(/</g, "&lt;") + "</pre>", "no");
        });
    });
  }

  /* ---------------- General contact form ---------------- */
  var gen = document.getElementById("general-form");
  if (gen) {
    gen.addEventListener("submit", function (e) {
      e.preventDefault();
      if (gen.querySelector(".hp") && gen.querySelector(".hp").value) return;
      if (!validate(gen)) return;
      var rows = collect(gen);
      var topic = (gen.querySelector('[name="topic"]') || {}).value || "General inquiry";
      var btn = gen.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
      send(gen, { inbox: "general", subject: "Website inquiry - " + topic, rows: rows })
        .then(function (via) { window.vamaTrack("general_inquiry_submitted", { topic: topic, via: via }); goSuccess(gen.getAttribute("data-success"), via); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Send message"; }
          statusMsg(gen, "<strong>That did not go through.</strong> Please email <a href=\"mailto:" + emailFor("general") + "\">" + emailFor("general") + "</a>.", "no");
        });
    });
  }

  /* ---------------- AI fit-call qualifier + calendar ---------------- */
  var fit = document.getElementById("fit-form");
  if (fit) {
    var stepQualify = document.getElementById("step-qualify");
    var stepBook = document.getElementById("step-book");
    var noPanel = document.getElementById("fit-no");
    var cautionPanel = document.getElementById("fit-caution");
    var frameHost = document.getElementById("calendar-host");
    var sendAhead = document.getElementById("send-ahead");
    var stepperItems = document.querySelectorAll(".stepper__item");

    var NO_REASONS = {
      "build-now": "<strong>We are probably not the right first call.</strong> You already know the tool you want built. A builder or the software vendor will get you there faster and cheaper than an audit. If the build stalls or the numbers do not add up later, we are happy to talk then.",
      "training": "<strong>The audit is not a training program.</strong> If your team needs hands-on AI training on tools you have already chosen, that is a separately scoped workshop. Email us with the team size and tools, and we will tell you plainly whether we are a fit."
    };
    var CAUTION = {
      size: "Most audits fit teams of roughly 10-100 people, or smaller teams that handle a high volume of inquiries or jobs. If that sounds like you, carry on.",
      people: "The audit relies on 2-4 short interviews with the people who do the work. If only you can take part, we will discuss on the call whether a smaller scope makes sense."
    };

    function setStep(n) {
      stepperItems.forEach(function (it, i) {
        it.classList.toggle("is-current", i === n);
        it.classList.toggle("is-done", i < n);
      });
    }

    function loadCalendar() {
      if (!frameHost || frameHost.querySelector("iframe")) return;
      var url = CFG.calendar_embed_url;
      if (!url) { frameHost.innerHTML = '<div class="notice notice--warn"><p>Booking link not configured yet. Email <a href="mailto:' + emailFor("ai") + '">' + emailFor("ai") + "</a> and we will send times.</p></div>"; return; }
      var f = document.createElement("iframe");
      f.src = url;
      f.title = "Book a fit call with VAMA";
      f.loading = "lazy";
      frameHost.appendChild(f);
    }

    fit.addEventListener("submit", function (e) {
      e.preventDefault();
      if (fit.querySelector(".hp") && fit.querySelector(".hp").value) return;
      if (!validate(fit)) { window.vamaTrack("fit_form_invalid"); return; }
      var goal = (fit.querySelector('input[name="goal"]:checked') || {}).value;
      var size = (fit.querySelector('input[name="team_size"]:checked') || {}).value;
      var people = (fit.querySelector('input[name="interviews"]:checked') || {}).value;
      var workflow = (fit.querySelector('input[name="workflow"]:checked') || {}).value;
      var rows = collect(fit);
      var company = (fit.querySelector('[name="company"]') || {}).value || "";

      if (NO_REASONS[goal]) {
        noPanel.querySelector("[data-no-text]").innerHTML = NO_REASONS[goal];
        var mail = noPanel.querySelector("[data-no-email]");
        if (mail) mail.href = "mailto:" + emailFor("ai") + "?subject=" + encodeURIComponent("AI inquiry - " + company) + "&body=" + encodeURIComponent(summaryText(rows));
        noPanel.hidden = false;
        stepBook.hidden = true;
        noPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        window.vamaTrack("fit_clean_no", { reason: goal });
        return;
      }
      noPanel.hidden = true;

      var cautions = [];
      if (size === "1-9") cautions.push(CAUTION.size);
      if (people === "only-me") cautions.push(CAUTION.people);
      if (cautionPanel) {
        cautionPanel.hidden = !cautions.length;
        cautionPanel.querySelector("[data-caution-text]").innerHTML = cautions.map(function (c) { return "<p>" + c + "</p>"; }).join("");
      }

      var subject = "Fit call answers - " + (company || "new prospect") + " - " + (workflow || "workflow TBD");
      var endpoint = endpointFor("ai");
      var after = function (via) {
        window.vamaTrack("fit_qualified", { workflow: workflow, size: size, via: via });
        stepQualify.hidden = true;
        stepBook.hidden = false;
        setStep(1);
        loadCalendar();
        if (sendAhead) {
          sendAhead.hidden = via !== "none";
          var a = sendAhead.querySelector("a");
          if (a) a.href = "mailto:" + emailFor("ai") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(summaryText(rows));
        }
        stepBook.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      try { sessionStorage.setItem("vama_last_request", JSON.stringify({ inbox: emailFor("ai"), subject: subject, body: summaryText(rows), at: new Date().toISOString() })); } catch (err) {}

      if (endpoint) {
        var fd = new FormData(fit);
        fd.set("_subject", subject);
        var em = fit.querySelector('input[type="email"]');
        if (em) fd.set("_replyto", em.value.trim());
        fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
          .then(function (r) { after(r.ok ? "endpoint" : "none"); })
          .catch(function () { after("none"); });
      } else {
        after("none");
      }
    });

    var back = document.querySelectorAll("[data-fit-back]");
    back.forEach(function (b) {
      b.addEventListener("click", function () {
        stepBook.hidden = true;
        noPanel.hidden = true;
        stepQualify.hidden = false;
        setStep(0);
        stepQualify.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    var skip = document.getElementById("skip-to-calendar");
    if (skip) skip.addEventListener("click", function (e) {
      e.preventDefault();
      stepQualify.hidden = true;
      noPanel.hidden = true;
      stepBook.hidden = false;
      if (cautionPanel) cautionPanel.hidden = true;
      if (sendAhead) sendAhead.hidden = true;
      setStep(1);
      loadCalendar();
      window.vamaTrack("fit_skipped_to_calendar");
      stepBook.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------------- Received pages ---------------- */
  var summary = document.querySelector("[data-request-summary]");
  if (summary) {
    var rec = null;
    try { rec = JSON.parse(sessionStorage.getItem("vama_last_request") || "null"); } catch (e) {}
    var viaEmail = new URLSearchParams(location.search).get("via") === "email";
    var viaBox = document.querySelector("[data-via-email]");
    if (viaBox) viaBox.hidden = !viaEmail;
    if (rec && rec.body) {
      summary.hidden = false;
      var pre = summary.querySelector("pre");
      if (pre) pre.textContent = "To: " + rec.inbox + "\nSubject: " + rec.subject + "\n\n" + rec.body;
      var copy = summary.querySelector("[data-copy]");
      if (copy) copy.addEventListener("click", function () {
        var text = pre ? pre.textContent : "";
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(function () { copy.textContent = "Copied"; })
          .catch(function () { copy.textContent = "Select the text above to copy"; });
      });
    }
  }
})();
