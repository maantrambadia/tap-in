(function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function setFieldError(field, message) {
    if (!field) return;
    field.classList.add("input-error");

    const id = field.id ? `err-${field.id}` : null;
    let el = id ? document.getElementById(id) : null;

    if (!el) {
      el = document.createElement("p");
      if (id) el.id = id;
      el.className = "field-error";
      field.insertAdjacentElement("afterend", el);
    }

    el.textContent = message;
  }

  function clearFieldError(field) {
    if (!field) return;
    field.classList.remove("input-error");

    const id = field.id ? `err-${field.id}` : null;
    const el = id ? document.getElementById(id) : null;
    if (el) el.remove();
  }

  function clearAllErrors(root = document) {
    $all(".input-error", root).forEach((el) =>
      el.classList.remove("input-error"),
    );
    $all(".field-error", root).forEach((el) => el.remove());
  }

  function showFormMessage(form, message, type) {
    if (!form) return;
    let el = $(".form-message", form);
    if (!el) {
      el = document.createElement("div");
      el.className = "form-message";
      form.insertAdjacentElement("afterbegin", el);
    }

    el.classList.remove("is-error", "is-success");
    el.classList.add(type === "success" ? "is-success" : "is-error");
    el.textContent = message;
  }

  function setAuth(role, email) {
    try {
      localStorage.setItem("tapin_auth", JSON.stringify({ role, email }));
    } catch (_) {
      // ignore
    }
  }

  function clearAuth() {
    try {
      localStorage.removeItem("tapin_auth");
    } catch (_) {
      // ignore
    }
  }

  function getAuth() {
    try {
      const raw = localStorage.getItem("tapin_auth");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function requireAuth(allowedRoles) {
    const auth = getAuth();
    if (!auth) {
      window.location.href = "../index.html";
      return;
    }

    if (
      Array.isArray(allowedRoles) &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(auth.role)
    ) {
      window.location.href = "../index.html";
    }
  }

  function parseDateInput(value) {
    const v = (value || "").trim();
    if (!v) return null;

    const d = new Date(`${v}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function initPasswordToggles() {
    const icons = $all(".password-field .eye-icon");
    icons.forEach((icon) => {
      const field = icon.closest(".password-field");
      const input = field ? $("input", field) : null;
      if (!input) return;

      function toggle() {
        input.type = input.type === "password" ? "text" : "password";
      }

      icon.addEventListener("click", toggle);
      icon.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function initLogin() {
    const form = $(".login-form");
    if (!form) return;

    const emailEl = $("#email", form);
    const passEl = $("#password", form);

    function validate() {
      clearAllErrors(form);

      const email = (emailEl?.value || "").trim();
      const password = passEl?.value || "";

      let ok = true;

      if (!email) {
        setFieldError(emailEl, "Email is required.");
        ok = false;
      } else if (!EMAIL_RE.test(email)) {
        setFieldError(emailEl, "Enter a valid email address.");
        ok = false;
      }

      if (!password) {
        setFieldError(passEl, "Password is required.");
        ok = false;
      } else if (password.length < 6) {
        setFieldError(passEl, "Password must be at least 6 characters.");
        ok = false;
      }

      return ok;
    }

    emailEl?.addEventListener("input", () => clearFieldError(emailEl));
    passEl?.addEventListener("input", () => clearFieldError(passEl));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) {
        showFormMessage(form, "Fix the errors and try again.", "error");
        return;
      }

      const email = (emailEl.value || "").trim().toLowerCase();
      const password = passEl.value;

      const USERS = [
        {
          email: "admin@tapin.com",
          password: "admin123",
          role: "admin",
          redirect: "pages/admin-dashboard.html",
        },
        {
          email: "employee@tapin.com",
          password: "emp123",
          role: "employee",
          redirect: "pages/dashboard.html",
        },
      ];

      const match = USERS.find(
        (u) => u.email === email && u.password === password,
      );
      if (!match) {
        showFormMessage(form, "Invalid email or password.", "error");
        return;
      }

      setAuth(match.role, match.email);
      window.location.href = match.redirect;
    });
  }

  function initLeave() {
    const form = $(".leave-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearAllErrors(form);

      const typeEl = $("#leave-type", form);
      const startEl = $("#start-date", form);
      const endEl = $("#end-date", form);
      const reasonEl = $("#reason", form);

      let ok = true;

      if (!typeEl?.value) {
        setFieldError(typeEl, "Select a leave type.");
        ok = false;
      }

      const start = parseDateInput(startEl?.value);
      if (!start) {
        setFieldError(startEl, "Select a start date.");
        ok = false;
      }

      const end = parseDateInput(endEl?.value);
      if (!end) {
        setFieldError(endEl, "Select an end date.");
        ok = false;
      }

      if (start && end && start > end) {
        setFieldError(endEl, "End date must be after start date.");
        ok = false;
      }

      const reason = (reasonEl?.value || "").trim();
      if (reason.length < 10) {
        setFieldError(reasonEl, "Reason must be at least 10 characters.");
        ok = false;
      }

      if (!ok) {
        showFormMessage(form, "Fix the errors and submit again.", "error");
        return;
      }

      showFormMessage(form, "Leave request submitted (demo).", "success");
      form.reset();
    });
  }

  function initAdminEmployeeModal() {
    const addBtn = $(".add-button");
    const modal = $(".add-employee-modal");
    const overlay = $(".modal-overlay");
    if (!addBtn || !modal || !overlay) return;

    const closeBtn = $(".modal-close", modal);
    const cancelBtn = $(".modal-cancel", modal);
    const form = $("#add-employee-form", modal);

    const nameEl = $("#emp-name", modal);
    const emailEl = $("#emp-email", modal);
    const idEl = $("#emp-id", modal);
    const deptEl = $("#emp-dept", modal);
    const statusEl = $("#emp-status", modal);
    const roleEl = $("#emp-role", modal);

    function open() {
      clearAllErrors(modal);
      overlay.hidden = false;
      modal.hidden = false;
      nameEl?.focus();
    }

    function close() {
      overlay.hidden = true;
      modal.hidden = true;
    }

    function validate() {
      clearAllErrors(modal);
      let ok = true;

      const name = (nameEl?.value || "").trim();
      const email = (emailEl?.value || "").trim();
      const empId = (idEl?.value || "").trim();
      const dept = deptEl?.value || "";
      const status = statusEl?.value || "";
      const role = (roleEl?.value || "").trim();

      if (!name) {
        setFieldError(nameEl, "Full name is required.");
        ok = false;
      }

      if (!email) {
        setFieldError(emailEl, "Email is required.");
        ok = false;
      } else if (!EMAIL_RE.test(email)) {
        setFieldError(emailEl, "Enter a valid email address.");
        ok = false;
      }

      if (!empId) {
        setFieldError(idEl, "Employee ID is required.");
        ok = false;
      } else if (!/^EMP-\d{4}$/i.test(empId)) {
        setFieldError(idEl, "Use format EMP-1234.");
        ok = false;
      }

      if (!dept) {
        setFieldError(deptEl, "Select a department.");
        ok = false;
      }

      if (!status) {
        setFieldError(statusEl, "Select a status.");
        ok = false;
      }

      if (!role) {
        setFieldError(roleEl, "Role is required.");
        ok = false;
      }

      return ok;
    }

    addBtn.addEventListener("click", open);
    overlay.addEventListener("click", close);
    closeBtn?.addEventListener("click", close);
    cancelBtn?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      alert("Employee added (demo).\nNo database connected.");
      form.reset();
      close();
    });
  }

  function initSettings() {
    const saveBtn = $(".save-button");
    if (!saveBtn) return;

    saveBtn.addEventListener("click", () => {
      const root = document;
      clearAllErrors(root);

      const fullName = $("#full-name");
      const workEmail = $("#work-email");
      const phone = $("#phone");
      const newPw = $("#new-password");
      const confirmPw = $("#confirm-password");

      let ok = true;

      if (fullName && !fullName.value.trim()) {
        setFieldError(fullName, "Full name is required.");
        ok = false;
      }

      if (workEmail && !EMAIL_RE.test(workEmail.value.trim())) {
        setFieldError(workEmail, "Enter a valid email address.");
        ok = false;
      }

      if (
        phone &&
        phone.value.trim() &&
        phone.value.replace(/[^0-9]/g, "").length < 10
      ) {
        setFieldError(phone, "Enter a valid phone number.");
        ok = false;
      }

      const pw1 = newPw?.value || "";
      const pw2 = confirmPw?.value || "";
      if (pw1 || pw2) {
        if (pw1.length < 8) {
          setFieldError(newPw, "New password must be at least 8 characters.");
          ok = false;
        }
        if (pw1 !== pw2) {
          setFieldError(confirmPw, "Passwords do not match.");
          ok = false;
        }
      }

      if (!ok) return;

      alert("Saved (demo).");
    });
  }

  function initLogout() {
    const logoutLinks = $all('a[href$="index.html"], a[href$="../index.html"]');
    logoutLinks.forEach((a) => {
      a.addEventListener("click", () => clearAuth());
    });
  }

  function initGuards() {
    const path = (window.location.pathname || "").toLowerCase();

    if (
      path.endsWith("/pages/admin-dashboard.html") ||
      path.endsWith("/pages/admin-employee-management.html") ||
      path.endsWith("/pages/admin-leave-approvals.html") ||
      path.endsWith("/pages/admin-attendance-overview.html") ||
      path.endsWith("/pages/admin-payroll-management.html")
    ) {
      requireAuth(["admin"]);
    }

    if (path.includes("/pages/") && !path.includes("/pages/admin-")) {
      requireAuth(["employee", "admin"]);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLogout();
    initGuards();
    initPasswordToggles();
    initLogin();
    initLeave();
    initAdminEmployeeModal();
    initSettings();
  });
})();
