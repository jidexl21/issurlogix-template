/* ============================================================
   LOGISTICS UI — Rider portal logic
   ============================================================ */

const Rider = (() => {
  "use strict";

  const page = document.body.dataset.page;
  const RIDER_ID = "RD-01";

  const myDocs = () =>
    DB.batches
      .filter((b) => b.riderId === RIDER_ID)
      .flatMap((b) => DB.docsOfBatch(b.id));

  const clientInfo = (id) => {
    const c = DB.getClient(id);
    return c ? `${c.name} · ${c.address}, ${c.city}` : "";
  };

  /* Delivery stops — group pending documents per client so one token
     can cover every document handed to that client in a single visit. */
  const myStops = () => {
    const byClient = {};
    myDocs()
      .filter((d) => !["Accepted by Client", "Returned"].includes(d.status))
      .forEach((d) => {
        (byClient[d.clientId] = byClient[d.clientId] || []).push(d);
      });
    return Object.entries(byClient).map(([clientId, docs]) => ({ clientId, docs }));
  };

  /* ================= DASHBOARD ================= */
  const renderDashboard = () => {
    const batches = DB.activeBatchesOfRider(RIDER_ID);
    const docs = myDocs();
    const total = docs.length;
    const delivered = docs.filter((d) => ["Delivered", "Accepted by Client"].includes(d.status)).length;
    const outstanding = docs.filter((d) => !["Delivered", "Accepted by Client"].includes(d.status)).length;
    const returned = docs.filter((d) => d.status === "Returned").length;
    const pct = total ? Math.round((delivered / total) * 100) : 0;

    App.renderInto("#riderStats", [
      { label: "Active Batches", value: batches.length, icon: "🚚", tint: "tint-indigo", meta: "assigned to you" },
      { label: "Outstanding Items", value: outstanding, icon: "📦", tint: "tint-amber", meta: "still to deliver / accept" },
      { label: "Delivered & Accepted", value: delivered, icon: "✅", tint: "tint-green", meta: `${pct}% of your items` },
      { label: "Returned Items", value: returned, icon: "↩️", tint: "tint-red", meta: "back to office" },
    ].map((t) => `
      <div class="stat-tile ${t.tint}">
        <div class="stat-icon">${t.icon}</div>
        <div class="stat-label">${t.label}</div>
        <div class="stat-value">${t.value}</div>
        <div class="stat-meta">${t.meta}</div>
      </div>`).join(""));

    const inTransit = batches.find((b) => b.status === "In Transit") || batches.find((b) => b.status !== "Completed");
    App.renderInto("#todayBatch", inTransit
      ? `
        <div class="card">
          <div class="card-header spread">
            <div><h2>${App.esc(inTransit.name)}</h2><div class="sub">${inTransit.id} · assigned ${App.fmtDate(inTransit.createdAt)}</div></div>
            ${App.badge(inTransit.status)}
          </div>
          <div class="card-body tight">
            <div class="table-wrap"><table class="table">
              <thead><tr><th>Client</th><th>Document</th><th>Status</th></tr></thead>
              <tbody>${DB.docsOfBatch(inTransit.id).map((d) => `
                <tr>
                  <td class="small">${App.esc(clientInfo(d.clientId))}</td>
                  <td>${App.esc(d.type)} <span class="mono small muted">${App.esc(d.number)}</span></td>
                  <td>${App.badge(d.status)}</td>
                </tr>`).join("")}</tbody>
            </table></div>
          </div>
          <div class="card-footer">
            <div class="row">
              <a class="btn btn-primary btn-sm" href="waybill.html">🧾 Open Waybill</a>
              <a class="btn btn-secondary btn-sm" href="batch-status.html">📦 Update Batch Status</a>
            </div>
          </div>
        </div>`
      : App.emptyState("🚚", "No active batch", "New delivery batches will appear here once assigned."));

    // today's delivery queue — one card per client stop (may hold several docs)
    const stops = myStops();
    App.renderInto("#todaysQueue", stops.length
      ? `<div class="status-cols" style="grid-template-columns:1fr">${stops.map((s) => {
          const c = DB.getClient(s.clientId);
          const ready = s.docs.some((d) => d.status === "Out For Delivery" || d.status === "Delivered");
          return `<div class="status-card">
            <div class="spread">
              <div>
                <div class="sc-title">${App.esc(c.name)} <span class="badge badge-primary no-dot">${s.docs.length} doc${s.docs.length > 1 ? "s" : ""}</span></div>
                <div class="sc-sub">${App.esc(c.address)}, ${App.esc(c.city)}</div>
                <div class="chip-list mt-4">${s.docs.map((d) => `<span class="badge badge-neutral no-dot">${App.esc(d.type)}</span>`).join("")}</div>
              </div>
              <a class="btn btn-primary btn-sm" href="delivery.html?client=${s.clientId}">${ready ? "Request token" : "View stop"}</a>
            </div>
          </div>`;
        }).join("")}</div>`
      : App.emptyState("🎉", "All caught up", "No outstanding deliveries — everything has been delivered or accepted."));
  };

  /* ================= WAYBILL ================= */
  const batchOptions = () => {
    const opts = DB.activeBatchesOfRider(RIDER_ID);
    if (!opts.length) return `<option value="">No batches assigned</option>`;
    return opts.map((b) => `<option value="${b.id}">${App.esc(b.name)} (${b.id})</option>`).join("");
  };

  const renderWaybill = () => {
    const sel = App.qs("#waybillSelect");
    const current = sel?.value || App.qs("#waybillSelect option")?.value || "";
    const b = DB.getBatch(current);
    const selectEl = App.qs("#waybillSelect");
    if (selectEl && selectEl.options.length <= 1) selectEl.innerHTML = batchOptions();

    if (!b) {
      App.renderInto("#waybillBody", App.emptyState("🧾", "Select a batch", "Pick a delivery batch from the selector above to view its waybill."));
      return;
    }

    const docs = DB.docsOfBatch(b.id);
    const rider = DB.getRider(b.riderId);
    const picked = docs.filter((d) => d.status === "Out For Delivery").length;

    App.renderInto("#waybillMeta", `
      <div class="wm-cell"><div class="wm-label">Batch</div><div class="wm-value">${App.esc(b.name)}</div></div>
      <div class="wm-cell"><div class="wm-label">Batch ID</div><div class="wm-value mono">${b.id}</div></div>
      <div class="wm-cell"><div class="wm-label">Date</div><div class="wm-value">${App.fmtDate(b.createdAt)}</div></div>
      <div class="wm-cell"><div class="wm-label">Rider</div><div class="wm-value">${App.esc(rider?.name || "Unassigned")} · ${App.esc(rider?.regNo || "")}</div></div>
      <div class="wm-cell"><div class="wm-label">Items</div><div class="wm-value">${docs.length} total · ${picked} picked up</div></div>
      <div class="wm-cell"><div class="wm-label">Status</div><div class="wm-value">${App.badge(b.status)}</div></div>`);

    if (!docs.length) {
      App.renderInto("#waybillItems", App.emptyState("📦", "No items", "This batch has no documents."));
    } else {
      // group items by client — everything at one stop is delivered together
      const rowByDoc = (d, i) => {
        const canDeliver = d.status === "Out For Delivery" || d.status === "Awaiting Delivery";
        return `<tr>
          <td class="muted">${i + 1}</td>
          <td class="small">${App.esc(clientInfo(d.clientId))}</td>
          <td><div class="cell-main">${App.esc(d.type)}</div><div class="cell-sub">${App.esc(d.number)}</div></td>
          <td class="mono">${d.id}</td>
          <td>${App.badge(d.status)}</td>
          <td><div class="actions">
            ${d.status === "Delivered" && !d.milestones.some((m) => m.type === "Delivered by Rider") ? `<button class="btn btn-primary btn-sm" data-rider-delivered="${d.id}">Confirm delivered</button>` : ""}
            ${canDeliver ? `<button class="btn btn-primary btn-sm" data-token-for="${d.clientId}">🔑 Token for stop</button>` : `<span class="small muted">${d.status === "Accepted by Client" ? "Accepted ✓" : "Awaiting acceptance"}</span>`}
          </div></td>
        </tr>`;
      };

      const byClient = {};
      docs.forEach((d) => { (byClient[d.clientId] = byClient[d.clientId] || []).push(d); });

      let rowNo = 0;
      const body = Object.entries(byClient).map(([cid, items], stopIdx) => {
        const c = DB.getClient(cid);
        const itemRows = items.map((d) => rowByDoc(d, ++rowNo)).join("");
        return `
          <tr class="stop-row">
            <td colspan="6">
              <div class="spread stop-head-inner">
                <div>
                  <strong>${stopIdx + 1}. ${App.esc(c.name)}</strong>
                  <span class="small muted"> · ${App.esc(c.address)}, ${App.esc(c.city)}</span>
                  <span class="badge badge-primary no-dot">${items.length} document${items.length > 1 ? "s" : ""} · deliver together</span>
                </div>
                ${items.some((d) => d.status === "Out For Delivery" || d.status === "Delivered")
                  ? `<a class="btn btn-primary btn-sm" href="delivery.html?client=${cid}">🔑 One token for this stop</a>`
                  : `<span class="small muted">Items not yet ready for delivery</span>`}
              </div>
            </td>
          </tr>
          ${itemRows}`;
      }).join("");

      App.renderInto("#waybillItems", `
        <div class="table-wrap"><table class="table">
          <thead><tr><th>#</th><th>Client</th><th>Document</th><th>Item no.</th><th>Status</th><th class="text-right">Action</th></tr></thead>
          <tbody>${body}</tbody>
        </table></div>`);
    }
  };

  const confirmRiderDelivered = (docId) => {
    const d = DB.getDoc(docId);
    if (!d) return;
    d.status = "Delivered";
    DB.pushMilestone(docId, "Delivered by Rider", "Rider");
    d.history.push({ status: "Delivered", at: new Date().toISOString(), note: "Rider confirmed handover." });
    App.toast("Delivery confirmed", `${d.number} marked as delivered by rider.`);
    renderWaybill();
  };

  const bindWaybill = () => {
    const sel = App.qs("#waybillSelect");
    if (sel) sel.addEventListener("change", renderWaybill);
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rider-delivered]");
      if (btn) { confirmRiderDelivered(btn.dataset.riderDelivered); return; }
      const tokenFor = e.target.closest("[data-token-for]");
      if (tokenFor) location.href = "delivery.html?client=" + tokenFor.dataset.tokenFor;
    });
  };

  /* ================= BATCH STATUS ================= */
  const renderBatchStatus = () => {
    const docs = myDocs();
    if (!docs.length) {
      App.renderInto("#statusBoard", App.emptyState("📦", "No documents assigned", "Your batches have no items yet."));
      return;
    }

    const group = (statuses, title, icon) => {
      const items = docs.filter((d) => statuses.includes(d.status));
      return `<div class="status-col">
        <div class="status-col-head"><span class="strong small">${icon} ${title}</span><span class="count">${items.length}</span></div>
        ${items.length ? items.map((d) => `
          <div class="status-card">
            <div class="sc-title">${App.esc(d.type)} · <span class="mono">${App.esc(d.number)}</span></div>
            <div class="sc-sub">${App.esc(clientInfo(d.clientId))}</div>
            <div class="sc-foot">
              <span class="small muted">${App.esc(DB.getBatch(d.batchId)?.id || "")}</span>
              ${App.badge(d.status)}
            </div>
            ${!["Delivered", "Accepted by Client", "Returned"].includes(d.status)
              ? `<div class="mt-8"><button class="btn btn-primary btn-sm btn-block" data-bs-advance="${d.id}">${d.status === "Awaiting Delivery" ? "Start": "Mark Delivered"}</button></div>`
              : d.status === "Delivered" && !d.milestones.some((m) => m.type === "Delivered by Rider")
                ? `<div class="mt-8"><button class="btn btn-success btn-sm btn-block" data-rider-delivered="${d.id}">Confirm delivered by rider</button></div>`
                : d.status === "Delivered"
                  ? `<div class="mt-8"><a class="btn btn-primary btn-sm btn-block" href="delivery.html?client=${d.clientId}">🔑 Request acceptance token</a></div>`
                  : ""}
          </div>`).join("") : `<span class="small muted">No items</span>`}
      </div>`;
    };

    App.renderInto("#statusBoard", `
      <div class="status-cols">
        ${group(["Awaiting Delivery"], "Awaiting Delivery", "🟡")}
        ${group(["Out For Delivery"], "Out For Delivery", "🟣")}
        ${group(["Delivered"], "Delivered", "🟢")}
        ${group(["Returned"], "Returned", "🔴")}
      </div>`);
  };

  const bindBatchStatus = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bs-advance]");
      if (btn) {
        const d = DB.advanceDoc(btn.dataset.bsAdvance);
        if (d) { App.toast("Item updated", `${d.number} is now "${d.status}".`); renderBatchStatus(); }
        return;
      }
      const btn2 = e.target.closest("[data-rider-delivered]");
      if (btn2) {
        const d = DB.getDoc(btn2.dataset.riderDelivered);
        if (d) {
          d.status = "Delivered";
          DB.pushMilestone(btn2.dataset.riderDelivered, "Delivered by Rider", "Rider");
          App.toast("Rider delivery confirmed", `${d.number} confirmed.`);
          renderBatchStatus();
        }
      }
    });
  };

  /* ================= DELIVERY TOKEN (per client stop) ================= */
  const tokenState = { timer: null };

  const stopOptionsHtml = () => {
    const stops = myStops();
    if (!stops.length) return `<option value="">No deliverable stops</option>`;
    return stops.map((s) => {
      const c = DB.getClient(s.clientId);
      const kinds = [...new Set(s.docs.map((d) => d.type))].join(", ");
      return `<option value="${s.clientId}">${App.esc(c.name)} — ${s.docs.length} document${s.docs.length > 1 ? "s" : ""} (${App.esc(kinds)})</option>`;
    }).join("");
  };

  const renderStopPreview = (clientId) => {
    const docs = myStops().find((s) => s.clientId === clientId)?.docs || [];
    if (!docs.length) {
      App.renderInto("#stopPreview", "");
      return;
    }
    App.renderInto("#stopPreview", `
      <div class="form-label">Documents covered by this token</div>
      <div class="select-list" style="max-height:none">${docs.map((d) => `
        <div class="select-item" style="cursor:default">
          <div class="si-main">
            <div class="si-title">${App.esc(d.type)} · ${App.esc(d.number)}</div>
            <div class="si-sub">${d.id} · ${App.badge(d.status)}</div>
          </div>
        </div>`).join("")}</div>`);
  };

  const renderDelivery = () => {
    const fromQuery = new URLSearchParams(location.search).get("client");
    const html = stopOptionsHtml();

    ["#deliveryStop", "#validateStop"].forEach((selId) => {
      const sel = App.qs(selId);
      if (!sel) return;
      sel.innerHTML = html;
      if (fromQuery && sel.querySelector(`option[value="${fromQuery}"]`)) sel.value = fromQuery;
      renderStopPreview(sel.value);
      sel.addEventListener("change", () => renderStopPreview(sel.value));
    });
  };

  const requestToken = (e) => {
    e.preventDefault();
    const clientId = App.qs("#deliveryStop")?.value;
    if (!clientId) { App.toast("Select a stop", "Choose the client you are delivering to.", "error"); return; }
    const channel = App.qs("#deliveryChannel")?.value || "WhatsApp";
    const c = DB.getClient(clientId);
    const docs = myStops().find((s) => s.clientId === clientId)?.docs || [];
    if (!docs.length) { App.toast("Nothing to deliver", "This client has no pending documents.", "error"); return; }

    // reset validation area + make the token panel visible again
    App.qs("#validateResult")?.classList.remove("show");
    App.qs("#tokenArea")?.removeAttribute("hidden");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    DB.createToken(clientId, code, channel, docs.map((d) => d.id));
    App.renderInto("#tokenArea", `
      <div class="token-display">
        <div class="td-label">Delivery token · ${App.esc(channel)}</div>
        <div class="td-code">${code}</div>
        <div class="td-expiry">Expires in <strong id="tokenCountdown">15:00</strong> · one code for ${docs.length} document${docs.length > 1 ? "s" : ""} at this stop</div>
      </div>
      <div class="mt-16 banner banner-info">
        <span class="b-icon">ℹ️</span>
        <div>Share this token with <strong>${App.esc(c.name)}</strong> by <strong>${App.esc(channel)}</strong>. Ask them to quote it back to you to confirm identity before handing over <strong>${docs.length} document${docs.length > 1 ? "s" : ""}</strong>.</div>
      </div>
      <div class="mt-16">${docs.map((d) => `
        <div class="select-item" style="cursor:default">
          <div class="si-main">
            <div class="si-title">${App.esc(d.type)} · ${App.esc(d.number)}</div>
            <div class="si-sub">${d.id}</div>
          </div>
          ${App.badge(d.status)}
        </div>`).join("")}</div>
      <div class="mt-16 spread">
        <button class="btn btn-secondary" type="button" onclick="Rider.requestToken(event)">⟳ Regenerate token</button>
        <span class="small muted">After acceptance, tokens expire automatically.</span>
      </div>`);

    // countdown
    if (tokenState.timer) clearInterval(tokenState.timer);
    const expiry = new Date(Date.now() + 15 * 60000);
    tokenState.timer = setInterval(() => {
      const el = App.qs("#tokenCountdown");
      const rem = new Date(expiry) - new Date();
      if (!el || rem <= 0) { clearInterval(tokenState.timer); return; }
      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }, 1000);

    App.toast("Token generated", `One-time code for ${c.name} (${docs.length} document${docs.length > 1 ? "s" : ""}) via ${channel}.`, "info");
  };

  const validateToken = (e) => {
    e.preventDefault();
    const clientId = App.qs("#validateStop")?.value;
    if (!clientId) { App.toast("Select a stop", "Choose the delivery stop to validate against.", "error"); return; }
    const inputs = App.qsa(".token-input");
    const code = inputs.map((i) => i.value).join("");
    if (code.length !== 6) {
      App.toast("Incomplete code", "Enter all six digits from the client.", "error");
      return;
    }
    const res = DB.validateToken(clientId, code);
    const c = DB.getClient(clientId);
    const acceptedNos = (res.accepted || []).map((id) => DB.getDoc(id)?.number || id);
    const list = acceptedNos.length
      ? `<div class="chip-list mt-8" style="justify-content:center">${acceptedNos.map((n) => `<span class="badge badge-accepted no-dot">${App.esc(n)} ✓</span>`).join("")}</div>`
      : "";
    App.renderInto("#validateResult", `
      <div class="validation-result ${res.ok ? "ok" : "fail"} show">
        <div class="vr-icon">${res.ok ? "✅" : "⛔"}</div>
        <div class="vr-title">${res.ok ? "Token valid — handover confirmed" : "Token invalid"}</div>
        <div class="vr-msg">${res.ok ? `${App.esc(c.name)}'s documents are marked as Accepted by Client and Received.` : App.esc(res.reason)}</div>
        ${list}
      </div>`);
    if (res.ok) {
      App.toast("Handover complete", `${acceptedNos.length} document${acceptedNos.length > 1 ? "s" : ""} accepted by ${c.name}.`);
      // refresh stops now that these docs have been accepted
      const html = stopOptionsHtml();
      ["#deliveryStop", "#validateStop"].forEach((selId) => {
        const sel = App.qs(selId);
        if (sel) sel.innerHTML = html;
      });
      App.qs("#tokenArea")?.setAttribute("hidden", "");
      App.renderInto("#stopPreview", "");
    }
    inputs.forEach((i) => (i.value = ""));
  };

  const bindDelivery = () => {
    const inputs = App.qsa(".token-input");
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
        if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
      });
      inp.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
        [...text.slice(0, 6)].forEach((ch, j) => { if (inputs[j]) inputs[j].value = ch; });
        if (text.length >= 6) inputs[5].focus();
      });
    });

    App.qsa(".channel-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        App.qsa(".channel-pill", pill.parentElement).forEach((p) => p.classList.remove("selected"));
        pill.classList.add("selected");
        const input = App.qs("#deliveryChannel");
        if (input) input.value = pill.dataset.channel;
      });
    });
  };

  /* ---------------- init by page ---------------- */
  const init = () => {
    if (page === "dashboard") renderDashboard();
    else if (page === "waybill") { renderWaybill(); bindWaybill(); }
    else if (page === "batch-status") { renderBatchStatus(); bindBatchStatus(); }
    else if (page === "delivery") { renderDelivery(); bindDelivery(); }
  };

  document.addEventListener("DOMContentLoaded", init);

  return { requestToken, validateToken };
})();