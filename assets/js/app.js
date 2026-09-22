/* ============================================================
   LOGISTICS UI — Shared helpers
   Sidebar, modals, tabs, toasts, formatters, badge renderers
   ============================================================ */

const App = (() => {
  "use strict";

  /* ---------- Pipeline / status config ---------- */
  const PIPELINE = [
    "Processing",
    "Awaiting Delivery",
    "Out For Delivery",
    "Delivered",
    "Accepted by Client",
  ];

  const MILESTONES = ["Delivered by Rider", "Marked as Received"];

  const STATUS_META = {
    Processing:          { cls: "badge-processing",    icon: "●" },
    "Awaiting Delivery": { cls: "badge-awaiting",      icon: "●" },
    "Out For Delivery":  { cls: "badge-outfordelivery",icon: "●" },
    Delivered:           { cls: "badge-delivered",     icon: "●" },
    Returned:            { cls: "badge-returned",      icon: "●" },
    "Accepted by Client":{ cls: "badge-accepted",      icon: "●" },
    "Delivered by Rider":{ cls: "badge-delivered",     icon: "◆" },
    "Marked as Received":{ cls: "badge-accepted",      icon: "◆" },
    Upcoming:            { cls: "badge-upcoming",      icon: "●" },
    "Due Soon":          { cls: "badge-duesoon",       icon: "●" },
    Expired:             { cls: "badge-expired",       icon: "●" },
    Renewed:             { cls: "badge-renewed",       icon: "●" },
    Paid:                { cls: "badge-paid",          icon: "●" },
    Unpaid:              { cls: "badge-unpaid",        icon: "●" },
    Overdue:             { cls: "badge-overdue",       icon: "●" },
    Partial:             { cls: "badge-partial",       icon: "●" },
    Active:              { cls: "badge-active",        icon: "●" },
    Inactive:            { cls: "badge-inactive",      icon: "●" },
    Scheduled:           { cls: "badge-upcoming",      icon: "●" },
    Sent:                { cls: "badge-delivered",     icon: "●" },
    Queued:              { cls: "badge-awaiting",      icon: "●" },
    Open:                { cls: "badge-unpaid",        icon: "●" },
    Draft:               { cls: "badge-neutral",       icon: "●" },
  };

  /* ---------- Formatting ---------- */
  const fmtDate = (d) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!dt || isNaN(dt)) return "—";
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtDateTime = (d) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!dt || isNaN(dt)) return "—";
    return (
      fmtDate(dt) +
      " · " +
      dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const daysUntil = (d) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dt);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  };

  const money = (n) =>
    "₦" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const uid = (prefix = "ID") =>
    prefix + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  /* ---------- Renderers ---------- */
  const badge = (status) => {
    const meta = STATUS_META[status] || { cls: "badge-neutral", icon: "●" };
    const isEvent = MILESTONES.includes(status);
    return `<span class="badge ${meta.cls}${isEvent ? " no-dot" : ""}">${esc(status)}</span>`;
  };

  const renewalBadge = (expiry) => {
    const d = daysUntil(expiry);
    if (d < 0) return badge("Expired");
    if (d <= 30) return badge("Due Soon");
    return badge("Upcoming");
  };

  const pipeline = (status) => {
    const isReturned = status === "Returned";
    const idx = PIPELINE.indexOf(status);
    return `<div class="pipeline">${PIPELINE.map((step, i) => {
      let cls = "";
      if (isReturned) {
        cls = i === 0 ? "done" : "";
      } else if (idx >= 0) {
        if (i < idx) cls = "done";
        else if (i === idx) cls = "current";
      }
      const label = isReturned && i === 0 ? "Returned" : step;
      const chip = `<span class="pipeline-step ${cls}"><span class="step-num">${i + 1}</span>${esc(label)}</span>`;
      return i === 0 ? chip : `<span class="pipeline-arrow">›</span>${chip}`;
    }).join("")}</div>`;
  };

  const nextStatus = (status) => {
    if (status === "Returned") return "Processing";
    const i = PIPELINE.indexOf(status);
    if (i < 0 || i >= PIPELINE.length - 1) return null;
    return PIPELINE[i + 1];
  };

  /* ---------- Portal sidebar configuration ---------- */
  const PORTALS = {
    admin: {
      brand: "InsurLogix",
      user: "Admin Ops",
      role: "Operations Manager",
      sections: [
        {
          label: "Overview",
          items: [["dashboard", "🏠", "Dashboard"]],
        },
        {
          label: "Documents",
          items: [
            ["renewals", "🔄", "Renewals"],
            ["documents", "📄", "Documents"],
          ],
        },
        {
          label: "Operations",
          items: [
            ["operations", "🚚", "Reminders & Batches"],
            ["riders", "🛵", "Riders"],
          ],
        },
        {
          label: "Clients",
          items: [["clients", "👥", "Clients"]],
        },
      ],
    },
    rider: {
      brand: "InsurLogix",
      user: "Tunde Bakare",
      role: "Rider · RC-441",
      sections: [
        {
          label: "My Runs",
          items: [
            ["dashboard", "🏠", "My Dashboard"],
            ["waybill", "🧾", "Batch Contents (Waybill)"],
            ["batch-status", "📦", "Batch Status"],
            ["delivery", "🔑", "Delivery Token"],
          ],
        },
      ],
    },
    client: {
      brand: "InsurLogix",
      user: "Adaeze Okafor",
      role: "Client · LG-2234",
      sections: [
        {
          label: "My Account",
          items: [
            ["dashboard", "🏠", "My Dashboard"],
            ["track", "📍", "Track My Documents"],
            ["invoices", "🧾", "Invoices & Payments"],
            ["profile", "✏️", "Address / Info"],
          ],
        },
      ],
    },
  };

  /* ---------- Sidebar / mobile nav ---------- */
  const initNav = () => {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    const hamburger = document.querySelector(".hamburger");
    if (hamburger && sidebar) {
      hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("open");
      });
    }
    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      });
    }

    // Build nav from portal config
    const portal = document.body.dataset.portal;
    const page = document.body.dataset.page;
    const cfg = PORTALS[portal];
    const navEl = document.querySelector(".sidebar-nav");
    if (cfg && navEl && !navEl.dataset.built) {
      navEl.dataset.built = "1";
      navEl.innerHTML = cfg.sections
        .map(
          (s) =>
            `<div class="sidebar-section">${esc(s.label)}</div>` +
            s.items
              .map(
                ([key, icon, label]) =>
                  `<a href="${key}.html" data-nav="${key}" class="${key === page ? "active" : ""}"><span class="nav-icon">${icon}</span>${esc(label)}</a>`
              )
              .join("")
        )
        .join("");
      const brand = document.querySelector(".sidebar-brand .brand-text");
      if (brand) brand.textContent = cfg.brand;
      const name = document.querySelector(".sidebar-user .u-name");
      const role = document.querySelector(".sidebar-user .u-role");
      if (name) name.textContent = cfg.user;
      if (role) role.textContent = cfg.role;
    }
  };

  /* ---------- Modals ---------- */
  const openModal = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    document.body.style.overflow = "hidden";
    const first = m.querySelector("input:not([type=hidden]), select, textarea, button");
    if (first) setTimeout(() => first.focus(), 60);
  };

  const closeModal = (id) => {
    const m = typeof id === "string" ? document.getElementById(id) : id;
    if (!m) return;
    m.classList.remove("open");
    if (!document.querySelector(".modal-backdrop.open")) {
      document.body.style.overflow = "";
    }
  };

  const initModals = () => {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-modal-open]");
      if (opener) {
        e.preventDefault();
        openModal(opener.dataset.modalOpen);
        if (opener.dataset.prefill) {
          try {
            const data = JSON.parse(opener.dataset.prefill);
            const modal = document.getElementById(opener.dataset.modalOpen);
            Object.entries(data).forEach(([k, v]) => {
              const el = modal && modal.querySelector(`[name="${k}"]`);
              if (el) el.value = v;
            });
          } catch (_) {}
        }
        return;
      }
      const closer = e.target.closest("[data-modal-close]");
      if (closer) {
        e.preventDefault();
        closeModal(closer.dataset.modalClose || closer.closest(".modal-backdrop"));
        return;
      }
      if (e.target.classList.contains("modal-backdrop")) {
        closeModal(e.target);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const open = document.querySelector(".modal-backdrop.open");
        if (open) closeModal(open);
      }
    });
  };

  /* ---------- Tabs ---------- */
  const initTabs = () => {
    document.querySelectorAll("[data-tabs]").forEach((group) => {
      const btns = group.querySelectorAll(".tab-btn");
      const scopeId = group.dataset.tabs;
      const scope = scopeId ? document.getElementById(scopeId) : group.parentElement;
      btns.forEach((btn) => {
        btn.addEventListener("click", () => {
          btns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const target = btn.dataset.tab;
          if (!scope) return;
          scope.querySelectorAll(".tab-panel").forEach((p) => {
            p.classList.toggle("active", p.dataset.tabPanel === target);
          });
          // sync hash without jump
          history.replaceState(null, "", "#" + target);
        });
      });
      // activate from hash
      const hash = location.hash.replace("#", "");
      if (hash) {
        const btn = group.querySelector(`.tab-btn[data-tab="${hash}"]`);
        if (btn) btn.click();
      }
    });
  };

  /* ---------- Toasts ---------- */
  const toast = (title, msg = "", type = "success") => {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const icons = { success: "✓", error: "✕", info: "ℹ" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || "✓"}</span>
      <div>
        <div class="toast-title">${esc(title)}</div>
        ${msg ? `<div class="toast-msg">${esc(msg)}</div>` : ""}
      </div>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .25s, transform .25s";
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 260);
    }, 3400);
  };

  /* ---------- Fake save (backend swap point) ---------- */
  const fakeSave = (ms = 450) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Form helpers ---------- */
  const formValues = (formEl) => {
    const data = {};
    new FormData(formEl).forEach((v, k) => {
      if (data[k] === undefined) data[k] = v;
      else if (Array.isArray(data[k])) data[k].push(v);
      else data[k] = [data[k], v];
    });
    return data;
  };

  const resetForm = (formEl) => {
    if (formEl) formEl.reset();
  };

  const requireFields = (formEl) => {
    let ok = true;
    formEl.querySelectorAll("[required]").forEach((el) => {
      const bad = !el.value || !String(el.value).trim();
      el.style.borderColor = bad ? "var(--danger)" : "";
      if (bad) ok = false;
    });
    if (!ok) toast("Missing information", "Please fill in all required fields.", "error");
    return ok;
  };

  /* ---------- Misc ---------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const renderInto = (sel, html) => {
    const el = typeof sel === "string" ? qs(sel) : sel;
    if (el) el.innerHTML = html;
  };

  const emptyState = (icon, title, msg) => `
    <div class="empty-state">
      <div class="es-icon">${icon}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(msg)}</p>
    </div>`;

  const init = () => {
    initNav();
    initModals();
    initTabs();
  };

  document.addEventListener("DOMContentLoaded", init);

  return {
    PIPELINE,
    MILESTONES,
    STATUS_META,
    fmtDate,
    fmtDateTime,
    daysUntil,
    money,
    esc,
    uid,
    badge,
    renewalBadge,
    pipeline,
    nextStatus,
    openModal,
    closeModal,
    toast,
    fakeSave,
    formValues,
    resetForm,
    requireFields,
    qs,
    qsa,
    renderInto,
    emptyState,
  };
})();
