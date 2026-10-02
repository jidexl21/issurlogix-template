/* ============================================================
   LOGISTICS UI — Admin portal logic
   ============================================================ */

const Admin = (() => {
  "use strict";

  const page = document.body.dataset.page;

  /* ---------------- helpers ---------------- */
  const clientName = (id) => DB.getClient(id)?.name || "Unknown client";
  const riderName = (id) => DB.getRider(id)?.name || "Unassigned";

  /* ================= DASHBOARD ================= */
  const renderDashboard = () => {
    const s = DB.stats();
    const tiles = [
      { label: "Documents In Processing", value: s.inProcessing, icon: "📄", tint: "tint-indigo", meta: `${DB.documents.length} total documents` },
      { label: "Out For Delivery", value: s.outForDelivery, icon: "🛵", tint: "tint-violet", meta: "currently with riders" },
      { label: "Upcoming Renewals", value: s.dueSoon, icon: "🔄", tint: "tint-amber", meta: "due within 30 days" },
      { label: "Delivered (30d)", value: s.delivered, icon: "✅", tint: "tint-green", meta: "delivered + accepted" },
      { label: "Overdue Renewals", value: s.overdue, icon: "⚠️", tint: "tint-red", meta: "expired documents" },
      { label: "Unpaid Value", value: App.money(s.unpaid), icon: "💰", tint: "tint-amber", meta: `${DB.invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue").length} open invoices` },
    ];

    App.renderInto("#statsGrid", tiles.map((t) => `
      <div class="stat-tile ${t.tint}">
        <div class="stat-icon">${t.icon}</div>
        <div class="stat-label">${t.label}</div>
        <div class="stat-value">${t.value}</div>
        <div class="stat-meta">${t.meta}</div>
      </div>`).join(""));

    // pipeline bar
    const counts = DB.statusCounts();
    const totalDocs = DB.documents.length || 1;
    const stages = [
      ["Processing", "bar", counts.Processing],
      ["Awaiting Delivery", "amber", counts["Awaiting Delivery"]],
      ["Out For Delivery", "bar", counts["Out For Delivery"]],
      ["Delivered + Accepted", "green", counts.Delivered + counts["Accepted by Client"]],
      ["Returned", "red", counts.Returned],
    ];
    App.renderInto("#pipelineMini", stages.map(([label, bar, n]) => {
      const pct = Math.round((n / totalDocs) * 100);
      return `
        <div class="mb-16">
          <div class="spread mb-8"><span class="small strong">${label}</span><span class="small muted">${n} docs · ${pct}%</span></div>
          <div class="progress"><div class="bar ${bar === "amber" ? "amber" : bar === "green" ? "green" : bar === "red" ? "red" : ""}" style="width:${pct}%"></div></div>
        </div>`;
    }).join(""));

    // upcoming renewals (top 5)
    App.renderInto("#dashRenewals", (() => {
      const rows = DB.renewals().filter((d) => d.daysLeft >= 0).slice(0, 5);
      if (!rows.length) return App.emptyState("🎉", "No upcoming renewals", "All client documents are up to date.");
      return `<div class="table-wrap"><table class="table"><thead><tr><th>Client</th><th>Document</th><th>Expiry</th><th>Status</th></tr></thead><tbody>
        ${rows.map((d) => `
          <tr>
            <td><div class="cell-main">${App.esc(clientName(d.clientId))}</div><div class="cell-sub">${d.id}</div></td>
            <td>${App.esc(d.type)} · ${App.esc(d.number)}</td>
            <td><div class="cell-main">${App.fmtDate(d.expiryDate)}</div><div class="cell-sub">${d.daysLeft === 0 ? "Today" : `in ${d.daysLeft} days`}</div></td>
            <td>${App.renewalBadge(d.expiryDate)}</td>
          </tr>`).join("")}
      </tbody></table></div>`;
    })());

    // recent activity
    App.renderInto("#dashActivity", (() => {
      const feed = DB.activity();
      if (!feed.length) return App.emptyState("🗒️", "No activity yet", "Events will appear here as documents move.");
      return `<ul class="list-plain">${feed.map((f) => {
        const meta = App.STATUS_META[f.status] || { cls: "badge-neutral" };
        const dot = f.type === "doc" ? "green" : f.type === "invoice" ? "amber" : "indigo";
        return `<li>
          <div class="activity-item">
            <div class="activity-dot ${dot}">${f.type === "doc" ? "📄" : f.type === "invoice" ? "🧾" : "🚚"}</div>
            <div class="activity-body">
              <div class="a-title"><strong>${App.esc(clientName(f.clientId) || f.note.split("—")[0])}</strong> — ${App.esc(f.note)} <span class="badge no-dot ${meta.cls}">${App.esc(f.status)}</span></div>
              <div class="a-time">${App.fmtDateTime(f.at)}</div>
            </div>
          </div>
        </li>`;
      }).join("")}</ul>`;
    })());
  };

  /* ================= RENEWALS ================= */
  const renderRenewals = () => {
    const typeFilter = App.qs("#fType")?.value || "all";
    const statusFilter = App.qs("#fStatus")?.value || "all";
    const q = (App.qs("#fSearch")?.value || "").toLowerCase();

    const rows = DB.renewals().filter((d) => {
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      const st = d.daysLeft < 0 ? "Expired" : d.daysLeft <= 30 ? "Due Soon" : "Upcoming";
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (q && !(clientName(d.clientId) + d.number + d.type).toLowerCase().includes(q)) return false;
      return true;
    });

    const rowHtml = (d) => {
      const st = d.daysLeft < 0 ? "Expired" : d.daysLeft <= 30 ? "Due Soon" : "Upcoming";
      const reminder = DB.reminders.find((r) => r.docId === d.id);
      return `<tr>
        <td><div class="cell-main">${App.esc(clientName(d.clientId))}</div><div class="cell-sub">${d.id} · ${App.esc(DB.getClient(d.clientId)?.account || "")}</div></td>
        <td>${App.esc(d.type)}</td>
        <td class="mono">${App.esc(d.number)}</td>
        <td><div class="cell-main">${App.fmtDate(d.issueDate)}</div></td>
        <td><div class="cell-main">${App.fmtDate(d.expiryDate)}</div><div class="cell-sub">${d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : d.daysLeft === 0 ? "Due today" : `${d.daysLeft}d remaining`}</div></td>
        <td>${App.renewalBadge(d.expiryDate)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-soft btn-sm" data-remind="${d.id}">🔔 Remind</button>
            <button class="btn btn-secondary btn-sm" data-open-renew="${d.id}">✏️ Renew</button>
          </div>
        </td>
      </tr>`;
    };

    App.renderInto("#renewalsTable", rows.length
      ? `<table class="table"><thead><tr><th>Client</th><th>Type</th><th>Doc No.</th><th>Issued</th><th>Expires</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
         <tbody>${rows.map(rowHtml).join("")}</tbody></table>`
      : App.emptyState("🔍", "No renewals found", "Try adjusting the filters or search term."));

    App.renderInto("#renewalCount", `${rows.length} renewal${rows.length === 1 ? "" : "s"}`);
  };

  const bindRenewals = () => {
    ["fType", "fStatus"].forEach((id) => {
      const el = App.qs(`#${id}`);
      if (el) el.addEventListener("change", renderRenewals);
    });
    const search = App.qs("#fSearch");
    if (search) search.addEventListener("input", renderRenewals);

    document.addEventListener("click", (e) => {
      const remindBtn = e.target.closest("[data-remind]");
      if (remindBtn) {
        const docId = remindBtn.dataset.remind;
        const d = DB.getDoc(docId);
        App.openModal("reminderModal");
        const name = App.qs(`#modal-reminderDoc`);
        if (name) name.value = `${d.type} · ${d.number} · ${clientName(d.clientId)}`;
        return;
      }
      const renewBtn = e.target.closest("[data-open-renew]");
      if (renewBtn) {
        e.preventDefault();
        const d = DB.getDoc(renewBtn.dataset.openRenew);
        App.openModal("renewalModal");
        const form = App.qs("#renewalForm");
        App.resetForm(form);
        const c = DB.getClient(d.clientId);
        const select = form.querySelector('[name="renewalClient"]');
        if (select) select.value = c.id;
        const type = form.querySelector('[name="renewalType"]');
        if (type) type.value = d.type;
      }
    });
  };

  const sendReminder = async (e) => {
    e.preventDefault();
    const docId = App.qs("#reminderDoc")?.value || "";
    const channel = App.qs("#reminderChannel")?.value || "WhatsApp";
    const d = DB.getDoc(docId);
    const c = DB.getClient(d?.clientId);
    const target = channel === "WhatsApp" ? c?.phone : channel === "Email" ? c?.email : c?.phone;
    await App.fakeSave();
    const rem = DB.reminders.find((r) => r.docId === docId);
    if (rem) DB.issueReminder(rem.id, channel);
    App.closeModal("reminderModal");
    App.toast("Reminder sent", `${channel} reminder sent to ${target || "client"} for ${d?.type}.`, "success");
    renderRenewals();
  };

  const submitRenewal = async (e) => {
    e.preventDefault();
    const form = App.qs("#renewalForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    const issue = v.renewalIssueDate;
    const exp = v.renewalExpiryDate;
    if (new Date(exp) <= new Date(issue)) {
      App.toast("Invalid dates", "Expiry date must be after the issue date.", "error");
      return;
    }
    const wasRenew = !!v.renewalOriginalId;
    await App.fakeSave();
    if (wasRenew) {
      const d = DB.getDoc(v.renewalOriginalId);
      if (d) {
        d.issueDate = issue;
        d.expiryDate = exp;
        d.number = v.renewalNumber;
        d.status = "Processing";
        d.history.push({ status: "Processing", at: new Date().toISOString(), note: "Document renewed — new dates recorded." });
      }
    } else {
      DB.addDocument({
        clientId: v.renewalClient, type: v.renewalType, number: v.renewalNumber,
        issueDate: issue, expiryDate: exp, policy: "",
      });
    }
    App.closeModal("renewalModal");
    App.toast(wasRenew ? "Renewal recorded" : "Renewal added", `Expiry set to ${App.fmtDate(exp)}.`, "success");
    renderRenewals();
  };

  /* ================= DOCUMENTS ================= */
  const renderDocuments = () => {
    const q = (App.qs("#dSearch")?.value || "").toLowerCase();
    const typeF = App.qs("#dType")?.value || "all";
    const statusF = App.qs("#dStatus")?.value || "all";

    const rows = DB.documents.filter((d) => {
      if (typeF !== "all" && d.type !== typeF) return false;
      if (statusF !== "all" && d.status !== statusF) return false;
      if (q && !(clientName(d.clientId) + d.number + d.id + d.type).toLowerCase().includes(q)) return false;
      return true;
    });

    const rowHtml = (d) => {
      const batch = d.batchId ? DB.getBatch(d.batchId) : null;
      return `<tr>
        <td><div class="cell-main">${App.esc(clientName(d.clientId))}</div><div class="cell-sub">${d.id}</div></td>
        <td>${App.esc(d.type)}</td>
        <td class="mono">${App.esc(d.number)}</td>
        <td style="min-width:240px">${App.pipeline(d.status)}</td>
        <td><span class="mono small">${d.batchId ? App.esc(batch?.name || d.batchId) : "—"}</span></td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" data-doc-detail="${d.id}">👁 View</button>
            ${App.nextStatus(d.status) ? `<button class="btn btn-primary btn-sm" data-advance="${d.id}">${d.status === "Returned" ? "Reprocess" : "Advance"}</button>` : ""}
            ${d.status !== "Returned" && d.status !== "Accepted by Client" ? `<button class="btn btn-ghost btn-sm" data-return="${d.id}">↩ Return</button>` : ""}
          </div>
        </td>
      </tr>`;
    };

    App.renderInto("#documentsTable", rows.length
      ? `<table class="table"><thead><tr><th>Client</th><th>Type</th><th>Doc No.</th><th>Status Pipeline</th><th>Batch</th><th class="text-right">Actions</th></tr></thead>
         <tbody>${rows.map(rowHtml).join("")}</tbody></table>`
      : App.emptyState("📄", "No documents found", "Try adjusting the filters or search term."));

    App.renderInto("#docCount", `${rows.length} document${rows.length === 1 ? "" : "s"}`);
  };

  const timelineHtml = (d) => {
    const stages = App.PIPELINE.map((s, i) => {
      const hit = d.history.filter((h) => h.status === s);
      const entry = hit[hit.length - 1];
      const isCurrent = d.status === s;
      const isDone = !isCurrent && d.history.some((h) => h.status === s);
      const cls = d.status === "Returned" && !entry ? (i === 0 ? "current" : "") : isCurrent ? "current" : isDone ? "done" : "";
      return `<div class="timeline-item ${cls}">
        <div class="t-title">${s}</div>
        ${entry ? `<div class="t-meta">${App.fmtDateTime(entry.at)}${entry.note ? ` · ${App.esc(entry.note)}` : ""}</div>` : `<div class="t-meta">Not reached</div>`}
      </div>`;
    }).join("");

    const returned = d.history.filter((h) => h.status === "Returned").pop();
    const milestones = d.milestones.map((m) => `
      <div class="timeline-item done">
        <div class="t-title">◆ ${App.esc(m.type)}</div>
        <div class="t-meta">${App.fmtDateTime(m.at)} · by ${App.esc(m.by)}</div>
      </div>`).join("");

    return [stages, returned ? `
      <div class="timeline-item error">
        <div class="t-title">Returned</div>
        <div class="t-meta">${App.fmtDateTime(returned.at)}${returned.note ? ` · ${App.esc(returned.note)}` : ""}</div>
      </div>` : "", milestones].join("");
  };

  const openDetail = (id) => {
    const d = DB.getDoc(id);
    if (!d) return;
    const c = DB.getClient(d.clientId);
    App.renderInto("#docDetailInfo", `
      <div class="grid-2">
        <div>
          <div class="form-label">Client</div>
          <div class="strong">${App.esc(c.name)}</div>
          <div class="small muted">${App.esc(c.phone)} · ${App.esc(c.email)}</div>
          <div class="small muted">${App.esc(c.address)}, ${App.esc(c.city)}, ${App.esc(c.state)}</div>
        </div>
        <div>
          <div class="form-label">Document</div>
          <div class="strong">${App.esc(d.type)} · ${App.esc(d.number)}</div>
          <div class="small muted">Issued ${App.fmtDate(d.issueDate)}</div>
          <div class="small muted">Expires ${App.fmtDate(d.expiryDate)}</div>
          ${d.policy ? `<div class="small muted">${App.esc(d.policy)}</div>` : ""}
        </div>
      </div>
      <div class="divider"></div>
      <div class="form-label">Current status</div>
      <div class="mb-16">${App.badge(d.status)} ${d.batchId ? `<span class="badge badge-neutral">Batch ${App.esc(DB.getBatch(d.batchId)?.name || d.batchId)}</span>` : ""}</div>
      <div class="form-label">Status timeline</div>
      <div class="timeline">${timelineHtml(d)}</div>`);
    App.openModal("docDetailModal");
  };

  const bindDocuments = () => {
    ["dType", "dStatus"].forEach((id) => {
      const el = App.qs(`#${id}`);
      if (el) el.addEventListener("change", renderDocuments);
    });
    const search = App.qs("#dSearch");
    if (search) search.addEventListener("input", renderDocuments);

    document.addEventListener("click", (e) => {
      const detail = e.target.closest("[data-doc-detail]");
      if (detail) { openDetail(detail.dataset.docDetail); return; }

      const adv = e.target.closest("[data-advance]");
      if (adv) {
        const d = DB.advanceDoc(adv.dataset.advance);
        if (d) {
          App.toast("Status advanced", `${d.number} is now "${d.status}".`, "success");
          renderDocuments();
        }
        return;
      }
      const ret = e.target.closest("[data-return]");
      if (ret) {
        const d = DB.markReturned(ret.dataset.return, "Returned to office for re-dispatch.");
        if (d) {
          App.toast("Document returned", `${d.number} marked as returned.`, "info");
          renderDocuments();
        }
      }
    });
  };

  /* ================= OPERATIONS ================= */
  const renderReminders = () => {
    const rows = DB.reminders;
    App.renderInto("#remindersTable", rows.length
      ? `<table class="table"><thead><tr><th>Client</th><th>Document</th><th>Type</th><th>Channel</th><th>When / Last Sent</th><th>Status</th><th class="text-right">Actions</th></tr></thead><tbody>
        ${rows.map((r) => {
          const c = DB.getClient(r.clientId);
          return `<tr>
            <td><div class="cell-main">${App.esc(c?.name || "")}</div><div class="cell-sub">${App.esc(c?.account || "")}</div></td>
            <td>${App.esc(r.type)}</td>
            <td>${App.esc(r.docId)}</td>
            <td>${App.esc(r.channel)}</td>
            <td>${App.fmtDate(r.at)}</td>
            <td>${App.badge(r.status)}</td>
            <td><div class="actions">${r.status === "Scheduled" ? `<button class="btn btn-primary btn-sm" data-send-reminder="${r.id}">Send now</button>` : `<span class="small muted">Sent</span>`}</div></td>
          </tr>`;
        }).join("")}
      </tbody></table>`
      : App.emptyState("🔔", "No reminders scheduled", "Reminders for upcoming renewals will appear here."));
  };

  const setupCreateBatch = () => {
    const fill = () => {
      const list = DB.documents.filter((d) => ["Awaiting Delivery", "Out For Delivery", "Returned"].includes(d.status));
      const html = list.length
        ? list.map((d) => `
          <label class="select-item" for="pick-${d.id}">
            <input type="checkbox" id="pick-${d.id}" name="batchDocs" value="${d.id}">
            <div class="si-main">
              <div class="si-title">${App.esc(d.type)} · ${App.esc(d.number)}</div>
              <div class="si-sub">${App.esc(clientName(d.clientId))} · ${App.badge(d.status)}</div>
            </div>
          </label>`).join("")
        : App.emptyState("📦", "No documents ready", "Documents that are Awaiting Delivery or Out For Delivery can be batched.");
      App.renderInto("#batchDocList", html);
      App.renderInto("#batchCount", `${list.length} available`);
      updateSummary();
    };

    const updateSummary = () => {
      const form = App.qs("#createBatchForm");
      const checked = App.qsa('input[name="batchDocs"]:checked', form);
      App.renderInto("#batchSelectedSummary",
        checked.length ? `<div class="selected-summary">${checked.length} document${checked.length > 1 ? "s" : ""} selected for this batch</div>` : "");
    };

    const listEl = App.qs("#batchDocList");
    if (listEl) listEl.addEventListener("change", updateSummary);
    fill();
  };

  const submitCreateBatch = async (e) => {
    e.preventDefault();
    const form = App.qs("#createBatchForm");
    if (!App.requireFields(form)) return;
    const checked = App.qsa('input[name="batchDocs"]:checked', form).map((i) => i.value);
    if (!checked.length) {
      App.toast("Select documents", "Choose at least one document for the batch.", "error");
      return;
    }
    const v = App.formValues(form);
    await App.fakeSave();
    const b = DB.createBatch(v.batchName, v.batchRider || null, checked, v.batchVehicle || "Unassigned");
    App.closeModal("createBatchModal");
    App.toast("Batch created", `${b.name} (${b.id}) created with ${checked.length} document(s).`, "success");
    renderBatches();
  };

  const renderBatches = () => {
    App.renderInto("#batchesList", DB.batches.map((b) => {
      const rider = DB.getRider(b.riderId);
      const items = DB.docsOfBatch(b.id);
      const perStatus = (st) => items.filter((d) => d.status === st).length;
      return `<div class="card mb-16" id="batch-${b.id}">
        <div class="card-header spread">
          <div>
            <h2>${App.esc(b.name)} · <span class="mono">${b.id}</span></h2>
            <div class="sub">Created ${App.fmtDate(b.createdAt)} · ${items.length} item(s) · ${rider ? App.esc(rider.name) : "No rider assigned"}</div>
          </div>
          <div class="row">
            ${App.badge(b.status)}
            <button class="btn btn-secondary btn-sm" data-toggle-waybill="${b.id}">🧾 Waybill</button>
            <button class="btn btn-primary btn-sm" data-start-pickup="${b.id}" ${b.status !== "Awaiting Pickup" ? "disabled" : ""}>📍 Pickup</button>
          </div>
        </div>
        <div class="card-body tight" data-waybill-body="${b.id}" hidden>
          ${items.length ? `
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Client</th><th>Document</th><th>Number</th><th>Item Status</th><th>Rider Confirmation</th></tr></thead>
            <tbody>${items.map((d) => `
              <tr>
                <td><div class="cell-main">${App.esc(clientName(d.clientId))}</div><div class="cell-sub">${App.esc(DB.getClient(d.clientId)?.address)}, ${App.esc(DB.getClient(d.clientId)?.city)}</div></td>
                <td>${App.esc(d.type)}</td>
                <td class="mono">${App.esc(d.number)}</td>
                <td>${App.badge(d.status)}</td>
                <td class="small muted">${d.milestones.length ? App.fmtDateTime(d.milestones[d.milestones.length - 1].at) : "—"}</td>
              </tr>`).join("")}</tbody>
          </table></div>`
          : App.emptyState("📦", "No items in this batch", "Add documents to this batch.")}
        </div>
      </div>`;
    }).join(""));
  };

  const bindBatches = () => {
    document.addEventListener("click", (e) => {
      const wb = e.target.closest("[data-toggle-waybill]");
      if (wb) {
        const body = App.qs(`[data-waybill-body="${wb.dataset.toggleWaybill}"]`);
        if (body) body.hidden = !body.hidden;
        return;
      }
      const pk = e.target.closest("[data-start-pickup]");
      if (pk) {
        const b = DB.getBatch(pk.dataset.startPickup);
        const ref = App.qs("#pickupBatchRef");
        if (ref) ref.value = b.id;
        App.renderInto("#pickupBatchInfo", `
          <div class="form-label">Batch</div>
          <div class="strong">${App.esc(b.name)} (${b.id})</div>
          <div class="small muted mb-16">${DB.docsOfBatch(b.id).length} item(s) · ${clientName(DB.docsOfBatch(b.id)[0]?.clientId)} and others · Rider ${riderName(b.riderId)}</div>
          ${DB.docsOfBatch(b.id).map((d) => `<div class="select-item" style="cursor:default">
            <div class="si-main"><div class="si-title">${App.esc(d.type)} · ${App.esc(d.number)}</div><div class="si-sub">${App.esc(clientName(d.clientId))} · ${App.badge(d.status)}</div></div>
          </div>`).join("")}`);
        App.openModal("pickupModal");
      }
    });
  };

  const submitPickup = async (e) => {
    e.preventDefault();
    const name = App.qs("#pickupConfirmer")?.value || "";
    if (!name.trim()) {
      App.toast("Missing name", "Enter the name of the person confirming the pickup.", "error");
      return;
    }
    const b = DB.batches.find((x) => x.status === "Awaiting Pickup");
    const batch = DB.batches.find((x) => x.id === App.qs("#pickupBatchRef")?.value);
    const target = batch || b;
    if (!target) { App.closeModal("pickupModal"); return; }
    target.status = "In Transit";
    DB.docsOfBatch(target.id).forEach((d) => {
      if (d.status === "Awaiting Delivery") {
        d.status = "Out For Delivery";
        d.history.push({ status: "Out For Delivery", at: new Date().toISOString(), note: "Batch picked up — out for delivery." });
      }
    });
    await App.fakeSave();
    App.closeModal("pickupModal");
    App.toast("Pickup confirmed", `${batch.name} is now In Transit. Items marked Out For Delivery.`);
    renderBatches();
  };

  /* ================= RIDERS ================= */
  const renderRiders = () => {
    const rows = DB.riders;
    App.renderInto("#ridersTable", rows
      ? `<table class="table"><thead><tr><th>Rider</th><th>Contact</th><th>Vehicle</th><th>Active Batches</th><th>Status</th><th class="text-right">Actions</th></tr></thead><tbody>
        ${rows.map((r) => {
          const active = DB.activeBatchesOfRider(r.id);
          const vehicle = active[0]?.vehicle || "—";
          return `<tr>
            <td><div class="cell-main">${App.esc(r.name)}</div><div class="cell-sub">${r.id} · ${App.esc(r.regNo)}</div></td>
            <td>${App.esc(r.phone)}<br><span class="small muted">${App.esc(r.email)}</span></td>
            <td>${App.esc(vehicle)}</td>
            <td>${active.length ? `<span class="badge badge-primary no-dot">${active.length} active</span>` : `<span class="small muted">None</span>`}</td>
            <td>${App.badge(r.status === "Active" ? "Active" : "Inactive")}</td>
            <td><div class="actions"><button class="btn btn-secondary btn-sm" data-rider-contents="${r.id}">🧾 Rider Contents</button></div></td>
          </tr>`;
        }).join("")}
      </tbody></table>`
      : App.emptyState("🛵", "No riders", "Add your first rider to get started."));
  };

  const openRiderContents = (rid) => {
    const r = DB.getRider(rid);
    if (!r) return;
    const batches = DB.batches.filter((b) => b.riderId === rid);
    App.renderInto("#riderContentsBody", batches.length
      ? batches.map((b) => `
        <div class="mb-16">
          <div class="spread mb-8">
            <div><strong>${App.esc(b.name)}</strong> <span class="mono small muted">${b.id}</span></div>
            ${App.badge(b.status)}
          </div>
          ${DB.docsOfBatch(b.id).length
            ? `<div class="chip-list">${DB.docsOfBatch(b.id).map((d) => `<span class="badge badge-neutral no-dot">${App.esc(d.type)} · ${App.esc(d.number)}</span>`).join("")}</div>`
            : `<span class="small muted">No documents assigned.</span>`}
        </div>`).join("")
      : `<div class="empty-state"><div class="es-icon">🧾</div><h3>No batch assigned</h3><p>${App.esc(r.name)} has no delivery batches at the moment.</p></div>`);
    App.renderInto("#riderContentsTitle", `Rider contents — ${App.esc(r.name)}`);
    App.openModal("riderContentsModal");
  };

  const bindRiders = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rider-contents]");
      if (btn) openRiderContents(btn.dataset.riderContents);
    });
  };

  const submitAddRider = async (e) => {
    e.preventDefault();
    const form = App.qs("#addRiderForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    await App.fakeSave();
    const id = DB.addRider({ name: v.riderName, phone: v.riderPhone, email: v.riderEmail, status: "Active", regNo: v.riderReg || "RC-000", batchId: null });
    App.closeModal("addRiderModal");
    App.toast("Rider added", `${v.riderName} (${id}) added successfully.`);
    renderRiders();
  };

  /* ================= CLIENTS ================= */
  const renderClients = () => {
    const q = (App.qs("#cSearch")?.value || "").toLowerCase();
    const rows = DB.clients.filter((c) => !q || (c.name + c.email + c.phone + c.account + c.city).toLowerCase().includes(q));
    App.renderInto("#clientCount",
      `${rows.length} client${rows.length === 1 ? "" : "s"} · ${DB.clients.length} total`);
    App.renderInto("#clientsTable", rows
      ? `<table class="table"><thead><tr><th>Client</th><th>Contact</th><th>Address</th><th>Documents</th><th>Open Invoices</th><th class="text-right">Actions</th></tr></thead><tbody>
        ${rows.map((c) => {
          const docs = DB.docsOfClient(c.id);
          const open = DB.invoicesOfClient(c.id).filter((i) => i.status === "Unpaid" || i.status === "Overdue").length;
          return `<tr>
            <td><div class="cell-main">${App.esc(c.name)}</div><div class="cell-sub">${c.id} · ${App.esc(c.account)}</div></td>
            <td>${App.esc(c.phone)}<br><span class="small muted">${App.esc(c.email)}</span></td>
            <td class="small">${App.esc(c.address)}<div class="small muted">${App.esc(c.city)}, ${App.esc(c.state)}</div></td>
            <td><span class="badge badge-primary no-dot">${docs.length}</span></td>
            <td>${open ? `<span class="badge badge-unpaid no-dot">${open}</span>` : `<span class="small muted">None</span>`}</td>
            <td><div class="actions"><button class="btn btn-secondary btn-sm" data-doc-for="${c.id}">📄 Add Document</button></div></td>
          </tr>`;
        }).join("")}
      </tbody></table>`
      : App.emptyState("👥", "No clients found", "Try a different search term."));
  };

  const bindClients = () => {
    const search = App.qs("#cSearch");
    if (search) search.addEventListener("input", renderClients);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-doc-for]");
      if (btn) {
        const c = DB.getClient(btn.dataset.docFor);
        App.openModal("addDocModal");
        const select = App.qs('#addDocForm select[name="docClient"]');
        if (select) select.value = c.id;
      }
    });
  };

  const submitAddClient = async (e) => {
    e.preventDefault();
    const form = App.qs("#addClientForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    await App.fakeSave();
    const id = DB.addClient({
      name: v.clientName, email: v.clientEmail, phone: v.clientPhone, altPhone: v.clientAltPhone,
      address: v.clientAddress, city: v.clientCity, state: v.clientState,
    });
    App.closeModal("addClientModal");
    App.toast("Client added", `${v.clientName} (${id}) onboarded successfully.`);
    renderClients();
  };

  const submitAddDoc = async (e) => {
    e.preventDefault();
    const form = App.qs("#addDocForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    const issue = v.docIssueDate;
    const exp = v.docExpiryDate;
    if (new Date(exp) <= new Date(issue)) {
      App.toast("Invalid dates", "Expiry date must be after the issue date.", "error");
      return;
    }
    await App.fakeSave();
    const d = DB.addDocument({
      clientId: v.docClient, type: v.docType, number: v.docNumber,
      issueDate: issue, expiryDate: exp, policy: v.docPolicy || "",
    });
    App.closeModal("addDocModal");
    App.toast("Document added", `${d.type} ${d.number} added for ${clientName(d.clientId)}.`);
    renderClients();
  };

  /* ================= USERS & ROLES ================= */
  const userInitials = (name) =>
    String(name || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

  const rolePill = (roleId) => {
    const r = DB.getRole(roleId);
    return r ? `<span class="role-pill" style="--rc:${r.color}">${App.esc(r.name)}</span>` : App.esc(roleId || "—");
  };

  const userRowHtml = (u) => {
    const last = u.lastActive ? App.fmtDateTime(u.lastActive) : "Never";
    return `<tr>
      <td>
        <div class="user-cell">
          <div class="u-avatar sm" style="background:${DB.roleColor(u.roleId)}22;color:${DB.roleColor(u.roleId)}">${userInitials(u.name)}</div>
          <div>
            <div class="cell-main">${App.esc(u.name)}</div>
            <div class="cell-sub">${u.id} · ${App.esc(u.email)}</div>
          </div>
        </div>
      </td>
      <td>${rolePill(u.roleId)}</td>
      <td>${App.esc(u.phone || "—")}</td>
      <td>${App.badge(u.status)}</td>
      <td><div class="cell-main">${last}</div><div class="cell-sub">${u.status === "Active" ? "signed in" : "no sign-in"}</div></td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary btn-sm" data-edit-user="${u.id}">✏️ Edit</button>
          <button class="btn btn-soft btn-sm" data-reset-pw="${u.id}">🔑</button>
          <button class="btn btn-ghost btn-sm" data-toggle-user="${u.id}">${u.status === "Active" ? "Deactivate" : "Activate"}</button>
        </div>
      </td>
    </tr>`;
  };

  const renderUsers = () => {
    const q = (App.qs("#uSearch")?.value || "").toLowerCase();
    const roleF = App.qs("#uRole")?.value || "all";
    const statusF = App.qs("#uStatus")?.value || "all";

    const rows = DB.users.filter((u) => {
      if (roleF !== "all" && u.roleId !== roleF) return false;
      if (statusF !== "all" && u.status !== statusF) return false;
      if (q && !(u.name + u.email + u.phone + u.id).toLowerCase().includes(q)) return false;
      return true;
    });

    App.renderInto("#userCount", `${rows.length} of ${DB.users.length} user${DB.users.length === 1 ? "" : "s"} · ${DB.users.filter((u) => u.status === "Active").length} active`);
    App.renderInto("#usersTable", rows.length
      ? `<div class="table-wrap"><table class="table"><thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Status</th><th>Last active</th><th class="text-right">Actions</th></tr></thead>
         <tbody>${rows.map(userRowHtml).join("")}</tbody></table></div>`
      : App.emptyState("👤", "No users found", "Try adjusting the filters or add a user."));
  };

  const fillRoleSelects = () => {
    const opts = DB.roles.map((r) => `<option value="${r.id}">${App.esc(r.name)}</option>`).join("");
    const sel = App.qs("#userRoleSelect");
    if (sel) sel.innerHTML = opts;
    const filter = App.qs("#uRole");
    if (filter) filter.innerHTML = '<option value="all">All roles</option>' + opts;
  };

  const bindUsers = () => {
    ["uRole", "uStatus"].forEach((id) => {
      const el = App.qs(`#${id}`);
      if (el) el.addEventListener("change", renderUsers);
    });
    const search = App.qs("#uSearch");
    if (search) search.addEventListener("input", renderUsers);

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-user]");
      if (edit) {
        const u = DB.getUser(edit.dataset.editUser);
        const form = App.qs("#userForm");
        App.resetForm(form);
        App.qs("#userModalTitle").textContent = "Edit user";
        form.querySelector('[name="userId"]').value = u.id;
        form.querySelector('[name="userName"]').value = u.name;
        form.querySelector('[name="userEmail"]').value = u.email;
        form.querySelector('[name="userPhone"]').value = u.phone || "";
        form.querySelector('[name="userRole"]').value = u.roleId;
        form.querySelector('[name="userStatus"]').value = u.status;
        const pw = form.querySelector('[name="userPassword"]');
        pw.value = "";
        pw.required = false;
        pw.placeholder = "Leave blank to keep current";
        App.openModal("userModal");
        return;
      }
      const reset = e.target.closest("[data-reset-pw]");
      if (reset) {
        const u = DB.getUser(reset.dataset.resetPw);
        App.qs('[name="pwUserId"]').value = u.id;
        App.qs("#resetPwForm").reset();
        App.openModal("resetPwModal");
        return;
      }
      const tog = e.target.closest("[data-toggle-user]");
      if (tog) {
        const u = DB.getUser(tog.dataset.toggleUser);
        const next = u.status === "Active" ? "Inactive" : "Active";
        DB.setUserStatus(u.id, next);
        App.toast(next === "Active" ? "User activated" : "User deactivated", `${u.name} is now ${next.toLowerCase()}.`, next === "Active" ? "success" : "info");
        renderUsers();
      }
    });

    const addBtn = App.qs('[data-modal-open="userModal"]');
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const form = App.qs("#userForm");
        App.resetForm(form);
        App.qs("#userModalTitle").textContent = "Add user";
        form.querySelector('[name="userId"]').value = "";
        const pw = form.querySelector('[name="userPassword"]');
        pw.required = true;
        pw.placeholder = "Set a sign-in password";
        pw.value = "";
      });
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    const form = App.qs("#userForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    if (!v.userId) {
      await App.fakeSave();
      const id = DB.addUser({
        name: v.userName, email: v.userEmail, phone: v.userPhone || "",
        password: v.userPassword, roleId: v.userRole, status: v.userStatus,
      });
      App.closeModal("userModal");
      App.toast("User added", `${v.userName} (${id}) can now sign in.`);
    } else {
      await App.fakeSave();
      const patch = {
        name: v.userName, email: v.userEmail, phone: v.userPhone || "",
        roleId: v.userRole, status: v.userStatus,
      };
      if (v.userPassword) patch.password = v.userPassword;
      DB.updateUser(v.userId, patch);
      App.closeModal("userModal");
      App.toast("User updated", `${v.userName}'s details and role were saved.`);
    }
    renderUsers();
  };

  const submitResetPw = async (e) => {
    e.preventDefault();
    const form = App.qs("#resetPwForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    await App.fakeSave();
    DB.updateUser(v.pwUserId, { password: v.newPassword });
    App.closeModal("resetPwModal");
    App.toast("Password reset", "A new temporary password is set for this user.");
  };

  /* ---------------- roles ---------------- */
  const renderRoles = () => {
    const permChip = (perm) => `<label class="perm-chip"><input type="checkbox" data-perm="${App.esc(perm)}" /><span>${App.esc(perm.replace(".", " · "))}</span></label>`;

    App.renderInto("#rolesGrid", DB.roles.map((r) => {
      const members = DB.usersOfRole(r.id);
      const total = DB.permissions.reduce((n, m) => n + m.actions.length, 0);
      return `<div class="role-card">
        <div class="card-header spread">
          <div>
            <h2><span class="role-pill" style="--rc:${r.color}">${App.esc(r.name)}</span> <span class="small muted">${members.length} user${members.length === 1 ? "" : "s"}</span></h2>
            <div class="sub">${App.esc(r.desc)}</div>
          </div>
          <span class="small muted">${r.perms.length}/${total} permissions</span>
        </div>
        <div class="card-body">
          <div class="perm-grid">${DB.permissions.map((m) => `
            <div class="perm-group">
              <div class="perm-group-label">${App.esc(m.module)}</div>
              ${m.actions.map((a) => permChip(`${m.module}.${a}`)).join("")}
            </div>`).join("")}
          </div>
          <div class="spread mt-16">
            <span class="small muted">Changes apply immediately to everyone with this role.</span>
            <button class="btn btn-ghost btn-sm" data-copy-role="${r.id}">Duplicate role</button>
          </div>
        </div>
      </div>`;
    }).join(""));
  };

  const bindRoles = () => {
    document.addEventListener("change", (e) => {
      const chip = e.target.closest("[data-perm]");
      if (!chip) return;
      const roleEl = chip.closest(".role-card");
      const name = roleEl.querySelector(".role-pill").textContent.trim();
      const role = DB.roles.find((r) => r.name === name);
      if (!role) return;
      const checked = App.qsa("input[data-perm]:checked", roleEl).map((i) => i.dataset.perm);
      DB.setRolePerms(role.id, checked);
      roleEl.querySelector(".small.muted").textContent = `${checked.length}/${DB.permissions.reduce((n, m) => n + m.actions.length, 0)} permissions`;
      App.toast("Permissions updated", `Saved for the ${role.name} role.`, "info");
    });

    document.addEventListener("click", (e) => {
      const dup = e.target.closest("[data-copy-role]");
      if (dup) {
        const src = DB.getRole(dup.dataset.copyRole);
        if (!src) return;
        const newId = DB.addRole({ name: src.name + " Copy", desc: src.desc, color: src.color, perms: [...src.perms] });
        App.toast("Role duplicated", `${src.name} Copy added with the same permissions.`, "success");
        fillRoleSelects();
        renderRoles();
      }
    });
  };

  const submitRole = async (e) => {
    e.preventDefault();
    const form = App.qs("#roleForm");
    if (!App.requireFields(form)) return;
    const v = App.formValues(form);
    await App.fakeSave();
    const id = DB.addRole({ name: v.roleName, desc: v.roleDesc || "", perms: [] });
    App.closeModal("roleModal");
    App.toast("Role created", `${v.roleName} added. Tick its permissions now.`);
    fillRoleSelects();
    renderRoles();
  };

  /* ---------------- init by page ---------------- */
  const init = () => {
    document.addEventListener("click", (e) => {
      // channel pill selection in reminder modal
      const pill = e.target.closest(".channel-pill");
      if (pill && pill.closest("#reminderModal")) {
        App.qsa(".channel-pill", pill.closest("#reminderModal")).forEach((p) => p.classList.remove("selected"));
        pill.classList.add("selected");
        const input = pill.closest("#reminderModal").querySelector('input[name="reminderChannel"]');
        if (input) input.value = pill.dataset.channel;
      }
    });

    if (page === "dashboard") renderDashboard();
    else if (page === "renewals") { renderRenewals(); bindRenewals(); }
    else if (page === "documents") { renderDocuments(); bindDocuments(); }
    else if (page === "operations") {
      renderReminders();
      setupCreateBatch();
      renderBatches();
      bindBatches();
    } else if (page === "riders") { renderRiders(); bindRiders(); }
    else if (page === "clients") { renderClients(); bindClients(); }
    else if (page === "users") {
      fillRoleSelects();
      bindUsers();
      renderUsers();
      bindRoles();
      renderRoles();
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  return {
    sendReminder,
    submitRenewal,
    submitCreateBatch,
    submitPickup,
    submitAddRider,
    submitAddClient,
    submitAddDoc,
    submitUser,
    submitResetPw,
    submitRole,
  };
})();