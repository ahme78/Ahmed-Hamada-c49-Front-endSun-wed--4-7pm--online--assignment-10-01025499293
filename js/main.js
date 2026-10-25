// ^ Write your JavaScript code here
// ==========================================================
// Personal Portfolio - أحمد حماده أحمد
// Features:
//   1. Active nav link on scroll (scroll spy)
//   2. Dark / Light mode switch (class "dark" on <html>)
//   3. Portfolio tabs / filter (no Bootstrap)
//   4. Testimonials carousel / slider
//   5. Settings sidebar (theme colors + fonts)
//   6. Scroll to top button
//   + Mobile menu, custom selects, contact form
// ==========================================================

(function () {
  "use strict";

  // ---------- Helpers ----------
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage not available */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* storage not available */
      }
    },
  };

  const root = document.documentElement;

  // ==========================================================
  // 1) Dark Mode & Light Mode
  // ==========================================================
  const themeToggleBtn = $("#theme-toggle-button");

  function applyTheme(mode) {
    // dark mode => add class "dark" on <html>, light mode => remove it
    root.classList.toggle("dark", mode === "dark");
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute("aria-pressed", String(mode === "dark"));
    }
  }

  function initTheme() {
    const saved = storage.get("portfolio-theme");
    applyTheme(saved === "light" || saved === "dark" ? saved : "dark");

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const next = root.classList.contains("dark") ? "light" : "dark";
        applyTheme(next);
        storage.set("portfolio-theme", next);
      });
    }
  }

  // ==========================================================
  // 2) Scroll Spy - change active nav link while scrolling
  // ==========================================================
  const navLinks = $$(".nav-links a[href^='#']");
  const sections = $$("main > section[id]");

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function updateActiveLink() {
    const linkedIds = navLinks.map((l) => l.getAttribute("href").slice(1));
    const offset = 140; // a bit more than the fixed navbar height
    const scrollPos = window.scrollY + offset;
    let currentId = linkedIds[0];

    sections.forEach((section) => {
      // sections without a nav link (skills, statistics) keep the previous link active
      if (linkedIds.includes(section.id) && section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    // reached the bottom of the page => last link (contact)
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) currentId = linkedIds[linkedIds.length - 1];

    setActiveLink(currentId);
  }

  // ==========================================================
  // 3) Mobile menu
  // ==========================================================
  const mobileBtn = $("#mobile-menu-btn");
  const navLinksBox = $("#nav-links");

  function setMobileMenu(open) {
    if (!mobileBtn || !navLinksBox) return;
    navLinksBox.classList.toggle("active", open);
    mobileBtn.setAttribute("aria-expanded", String(open));
    mobileBtn.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    const icon = $("i", mobileBtn);
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
  }

  function initMobileMenu() {
    if (!mobileBtn || !navLinksBox) return;
    mobileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileMenu(!navLinksBox.classList.contains("active"));
    });
    navLinks.forEach((link) => link.addEventListener("click", () => setMobileMenu(false)));
    document.addEventListener("click", (e) => {
      if (!navLinksBox.contains(e.target) && !mobileBtn.contains(e.target)) {
        setMobileMenu(false);
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) setMobileMenu(false);
    });
  }

  // ==========================================================
  // 4) Portfolio - Navs & Tabs (filter)
  // ==========================================================
  const filterButtons = $$(".portfolio-filter");
  const portfolioItems = $$(".portfolio-item");

  const FILTER_ACTIVE =
    "bg-linear-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/50";
  const FILTER_INACTIVE =
    "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700";

  function setFilterButtonState(btn, active) {
    btn.classList.remove(...FILTER_ACTIVE.split(" "), ...FILTER_INACTIVE.split(" "));
    btn.classList.add(...(active ? FILTER_ACTIVE : FILTER_INACTIVE).split(" "));
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  }

  function filterPortfolio(category) {
    portfolioItems.forEach((item) => {
      const show = category === "all" || item.dataset.category === category;
      item.classList.toggle("hidden", !show);
      item.classList.remove("fade-in");
      if (show) {
        void item.offsetWidth; // restart the animation
        item.classList.add("fade-in");
      }
    });
  }

  function initPortfolioTabs() {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => setFilterButtonState(b, b === btn));
        filterPortfolio(btn.dataset.filter);
      });
    });
  }

  // ==========================================================
  // 5) Testimonials Carousel
  // ==========================================================
  const track = $("#testimonials-carousel");
  const cards = track ? $$(".testimonial-card", track) : [];
  const nextBtn = $("#next-testimonial");
  const prevBtn = $("#prev-testimonial");
  const indicatorsBox = $("#carousel-indicators");

  const carousel = { index: 0, timer: null, autoplayDelay: 5000 };

  function cardsPerView() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, cards.length - cardsPerView());
  }

  function renderIndicators() {
    if (!indicatorsBox) return;
    indicatorsBox.innerHTML = "";
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className =
        "carousel-indicator w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 transition-all duration-300 hover:scale-125 cursor-pointer";
      dot.dataset.index = String(i);
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "التوصية " + (i + 1));
      dot.setAttribute("aria-selected", "false");
      dot.addEventListener("click", () => {
        goTo(i);
        restartAutoplay();
      });
      indicatorsBox.appendChild(dot);
    }
  }

  function goTo(index) {
    carousel.index = Math.min(Math.max(index, 0), maxIndex());

    // RTL page: the next cards are on the left, so the track moves to the right (+)
    const direction = getComputedStyle(root).direction === "rtl" ? 1 : -1;
    const step = 100 / cardsPerView();
    track.style.transform = `translateX(${direction * carousel.index * step}%)`;

    $$(".carousel-indicator", indicatorsBox).forEach((dot, i) => {
      const active = i === carousel.index;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-selected", String(active));
    });
  }

  function nextSlide() {
    goTo(carousel.index >= maxIndex() ? 0 : carousel.index + 1);
  }

  function prevSlide() {
    goTo(carousel.index <= 0 ? maxIndex() : carousel.index - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    carousel.timer = setInterval(nextSlide, carousel.autoplayDelay);
  }

  function stopAutoplay() {
    clearInterval(carousel.timer);
    carousel.timer = null;
  }

  function restartAutoplay() {
    startAutoplay();
  }

  function initCarousel() {
    if (!track || cards.length === 0) return;

    renderIndicators();
    goTo(0);

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        nextSlide();
        restartAutoplay();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prevSlide();
        restartAutoplay();
      });
    }

    // keyboard arrows while the carousel has focus
    track.parentElement.parentElement.addEventListener("keydown", (e) => {
      const rtl = getComputedStyle(root).direction === "rtl";
      if (e.key === "ArrowLeft") (rtl ? nextSlide : prevSlide)();
      if (e.key === "ArrowRight") (rtl ? prevSlide : nextSlide)();
    });

    // pause autoplay on hover / focus
    const area = track.parentElement.parentElement;
    area.addEventListener("mouseenter", stopAutoplay);
    area.addEventListener("mouseleave", startAutoplay);
    area.addEventListener("focusin", stopAutoplay);
    area.addEventListener("focusout", startAutoplay);

    // swipe on touch screens
    let startX = 0;
    let startY = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        const rtl = getComputedStyle(root).direction === "rtl";
        // RTL: swipe right => next, LTR: swipe left => next
        if ((dx > 0) === rtl) nextSlide();
        else prevSlide();
        restartAutoplay();
      },
      { passive: true }
    );

    // recalculate when the number of visible cards changes
    let lastPerView = cardsPerView();
    window.addEventListener("resize", () => {
      const current = cardsPerView();
      if (current !== lastPerView) {
        lastPerView = current;
        renderIndicators();
      }
      goTo(carousel.index);
    });

    // don't run in a hidden tab
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    startAutoplay();
  }

  // ==========================================================
  // 6) Settings Sidebar (theme colors + fonts)
  // ==========================================================
  const settingsToggle = $("#settings-toggle");
  const settingsSidebar = $("#settings-sidebar");
  const closeSettingsBtn = $("#close-settings");
  const resetBtn = $("#reset-settings");
  const colorsGrid = $("#theme-colors-grid");
  const fontOptions = $$(".font-option");

  const SIDEBAR_WIDTH = "20rem"; // w-80
  const DEFAULT_FONT = "tajawal";
  const FONT_CLASSES = ["font-alexandria", "font-tajawal", "font-cairo"];

  // accent of the original design is #a855f7
  const COLOR_THEMES = [
    { name: "بنفسجي", primary: "#6366f1", secondary: "#8b5cf6", accent: "#a855f7", isDefault: true },
    { name: "أزرق", primary: "#3b82f6", secondary: "#6366f1", accent: "#06b6d4" },
    { name: "سماوي", primary: "#06b6d4", secondary: "#0ea5e9", accent: "#3b82f6" },
    { name: "أخضر", primary: "#10b981", secondary: "#14b8a6", accent: "#06b6d4" },
    { name: "وردي", primary: "#ec4899", secondary: "#d946ef", accent: "#f43f5e" },
    { name: "أحمر", primary: "#ef4444", secondary: "#f43f5e", accent: "#f97316" },
    { name: "برتقالي", primary: "#f97316", secondary: "#f59e0b", accent: "#ef4444" },
    { name: "ذهبي", primary: "#eab308", secondary: "#f59e0b", accent: "#f97316" },
  ];

  function setSidebar(open) {
    if (!settingsSidebar || !settingsToggle) return;
    settingsSidebar.classList.toggle("translate-x-full", !open);
    settingsSidebar.setAttribute("aria-hidden", String(!open));
    settingsSidebar.inert = !open;
    settingsToggle.setAttribute("aria-expanded", String(open));
    // the gear button slides together with the sidebar
    settingsToggle.style.right = open ? SIDEBAR_WIDTH : "0";
  }

  function applyColorTheme(theme, save = true) {
    root.classList.add("theme-changing");
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-secondary", theme.secondary);
    root.style.setProperty("--color-accent", theme.accent);

    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.primary);

    $$(".color-swatch", colorsGrid).forEach((sw) => {
      const active = sw.dataset.primary === theme.primary;
      sw.classList.toggle("active", active);
      sw.setAttribute("aria-checked", String(active));
    });

    if (save) storage.set("portfolio-color", theme.primary);
    setTimeout(() => root.classList.remove("theme-changing"), 350);
  }

  function renderColorSwatches() {
    if (!colorsGrid) return;
    colorsGrid.innerHTML = "";
    colorsGrid.setAttribute("role", "radiogroup");

    COLOR_THEMES.forEach((theme) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "color-swatch";
      swatch.dataset.primary = theme.primary;
      swatch.style.background = `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`;
      swatch.style.setProperty("--swatch", theme.primary);
      swatch.setAttribute("role", "radio");
      swatch.setAttribute("aria-checked", "false");
      swatch.setAttribute("aria-label", theme.name);
      swatch.title = theme.name;
      swatch.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
      swatch.addEventListener("click", () => applyColorTheme(theme));
      colorsGrid.appendChild(swatch);
    });
  }

  function applyFont(font, save = true) {
    document.body.classList.remove(...FONT_CLASSES);
    document.body.classList.add("font-" + font);

    fontOptions.forEach((btn) => {
      const active = btn.dataset.font === font;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-checked", String(active));
    });

    if (save) storage.set("portfolio-font", font);
  }

  function resetSettings() {
    storage.remove("portfolio-color");
    storage.remove("portfolio-font");
    // default theme values are identical to the CSS defaults
    applyColorTheme(COLOR_THEMES.find((t) => t.isDefault), false);
    applyFont(DEFAULT_FONT, false);
  }

  function initSettings() {
    if (!settingsSidebar || !settingsToggle) return;

    renderColorSwatches();

    // restore saved settings
    const savedPrimary = storage.get("portfolio-color");
    const savedTheme =
      COLOR_THEMES.find((t) => t.primary === savedPrimary) ||
      COLOR_THEMES.find((t) => t.isDefault);
    applyColorTheme(savedTheme, false);

    const savedFont = storage.get("portfolio-font");
    const validFont = fontOptions.some((b) => b.dataset.font === savedFont);
    applyFont(validFont ? savedFont : DEFAULT_FONT, false);

    setSidebar(false);

    settingsToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setSidebar(settingsSidebar.classList.contains("translate-x-full"));
    });
    if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", () => setSidebar(false));

    fontOptions.forEach((btn) => {
      btn.addEventListener("click", () => applyFont(btn.dataset.font));
    });

    if (resetBtn) resetBtn.addEventListener("click", resetSettings);

    // close when clicking outside / pressing Escape
    document.addEventListener("click", (e) => {
      const isOpen = !settingsSidebar.classList.contains("translate-x-full");
      if (isOpen && !settingsSidebar.contains(e.target) && !settingsToggle.contains(e.target)) {
        setSidebar(false);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setSidebar(false);
    });
  }

  // ==========================================================
  // 7) Scroll To Top button
  // ==========================================================
  const scrollTopBtn = $("#scroll-to-top");

  function toggleScrollTopBtn() {
    if (!scrollTopBtn) return;
    const show = window.scrollY > 400;
    scrollTopBtn.classList.toggle("opacity-0", !show);
    scrollTopBtn.classList.toggle("invisible", !show);
    scrollTopBtn.classList.toggle("opacity-100", show);
    scrollTopBtn.classList.toggle("visible", show);
  }

  function initScrollTop() {
    if (!scrollTopBtn) return;
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ==========================================================
  // 8) Custom selects + contact form
  // ==========================================================
  const customSelects = $$(".custom-select");

  function closeSelect(select) {
    const options = $(".custom-options", select.parentElement);
    const chevron = $(".fa-chevron-down", select);
    options.classList.add("hidden");
    select.setAttribute("aria-expanded", "false");
    if (chevron) chevron.style.transform = "";
  }

  function openSelect(select) {
    customSelects.forEach((s) => s !== select && closeSelect(s));
    const options = $(".custom-options", select.parentElement);
    const chevron = $(".fa-chevron-down", select);
    options.classList.remove("hidden");
    select.setAttribute("aria-expanded", "true");
    if (chevron) chevron.style.transform = "rotate(180deg)";
  }

  function chooseOption(select, option) {
    const wrapper = select.parentElement;
    const label = $(".selected-text", select);
    label.textContent = option.dataset.value;
    label.classList.remove("text-slate-500", "dark:text-slate-400");
    label.classList.add("text-slate-800", "dark:text-white");

    $$(".custom-option", wrapper).forEach((o) => {
      const selected = o === option;
      o.classList.toggle("selected", selected);
      o.setAttribute("aria-selected", String(selected));
    });

    let hidden = $('input[type="hidden"]', wrapper);
    if (!hidden) {
      hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = select.dataset.name;
      wrapper.appendChild(hidden);
    }
    hidden.value = option.dataset.value;
    closeSelect(select);
  }

  function initCustomSelects() {
    customSelects.forEach((select) => {
      const wrapper = select.parentElement;
      const options = $$(".custom-option", wrapper);

      select.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = select.getAttribute("aria-expanded") === "true";
        isOpen ? closeSelect(select) : openSelect(select);
      });

      select.addEventListener("keydown", (e) => {
        const isOpen = select.getAttribute("aria-expanded") === "true";
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isOpen ? closeSelect(select) : openSelect(select);
        } else if (e.key === "Escape") {
          closeSelect(select);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const currentIndex = options.findIndex((o) => o.classList.contains("selected"));
          const step = e.key === "ArrowDown" ? 1 : -1;
          const nextIndex = (currentIndex + step + options.length) % options.length;
          chooseOption(select, options[nextIndex]);
          openSelect(select);
        }
      });

      options.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          chooseOption(select, option);
        });
      });
    });

    document.addEventListener("click", () => customSelects.forEach(closeSelect));
  }

  function initContactForm() {
    const form = $("#contact form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      const original = btn.innerHTML;

      btn.innerHTML = '<i class="fa-solid fa-check me-2" aria-hidden="true"></i> تم إرسال رسالتك بنجاح';
      btn.disabled = true;

      form.reset();
      customSelects.forEach((select) => {
        const label = $(".selected-text", select);
        label.textContent = select.dataset.name === "budget" ? "اختر الميزانية" : "اختر نوع المشروع";
        label.classList.add("text-slate-500", "dark:text-slate-400");
        label.classList.remove("text-slate-800", "dark:text-white");
        $$(".custom-option", select.parentElement).forEach((o) => o.classList.remove("selected"));
        const hidden = $('input[type="hidden"]', select.parentElement);
        if (hidden) hidden.remove();
      });

      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 3000);
    });
  }

  // ==========================================================
  // Scroll handler (one listener, throttled with rAF)
  // ==========================================================
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActiveLink();
      toggleScrollTopBtn();
      ticking = false;
    });
  }

  // ==========================================================
  // Init
  // ==========================================================
  function init() {
    initTheme();
    initMobileMenu();
    initPortfolioTabs();
    initCarousel();
    initSettings();
    initScrollTop();
    initCustomSelects();
    initContactForm();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActiveLink();
    toggleScrollTopBtn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();