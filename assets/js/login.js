/* ============================================================
   LOGISTICS UI — Login page logic (mock auth)
   Validates against DB.users, opens a session and routes by role.
   ============================================================ */

const Login = (() => {
  "use strict";

  const DEMO = {
    admin:  { email: "adefemi.bakare@insurlogix.com", password: "admin123" },
    rider:  { email: "tunde.bakare@dispatch.com",     password: "rider123" },
    client: { email: "adaeze.okafor@gmail.com",       password: "client123" },
  };

  const initials = (name) =>
    String(name || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

  const setRole = (role) => {
    if (!DEMO[role]) role = "admin";
    App.qsa(".role-tab").forEach((b) => b.classList.toggle("active", b.dataset.role === role));
    const demo = DEMO[role];
    const email = App.qs("#loginEmail");
    const pw = App.qs("#loginPassword");
    if (email) email.value = demo.email;
    if (pw) pw.value = demo.password;
    const creds = App.qs("#demoCreds");
    if (creds) creds.textContent = demo.email + " / " + demo.password;
    localStorage.setItem("insurlogix.loginRole", role);
  };

  const bind = () => {
    const roleParam = new URLSearchParams(location.search).get("role");
    setRole(localStorage.getItem("insurlogix.loginRole") || roleParam || "admin");

    App.qsa(".role-tab").forEach((b) => {
      b.addEventListener("click", () => setRole(b.dataset.role));
    });

    const toggle = App.qs("[data-toggle-pw]");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const pw = App.qs("#loginPassword");
        const showNow = pw.type === "password";
        pw.type = showNow ? "text" : "password";
        toggle.textContent = showNow ? "Hide" : "Show";
      });
    }

    const urlRole = new URLSearchParams(location.search).get("role");
    if (urlRole) localStorage.setItem("insurlogix.loginRole", urlRole);
  };

  const submit = (e) => {
    e.preventDefault();
    const email = App.qs("#loginEmail").value;
    const password = App.qs("#loginPassword").value;

    const user = DB.findByCredentials(email, password);
    if (!user) {
      App.qs("#loginEmail").style.borderColor = "var(--danger)";
      App.qs("#loginPassword").style.borderColor = "var(--danger)";
      App.toast("Sign in failed", "Unknown email or incorrect password.", "error");
      return;
    }
    if (user.status !== "Active") {
      App.toast("Account inactive", `${user.name} has been deactivated. Contact your administrator.`, "error");
      return;
    }

    const portal = DB.portalForRole(user.roleId);
    App.session.set({
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleLabel: DB.getRole(user.roleId)?.name || user.roleId,
      portal,
      initials: initials(user.name),
    });
    App.toast("Signed in", `Welcome, ${user.name.split(" ")[0]}.`);

    setTimeout(() => {
      const redirect = new URLSearchParams(location.search).get("redirect");
      if (redirect && /^(admin|rider|client)\/[a-z-]+\.html$/.test(redirect)) {
        location.href = redirect;
      } else {
        location.href = portal + "/dashboard.html";
      }
    }, 650);
  };

  bind();

  return { submit };
})();