/* ============================================================
   LOGISTICS UI — Client portal logic
   Demo client: CL-1001 (Adaeze Okafor)
   ============================================================ */

const ClientApp = (() => {
  "use strict";

  const page = document.body.dataset.page;
  const CLIENT_ID = "CL-1001";

  const me = () => DB.getClient(CLIENT_ID);
  const myDocs = () => DB.docsOfClient(CLIENT_ID);
  const myInvoices = () => DB.invoicesOfClient(CLIENT_ID);
  const invoiceTotal = (inv) => inv.items.reduce((s, i) => s + i.amount, 0);

  /* ================= DASHBOARD ================= */
  const renderDashboard = () => {
    const c = me();
    const docs = myDocs();
    const renewals = docs.slice().sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const openInv = myInvoices().filter((i) => i.status !== "Paid");
    const openTotal = openInv.reduce((s, i) => s + invoiceTotal(i), 0);

    App.renderInto("#clientGreeting", `
      <div class="spread">
        <div>
          <div class="topbar-title" style="font-size:22px">Hello, ${App.esc(c.name.split(" ")[0])} 👋</div>
          <div class="muted small">Account ${App.esc(c.account)} · ${docs.length} active document${docs.length === 1 ? "" : "s"}</div>
        </div>
        <div class="row">
          <a class="btn btn-primary" href="track.html">📍 Track my documents</a>
          <a class="btn btn-secondary" href="invoices.html">💳 Make payment</a>
        </div>
      </div>`);

    App.renderInto("#clientStats", [
      { label: "Active Documents", value: docs.length, icon: "📄", tint: "tint-indigo", meta: "insurance · licence · roadworthiness" },
      { label: "Due Soon", value: renewals.filter((d) => App.daysUntil(d.expiryDate) >= 0 && App.daysUntil(d.expiryDate) <= 30).length, icon: "⏰", tint: "tint-amber", meta: "renew within 30 days" },
      { label: "Out for Delivery", value: docs.filter((d) => ["Out For Delivery", "Delivered"].includes(d.status)).length, icon: "🛵", tint: "tint-violet", meta: "with a rider now" },
      { label: "Open Invoices", value: App.money(openTotal), icon: "🧾", tint: "tint-red", meta: `${openInv.length} unpaid` },
    ].map((t) => `
      <div class="stat-tile ${t.tint}">
        <div class="stat-icon">${t.icon}</div>
        <div class="stat-label">${t.label}</div>
        <div class="stat-value">${t.value}</div>
        <div class="stat-meta">${t.meta}</div>
      </div>`).join(""));

    App.renderInto("#myDocsList", docs.length
      ? docs.map((d) => {
          const days = App.daysUntil(d.expiryDate);
          return `<li>
            <div>
              <div class="cell-main">${App.esc(d.type)}</div>
              <div class="cell-sub mono">${App.esc(d.number)}</div>
            </div>
            <div class="row">
              ${App.badge(d.status)}
              ${App.renewalBadge(d.expiryDate)}
              <a class="btn btn-secondary btn-sm" href="track.html">Track</a>
            </div>
          </li>`;
        }).join("")
      : `<li class="muted">No documents yet — contact the office to add your first document.</li>`);

    App.renderInto("#renewalCountdown", renewals.length
      ? renewals.slice(0, 4).map((d) => {
          const days = App.daysUntil(d.expiryDate);
          const cls = days < 0 ? "red" : days <= 30 ? "amber" : "green";
          const pctLeft = Math.max(0, Math.min(100, Math.round(((days + 365) / 365) * 100)));
          return `<div class="mb-16">
            <div class="spread mb-8">
              <span class="small strong">${App.esc(d.type)}</span>
              <span class="small ${days < 0 ? "" : "muted"}" style="${days < 0 ? "color:var(--danger);font-weight:700" : ""}">
                ${days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? "Expires today" : `${days} days left`}
              </span>
            </div>
            <div class="progress"><div class="bar ${cls}" style="width:${pctLeft}%"></div></div>
            <div class="small muted mt-4">Expires ${App.fmtDate(d.expiryDate)}</div>
          </div>`;
        }).join("")
      : `<p class="muted small">No documents to track yet.</p>`);

    App.renderInto("#clientActivity", (() => {
      const events = [];
      docs.forEach((d) => d.history.forEach((h) => events.push({ at: h.at, note: `${d.type} · ${h.status}`, docId: d.id })));
      events.sort((a, b) => new Date(b.at) - new Date(a.at));
      return events.slice(0, 6).map((e) => `
        <li>
          <div><div class="cell-main">${App.esc(e.note)}</div><div class="cell-sub">${App.fmtDateTime(e.at)}</div></div>
          <a class="btn btn-ghost btn-sm" href="track.html">View</a>
        </li>`).join("");
    })());
  };

  /* ================= TRACK ================= */
  const renderTrack = () => {
    const docs = myDocs();
    App.renderInto("#trackDocs", docs.length
      ? docs.map((d, i) => `
        <button class="tab-btn ${i === 0 ? "active" : ""}" data-track="${d.id}">${App.esc(d.type)}</button>`).join("")
      : `<span class="muted small">No documents to track.</span>`);

    const showDoc = (docId) => {
      const d = DB.getDoc(docId);
      if (!d) return;
      App.qsa("[data-track]").forEach((b) => b.classList.toggle("active", b.dataset.track === docId));

      const c = me();
      App.renderInto("#trackDetail", `
        <div class="card">
          <div class="card-header spread">
            <div>
              <h2>${App.esc(d.type)} · ${App.esc(d.number)}</h2>
              <div class="sub">Issued ${App.fmtDate(d.issueDate)} · Expires ${App.fmtDate(d.expiryDate)}</div>
            </div>
            ${App.badge(d.status)}
          </div>
          <div class="card-body">
            <div class="form-label">Delivery pipeline</div>
            <div class="mb-24">${App.pipeline(d.status)}</div>

            <div class="form-label">History</div>
            <div class="timeline">
              ${d.history.slice().reverse().map((h, idx) => `
                <div class="timeline-item ${idx === 0 ? "current" : "done"}">
                  <div class="t-title">${App.esc(h.status)}</div>
                  <div class="t-meta">${App.fmtDateTime(h.at)}</div>
                  ${h.note ? `<div class="t-note">${App.esc(h.note)}</div>` : ""}
                </div>`).join("")}
              ${d.milestones.map((m) => `
                <div class="timeline-item done">
                  <div class="t-title">◆ ${App.esc(m.type)}</div>
                  <div class="t-meta">${App.fmtDateTime(m.at)} · by ${App.esc(m.by)}</div>
                </div>`).join("")}
            </div>

            ${d.batchId ? `<div class="banner banner-info mt-16"><span class="b-icon">🚚</span><div>Currently assigned to batch <strong>${App.esc(DB.getBatch(d.batchId)?.name || d.batchId)}</strong>.</div></div>` : ""}
          </div>
        </div>`);

      void c;
    };

    App.qsa("[data-track]").forEach((b) => b.addEventListener("click", () => showDoc(b.dataset.track)));
    if (docs.length) showDoc(docs[0].id);
    else App.renderInto("#trackDetail", App.emptyState("📍", "Nothing to track", "Add a document with the office to start tracking."));
  };

  /* ================= INVOICES ================= */
  const renderInvoices = () => {
    const invs = myInvoices();
    const open = invs.filter((i) => i.status !== "Paid");

    App.renderInto("#invoiceSummary", [
      { label: "Total Invoices", value: invs.length, icon: "🧾", tint: "tint-indigo", meta: "all time" },
      { label: "Open Balance", value: App.money(open.reduce((s, i) => s + invoiceTotal(i), 0)), icon: "⏳", tint: "tint-amber", meta: `${open.length} unpaid` },
      { label: "Paid", value: invs.filter((i) => i.status === "Paid").length, icon: "✅", tint: "tint-green", meta: "fully settled" },
      { label: "Overdue", value: invs.filter((i) => i.status === "Overdue").length, icon: "⚠️", tint: "tint-red", meta: "past due date" },
    ].map((t) => `
      <div class="stat-tile ${t.tint}">
        <div class="stat-icon">${t.icon}</div>
        <div class="stat-label">${t.label}</div>
        <div class="stat-value">${t.value}</div>
        <div class="stat-meta">${t.meta}</div>
      </div>`).join(""));

    App.renderInto("#invoiceList", invs.length
      ? invs.map((inv) => {
          const total = invoiceTotal(inv);
          const paid = inv.status === "Paid";
          return `<div class="card mb-16">
            <div class="card-header spread">
              <div>
                <h2>${App.esc(inv.number)}</h2>
                <div class="sub">Issued ${App.fmtDate(inv.date)} · Due ${App.fmtDate(inv.dueDate)}</div>
              </div>
              <div class="row">
                ${App.badge(inv.status)}
                <span class="strong">${App.money(total)}</span>
                ${paid
                  ? `<span class="badge badge-paid no-dot">Paid ✓</span>`
                  : `<button class="btn btn-primary btn-sm" data-pay="${inv.id}">💳 Make payment</button>`}
              </div>
            </div>
            <div class="card-body tight">
              <div class="table-wrap"><table class="table">
                <thead><tr><th>Payment item</th><th class="text-right">Amount</th></tr></thead>
                <tbody>
                  ${inv.items.map((it) => `<tr><td>${App.esc(it.desc)}</td><td class="text-right">${App.money(it.amount)}</td></tr>`).join("")}
                </tbody>
              </table></div>
            </div>
            <div class="card-footer spread">
              <span class="small muted">${inv.status === "Overdue" ? "⚠️ Past due — settle to avoid delivery holds." : paid ? "Receipt issued." : `Due ${App.fmtDate(inv.dueDate)}`}</span>
              <span class="strong">Total: ${App.money(total)}</span>
            </div>
          </div>`;
        }).join("")
      : App.emptyState("🧾", "No invoices", "Your invoices and payment items will appear here."));
  };

  const openPayment = (invId) => {
    const inv = DB.getInvoice(invId);
    if (!inv) return;
    const total = invoiceTotal(inv);
    App.renderInto("#paySummary", `
      <div class="pay-summary">
        <div class="spread mb-8"><span class="strong">${App.esc(inv.number)}</span>${App.badge(inv.status)}</div>
        ${inv.items.map((it) => `<div class="pay-line"><span>${App.esc(it.desc)}</span><span>${App.money(it.amount)}</span></div>`).join("")}
        <div class="pay-line total"><span>Amount due</span><span>${App.money(total)}</span></div>
      </div>`);
    const form = App.qs("#payForm");
    App.resetForm(form);
    form.dataset.invoice = invId;
    const amount = form.querySelector('[name="payAmount"]');
    if (amount) { amount.value = total.toFixed(2); amount.readOnly = false; }
    App.openModal("payModal");
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const form = App.qs("#payForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    const invId = form.dataset.invoice;
    await App.fakeSave(900);
    DB.payInvoice(invId, parseFloat(v.payAmount));
    App.closeModal("payModal");
    App.toast("Payment successful", `${App.money(v.payAmount)} received. Invoice marked as Paid.`, "success");
    renderInvoices();
  };

  const bindInvoices = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pay]");
      if (btn) openPayment(btn.dataset.pay);
    });
  };

  /* ================= PROFILE ================= */
  const renderProfile = () => {
    const c = me();
    const form = App.qs("#profileForm");
    if (!form) return;
    const set = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = val || "";
    };
    set("pfName", c.name);
    set("pfEmail", c.email);
    set("pfPhone", c.phone);
    set("pfAltPhone", c.altPhone);
    set("pfAddress", c.address);
    set("pfCity", c.city);
    set("pfState", c.state);
    set("pfAccount", c.account);
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    const form = App.qs("#profileForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    const c = me();
    await App.fakeSave(600);
    Object.assign(c, {
      name: v.pfName, email: v.pfEmail, phone: v.pfPhone,
      altPhone: v.pfAltPhone, address: v.pfAddress, city: v.pfCity, state: v.pfState,
    });
    App.toast("Profile updated", "Your address and contact details have been saved.");
    renderProfile();
  };

  /* ---------------- init by page ---------------- */
  const init = () => {
    if (page === "dashboard") renderDashboard();
    else if (page === "track") renderTrack();
    else if (page === "invoices") { renderInvoices(); bindInvoices(); }
    else if (page === "profile") { renderProfile(); }
  };

  document.addEventListener("DOMContentLoaded", init);

  return { submitPayment, submitProfile };
})();