/* URCH Foods — E-commerce Website Scripts */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     1. SMOOTH SCROLL
     ───────────────────────────────────────────── */

  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var hash = link.getAttribute("href");
    if (!hash || hash === "#") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    var target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ─────────────────────────────────────────────
     2. NAV SCROLL EFFECT
     ───────────────────────────────────────────── */

  var mainNav = document.getElementById("mainNav");

  function handleNavScroll() {
    if (!mainNav) return;
    if (window.scrollY > 40) {
      mainNav.classList.add("scrolled");
    } else {
      mainNav.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleNavScroll, { passive: true });
  handleNavScroll();

  /* ─────────────────────────────────────────────
     2.5 CUSTOMER SESSION + NAV AUTH STATE
     ───────────────────────────────────────────── */

  var SESSION_KEY = "urch_user";
  var WISHLIST_KEY = "urch_wishlist";
  var NAV_USER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';

  function getSessionUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function saveSessionUser(user) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (err) {}
  }

  function clearSessionUser() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {}
  }

  function updateNavAuth() {
    var link = document.querySelector(".nav-signin");
    if (!link) return;
    var user = getSessionUser();
    if (user) {
      link.href = "account.html";
      link.setAttribute("aria-label", "My account");
      link.innerHTML = NAV_USER_SVG + " My Account";
    } else {
      link.href = "login.html";
      link.setAttribute("aria-label", "Sign in to your account");
      link.innerHTML = NAV_USER_SVG + " Sign in";
    }
  }

  updateNavAuth();

  function getWishlist() {
    try {
      var raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch (err) {}
  }

  function isSaved(name) {
    return getWishlist().indexOf(name) !== -1;
  }

  function toggleSave(name) {
    var list = getWishlist();
    var idx = list.indexOf(name);
    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      list.push(name);
    }
    saveWishlist(list);
    return list.indexOf(name) !== -1;
  }

  /* ─────────────────────────────────────────────
     3. MOBILE MENU
     ───────────────────────────────────────────── */

  var hamburger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");

  function openMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add("open");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (hamburger) {
    hamburger.addEventListener("click", toggleMobileMenu);
  }

  if (mobileMenu) {
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMobileMenu();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu && mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    }
  });

  /* ─────────────────────────────────────────────
     3.5 PRODUCT CATALOG + STORE RENDER
     ───────────────────────────────────────────── */

  var CATALOG_KEY = "urch_products";
  var CATALOG_VERSION_KEY = "urch_products_version";
  var CATALOG_VERSION = 2;
  var EVENTS_KEY = "urch_events";

  var DEFAULT_PRODUCTS = [
    {
      id: "okpa",
      name: "Okpa Flour",
      price: 2500,
      unit: "pack",
      categories: ["flagship", "flour"],
      tag: "Flagship",
      desc: "Premium instant Okpa mix — the beloved Igbo delicacy made easy. Rich, authentic flavour with every bite.",
      img: "images/Products/OkpaFlower.png",
    },
    {
      id: "abacha",
      name: "Abacha (African Salad)",
      price: 2000,
      unit: "pack",
      categories: ["flagship", "traditional"],
      tag: "Flagship",
      desc: "Authentic dried shredded cassava for the classic African Salad. Premium quality, clean, and ready to prepare.",
      img: "images/product-02.jpg",
    },
    {
      id: "achicha",
      name: "Achicha",
      price: 1800,
      unit: "pack",
      categories: ["flagship", "traditional"],
      tag: "Flagship",
      desc: "Traditional dried cocoyam — a cherished staple from Nsukka. Perfectly processed to preserve authentic taste.",
      img: "images/Products/Achicha.png",
    },
    {
      id: "akpu",
      name: "Akpu Flour (Fufu Flour)",
      price: 2200,
      unit: "pack",
      categories: ["flour"],
      tag: "",
      desc: "Smooth, stretchy instant fufu flour — perfect for pairing with Egusi, Oha, or any soup of your choice.",
      img: "images/product-01.jpg",
    },
    {
      id: "agbugbu",
      name: "Agbugbu (Fio-Fio)",
      price: 1600,
      unit: "pack",
      categories: ["traditional"],
      tag: "",
      desc: "Whole pigeon peas — a protein-rich Igbo staple. Great for soups, porridges, and traditional dishes.",
      img: "images/Products/Agbugbu.png",
    },
    {
      id: "akidi",
      name: "Akidi Oji",
      price: 1500,
      unit: "pack",
      categories: ["traditional"],
      tag: "",
      desc: "Premium black-eyed cowpeas — versatile, nutritious, and essential for authentic Igbo soups and stews.",
      img: "images/Products/AkidiOji.png",
    },
    {
      id: "palm-oil",
      name: "Palm Oil",
      price: 3000,
      unit: "bottle",
      categories: ["essentials"],
      tag: "",
      desc: "Pure, unrefined Nigerian palm oil — rich in flavour and colour. The essential base for every traditional dish.",
      img: "images/product-01.jpg",
    },
    {
      id: "okpeye",
      name: "Okp\u00e9ye Nsukka",
      price: 1200,
      unit: "pack",
      categories: ["essentials", "traditional"],
      tag: "",
      desc: "Authentic Nsukka seasoning — the secret behind the rich, earthy depth of traditional Igbo soups and stews.",
      img: "images/product-02.jpg",
    },
  ];

  function migrateCatalog(list) {
    var merged = Array.isArray(list) ? list.slice() : [];
    var seen = {};
    merged.forEach(function (p) {
      if (p && p.id) seen[p.id] = true;
    });
    DEFAULT_PRODUCTS.forEach(function (d) {
      var existing = null;
      for (var i = 0; i < merged.length; i++) {
        if (merged[i] && merged[i].id === d.id) { existing = merged[i]; break; }
      }
      if (existing) {
        existing.name = d.name;
        existing.price = d.price;
        existing.unit = d.unit;
        existing.categories = d.categories;
        existing.tag = d.tag;
        existing.desc = d.desc;
        existing.img = d.img;
      } else {
        merged.push(d);
      }
    });
    return merged;
  }

  function getProducts() {
    var list = null;
    try {
      var raw = localStorage.getItem(CATALOG_KEY);
      if (raw === null) {
        seedProducts();
        raw = localStorage.getItem(CATALOG_KEY);
      }
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      if (localStorage.getItem(CATALOG_VERSION_KEY) !== String(CATALOG_VERSION)) {
        list = migrateCatalog(list);
        saveProducts(list);
        localStorage.setItem(CATALOG_VERSION_KEY, String(CATALOG_VERSION));
      }
    } catch (err) {
      list = DEFAULT_PRODUCTS.slice();
    }
    return Array.isArray(list) ? list : DEFAULT_PRODUCTS.slice();
  }

  function seedProducts() {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem(CATALOG_VERSION_KEY, String(CATALOG_VERSION));
    } catch (err) {}
  }

  function saveProducts(list) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
    } catch (err) {}
  }

  function trackEvent(type, name, meta) {
    try {
      var events = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
      if (!Array.isArray(events)) events = [];
      events.push({ type: type, name: name || "", ts: Date.now(), meta: meta || "" });
      if (events.length > 1000) events = events.slice(-1000);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch (err) {}
  }

  function formatNaira(amount) {
    return "\u20A6" + Number(amount).toLocaleString("en-NG");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function productCardHTML(p, opts) {
    opts = opts || {};
    var catStr = (p.categories || []).join(" ");
    var img = p.img || "images/product-01.jpg";
    var unit = p.unit || "pack";
    var revealCls =
      "product-card" +
      (opts.reveal ? " reveal" : "") +
      (opts.revealDelay ? " reveal-delay-" + opts.revealDelay : "");

    return (
      '<div class="' + revealCls + '"' +
        ' data-category="' + escapeHtml(catStr) + '"' +
        ' data-price="' + (Number(p.price) || 0) + '"' +
        ' data-name="' + escapeHtml(p.name) + '">' +
        '<div class="product-img">' +
          (p.tag ? '<div class="product-tag">' + escapeHtml(p.tag) + "</div>" : "") +
          '<button type="button" class="product-save' + (isSaved(p.name) ? " saved" : "") + '"' +
            ' data-save="' + escapeHtml(p.name) + '"' +
            ' aria-label="' + (isSaved(p.name) ? "Remove from saved items" : "Save to wishlist") + '">' +
            '<svg viewBox="0 0 24 24" fill="' + (isSaved(p.name) ? "currentColor" : "none") + '"' +
              ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>' +
            "</svg>" +
          "</button>" +
          '<div class="product-img-placeholder">' +
            '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" />' +
          "</div>" +
        "</div>" +
        '<div class="product-body">' +
          '<h3 class="product-name">' + escapeHtml(p.name) + "</h3>" +
          '<p class="product-desc">' + escapeHtml(p.desc || "") + "</p>" +
          '<div class="product-footer">' +
            '<div class="product-price">' + formatNaira(p.price) + ' <small>/ ' + escapeHtml(unit) + "</small></div>" +
            '<button class="btn-add-cart add-to-cart" data-name="' + escapeHtml(p.name) + '"' +
              ' data-price="' + (Number(p.price) || 0) + '" data-unit="' + escapeHtml(unit) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>' +
              "Add to Cart" +
            "</button>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderShopGrid() {
    var grid = document.getElementById("shopGrid");
    if (!grid) return;
    var products = getProducts();
    grid.innerHTML = products
      .map(function (p) {
        return productCardHTML(p, { reveal: true });
      })
      .join("");
    products.forEach(function (p) {
      trackEvent("view", p.name);
    });
    var countEl = document.getElementById("resultCount");
    if (countEl) {
      countEl.textContent =
        products.length + " product" + (products.length !== 1 ? "s" : "");
    }
  }

  function renderHomeProducts() {
    var grid = document.getElementById("homeProductsGrid");
    if (!grid) return;
    var products = getProducts();
    var featured = products
      .filter(function (p) {
        return (p.categories || []).indexOf("flagship") !== -1;
      })
      .concat(
        products.filter(function (p) {
          return (p.categories || []).indexOf("flagship") === -1;
        })
      )
      .slice(0, 3);
    grid.innerHTML = featured
      .map(function (p, i) {
        return productCardHTML(p, { reveal: true, revealDelay: i + 1 });
      })
      .join("");
  }

  renderShopGrid();
  renderHomeProducts();

  /* ─────────────────────────────────────────────
     4. SCROLL REVEAL
     ───────────────────────────────────────────── */

  var revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealElements.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    revealElements.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  /* ─────────────────────────────────────────────
     5. CART FUNCTIONALITY
     ───────────────────────────────────────────── */

  // Update this with your WhatsApp business number (international format, digits only).
  var WHATSAPP_NUMBER = "2348012345678";

  var whatsappFloat = document.getElementById("whatsappFloat");
  if (whatsappFloat) {
    whatsappFloat.setAttribute(
      "href",
      "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent("Hello URCH Foods! I have a question.")
    );
  }

  var CART_STORAGE_KEY = "urch_cart";
  var cart = [];
  var cartCountEl = document.getElementById("cartCount");

  var cartDrawer = document.getElementById("cartDrawer");
  var cartOverlay = document.getElementById("cartOverlay");
  var cartDrawerClose = document.getElementById("cartDrawerClose");
  var cartDrawerItems = document.getElementById("cartDrawerItems");
  var cartDrawerEmpty = document.getElementById("cartDrawerEmpty");
  var cartDrawerFooter = document.getElementById("cartDrawerFooter");
  var cartDrawerBadge = document.getElementById("cartDrawerBadge");
  var cartSubtotalEl = document.getElementById("cartSubtotal");
  var cartCheckoutBtn = document.getElementById("cartCheckout");
  var cartCheckoutTotal = document.getElementById("cartCheckoutTotal");

  function loadCart() {
    try {
      var saved = localStorage.getItem(CART_STORAGE_KEY);
      cart = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch (err) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {}
  }

  function cartQuantity() {
    return cart.reduce(function (sum, item) {
      return sum + (Number(item.quantity) || 0);
    }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  }

  function renderCart() {
    if (!cartDrawerItems) return;

    cartDrawerItems.innerHTML = cart
      .map(function (item) {
        return (
          '<div class="cart-item">' +
            '<div>' +
              '<div class="cart-item-name">' + escapeHtml(item.name) + "</div>" +
              '<div class="cart-item-price">' +
                formatNaira(item.price) +
                (item.unit ? " / " + escapeHtml(item.unit) : "") +
              "</div>" +
            "</div>" +
            '<div class="cart-item-qty">' +
              '<button type="button" class="cart-qty-minus" data-name="' + escapeHtml(item.name) + '" aria-label="Decrease quantity">\u2212</button>' +
              '<span>' + item.quantity + "</span>" +
              '<button type="button" class="cart-qty-plus" data-name="' + escapeHtml(item.name) + '" aria-label="Increase quantity">+</button>' +
            "</div>" +
            '<button type="button" class="cart-item-remove" data-name="' + escapeHtml(item.name) + '">Remove</button>' +
          "</div>"
        );
      })
      .join("");

    var hasItems = cart.length > 0;
    if (cartDrawerEmpty) cartDrawerEmpty.hidden = hasItems;
    if (cartDrawerItems) cartDrawerItems.hidden = !hasItems;
    if (cartDrawerFooter) cartDrawerFooter.hidden = !hasItems;
    if (cartDrawerBadge) cartDrawerBadge.textContent = cartQuantity();

    var subtotal = cartSubtotal();
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatNaira(subtotal);
    if (cartCheckoutTotal) cartCheckoutTotal.textContent = formatNaira(subtotal);
    if (cartCheckoutBtn) cartCheckoutBtn.disabled = !hasItems;
  }

  function updateCartBadge() {
    if (!cartCountEl) return;
    var total = cartQuantity();
    cartCountEl.textContent = total;
    if (total > 0) {
      cartCountEl.style.display = "flex";
    } else {
      cartCountEl.style.display = "none";
    }
  }

  function showToast(message) {
    var existing = document.querySelector(".urch-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "urch-toast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1A2A1E;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;z-index:9999;opacity:0;transition:opacity .3s ease;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.25);";
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = "1";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2200);
  }

  function addToCart(name, price, unit) {
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        existing = cart[i];
        break;
      }
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name: name, price: price, quantity: 1, unit: unit || "pack" });
    }

    saveCart();
    updateCartBadge();
    renderCart();
    trackEvent("add_to_cart", name);
    showToast(name + " added to cart");
  }

  function changeQuantity(name, delta) {
    var item = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        item = cart[i];
        break;
      }
    }
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(function (c) {
        return c.name !== name;
      });
    }

    saveCart();
    updateCartBadge();
    renderCart();
  }

  function removeFromCart(name) {
    cart = cart.filter(function (c) {
      return c.name !== name;
    });
    saveCart();
    updateCartBadge();
    renderCart();
    showToast("Removed from cart");
  }

  // Add-to-cart buttons
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    var name = btn.getAttribute("data-name") || "Item";
    var price = parseFloat(btn.getAttribute("data-price")) || 0;
    var unit = btn.getAttribute("data-unit") || "pack";
    addToCart(name, price, unit);
  });

  // Save / unsave items
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".product-save");
    if (!btn) return;

    var name = btn.getAttribute("data-save") || "";
    if (!name) return;
    var nowSaved = toggleSave(name);

    btn.classList.toggle("saved", nowSaved);
    btn.setAttribute(
      "aria-label",
      nowSaved ? "Remove from saved items" : "Save to wishlist"
    );
    var heart = btn.querySelector("svg");
    if (heart) heart.setAttribute("fill", nowSaved ? "currentColor" : "none");

    showToast(nowSaved ? name + " saved" : name + " removed from saved");

    if (document.getElementById("savedList")) renderAccountSaved();
    if (document.getElementById("overviewStats")) renderAccountOverview();
  });

  // Quantity / remove controls inside the cart drawer
  document.addEventListener("click", function (e) {
    var plus = e.target.closest(".cart-qty-plus");
    var minus = e.target.closest(".cart-qty-minus");
    var remove = e.target.closest(".cart-item-remove");

    if (plus) {
      changeQuantity(plus.getAttribute("data-name"), 1);
    } else if (minus) {
      changeQuantity(minus.getAttribute("data-name"), -1);
    } else if (remove) {
      removeFromCart(remove.getAttribute("data-name"));
    }
  });

  // Open / close the cart drawer
  var cartIcon = document.getElementById("cartIcon");

  function openCart() {
    if (cartDrawer) cartDrawer.classList.add("open");
    if (cartOverlay) cartOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove("open");
    if (cartOverlay) cartOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (cartIcon) {
    cartIcon.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openCart();
    });
  }

  if (cartDrawerClose) {
    cartDrawerClose.addEventListener("click", closeCart);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCart);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCart();
  });

  // Checkout via WhatsApp
  function checkout() {
    if (!cart.length) return;

    var lines = cart.map(function (item) {
      return (
        "\u2022 " +
        item.name +
        " x" +
        item.quantity +
        " \u2014 " +
        formatNaira(Number(item.price) * Number(item.quantity))
      );
    });

    var message =
      "Hello URCH Foods! I'd like to place an order:\n\n" +
      lines.join("\n") +
      "\n\nTotal: " +
      formatNaira(cartSubtotal());

    trackEvent("checkout_click", "WhatsApp order", formatNaira(cartSubtotal()));
    queueReviewReminder(cart);

    window.open(
      "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message),
      "_blank"
    );
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener("click", checkout);
  }

  loadCart();
  updateCartBadge();
  renderCart();

  /* ─────────────────────────────────────────────
     5.5 REVIEW REMINDERS
     ─────────────────────────────────────────────
     When a purchase happens we queue a reminder. The site banner
     appears 2 days later asking for a review of what was bought.
     Note: with a real payment gateway, call queueReviewReminder(items)
     from your webhook / success redirect instead of (or in addition to)
     the WhatsApp checkout below. */

  var REMINDERS_KEY = "urch_review_reminders";
  var REVIEW_BANNER_DISMISSED_KEY = "urch_review_banner_dismissed";
  var REVIEW_REMINDER_DAYS = 2;
  var REVIEW_REMINDER_MS = REVIEW_REMINDER_DAYS * 24 * 60 * 60 * 1000;

  function getReviewReminders() {
    try {
      var raw = localStorage.getItem(REMINDERS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function saveReviewReminders(list) {
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(list.slice(-40)));
    } catch (err) {}
  }

  function queueReviewReminder(items) {
    try {
      if (!Array.isArray(items) || !items.length) return;
      var orderId = "URCH-" + Date.now().toString().slice(-4) + String(Math.floor(Math.random() * 90) + 10);
      var reminders = getReviewReminders();
      reminders.push({
        id: "rem_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        orderId: orderId,
        ts: Date.now(),
        products: items
          .map(function (i) {
            return i.name || i.product || "";
          })
          .filter(Boolean)
          .join(", "),
        reviewed: false
      });
      saveReviewReminders(reminders);
    } catch (err) {}
  }

  function dueReviewReminders() {
    return getReviewReminders().filter(function (r) {
      return !r.reviewed && Date.now() - r.ts >= REVIEW_REMINDER_MS;
    });
  }

  function maybeShowReviewReminder() {
    if (document.getElementById("reviewReminderBanner")) return;
    var dismissed = false;
    try {
      dismissed = localStorage.getItem(REVIEW_BANNER_DISMISSED_KEY) === "1";
    } catch (err) {}
    if (dismissed) return;

    var due = dueReviewReminders();
    if (!due.length) return;

    var first = due[0];
    var banner = document.createElement("div");
    banner.className = "review-reminder";
    banner.id = "reviewReminderBanner";
    banner.innerHTML =
      '<div class="review-reminder-inner">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>' +
        "<span>Did you enjoy your order" +
          (first.products ? " of " + escapeHtml(first.products) : "") +
          "? Your feedback helps us improve. " +
        "</span>" +
        '<a class="review-reminder-cta" href="review.html?order=' + encodeURIComponent(first.orderId) +
          (first.products ? "&product=" + encodeURIComponent(first.products.split(", ")[0]) : "") + '">Leave a review</a>' +
        '<button type="button" class="review-reminder-close" id="reviewReminderDismiss" aria-label="Dismiss reminder">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        "</button>" +
      "</div>";
    document.body.appendChild(banner);

    var dismissBtn = document.getElementById("reviewReminderDismiss");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        try {
          localStorage.setItem(REVIEW_BANNER_DISMISSED_KEY, "1");
        } catch (err) {}
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      });
    }
  }

  maybeShowReviewReminder();

  /* ─────────────────────────────────────────────
     6. FAQ ACCORDION
     ───────────────────────────────────────────── */

  var faqItems = document.querySelectorAll(".faq-item");

  function toggleFaqItem(item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    var isOpen = item.classList.contains("open");

    if (isOpen) {
      item.classList.remove("open");
      question.setAttribute("aria-expanded", "false");
    } else {
      item.classList.add("open");
      question.setAttribute("aria-expanded", "true");
    }
  }

  faqItems.forEach(function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", function () {
      toggleFaqItem(item);
    });

    question.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFaqItem(item);
      }
    });
  });

  // Expand all / Collapse all
  var faqToggleAll = document.getElementById("faqToggleAll");
  var faqToggleIcon = document.getElementById("faqToggleIcon");

  if (faqToggleAll) {
    faqToggleAll.addEventListener("click", function () {
      var allOpen = true;
      faqItems.forEach(function (item) {
        if (!item.classList.contains("open")) allOpen = false;
      });

      faqItems.forEach(function (item) {
        var question = item.querySelector(".faq-question");
        if (allOpen) {
          item.classList.remove("open");
          if (question) question.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("open");
          if (question) question.setAttribute("aria-expanded", "true");
        }
      });

      if (faqToggleIcon) {
        faqToggleIcon.textContent = allOpen ? "+" : "−";
      }
      faqToggleAll.childNodes[faqToggleAll.childNodes.length - 1].textContent = allOpen
        ? " Expand all"
        : " Collapse all";
    });
  }

  /* ─────────────────────────────────────────────
     7. NEWSLETTER FORM
     ───────────────────────────────────────────── */

  var newsletterForm = document.getElementById("newsletterForm");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var emailInput = newsletterForm.querySelector('input[type="email"]');
      var submitBtn = newsletterForm.querySelector('button[type="submit"]');

      if (emailInput && !emailInput.value.trim()) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Subscribing...";
      }

      setTimeout(function () {
        newsletterForm.innerHTML =
          '<p style="font-size:16px;font-weight:600;color:var(--accent,#2D6A3F);padding:16px 0;">Thanks for subscribing!</p>';
      }, 800);
    });
  }

  /* ─────────────────────────────────────────────
     8. WELCOME POPUP (lead magnet — show once)
     ───────────────────────────────────────────── */

  var welcomePopup = document.getElementById("welcomePopup");
  var welcomeClose = document.getElementById("welcomeClose");
  var welcomeDismiss = document.getElementById("welcomeDismiss");
  var WELCOME_SHOWN_KEY = "urch_welcome_popup_shown";
  var WELCOME_SCROLL_TRIGGER = 0.5;
  var WELCOME_TIME_TRIGGER = 10000;
  var welcomeFired = false;

  function openWelcomePopup() {
    if (!welcomePopup || welcomeFired) return;
    welcomeFired = true;
    try { localStorage.setItem(WELCOME_SHOWN_KEY, "1"); } catch (e) {}
    welcomePopup.hidden = false;
    requestAnimationFrame(function () {
      welcomePopup.classList.add("open");
      welcomePopup.setAttribute("aria-hidden", "false");
    });
    document.body.style.overflow = "hidden";
  }

  function closeWelcomePopup() {
    if (!welcomePopup) return;
    welcomePopup.classList.remove("open");
    welcomePopup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initWelcomePopup() {
    if (!welcomePopup) return;
    try {
      if (localStorage.getItem(WELCOME_SHOWN_KEY)) return;
    } catch (e) {}

    var startTime = Date.now();

    function checkScrollTrigger() {
      if (welcomeFired) return;
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      var scrolled = scrollTop / docHeight;
      if (scrolled >= WELCOME_SCROLL_TRIGGER) {
        openWelcomePopup();
      }
    }

    function checkTimeTrigger() {
      if (welcomeFired) return;
      if (Date.now() - startTime >= WELCOME_TIME_TRIGGER) {
        openWelcomePopup();
      }
    }

    window.addEventListener("scroll", checkScrollTrigger, { passive: true });
    setInterval(checkTimeTrigger, 1000);
  }

  if (welcomeClose) {
    welcomeClose.addEventListener("click", function () {
      closeWelcomePopup();
    });
  }

  if (welcomeDismiss) {
    welcomeDismiss.addEventListener("click", function () {
      closeWelcomePopup();
    });
  }

  if (welcomePopup) {
    welcomePopup.addEventListener("click", function (e) {
      if (e.target === welcomePopup) closeWelcomePopup();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && welcomePopup && welcomePopup.classList.contains("open")) {
      closeWelcomePopup();
    }
  });

  initWelcomePopup();

  /* ─────────────────────────────────────────────
     9. LOGIN PAGE (UI only)
     ───────────────────────────────────────────── */

  var loginForm = document.getElementById("loginForm");
  var loginName = document.getElementById("loginName");
  var loginEmail = document.getElementById("loginEmail");
  var loginPassword = document.getElementById("loginPassword");
  var loginSubmit = document.getElementById("loginSubmit");
  var loginError = document.getElementById("loginError");
  var passwordToggle = document.getElementById("passwordToggle");

  if (passwordToggle) {
    passwordToggle.addEventListener("click", function () {
      if (!loginPassword) return;
      var show = loginPassword.type === "password";
      loginPassword.type = show ? "text" : "password";
      var eye = passwordToggle.querySelector(".auth-eye");
      var eyeOff = passwordToggle.querySelector(".auth-eye-off");
      if (eye) eye.style.display = show ? "none" : "block";
      if (eyeOff) eyeOff.style.display = show ? "block" : "none";
      passwordToggle.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
      loginPassword.focus();
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (loginError) loginError.hidden = true;

      var nameInput = (loginName && loginName.value.trim()) || "";

      if (!nameInput) {
        if (loginError) {
          loginError.textContent = "Please enter your name.";
          loginError.hidden = false;
        }
        if (loginName) loginName.focus();
        return;
      }

      if (loginEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.value.trim())) {
        if (loginError) {
          loginError.textContent = "Please enter a valid email address.";
          loginError.hidden = false;
        }
        if (loginEmail) loginEmail.focus();
        return;
      }

      if (loginPassword && !loginPassword.value) {
        if (loginError) {
          loginError.textContent = "Please enter your password.";
          loginError.hidden = false;
        }
        if (loginPassword) loginPassword.focus();
        return;
      }

      if (loginSubmit) loginSubmit.classList.add("loading");
      if (loginSubmit) {
        var label = loginSubmit.querySelector(".auth-submit-label");
        if (label) label.textContent = "Signing in…";
      }

      setTimeout(function () {
        var email = loginEmail ? loginEmail.value.trim() : "";
        var local = email.split("@")[0] || "customer";
        var fallback =
          local
            .split(/[._\-+]+/)
            .filter(Boolean)
            .map(function (part) {
              return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join(" ")
            .slice(0, 24) || "Customer";
        var name = nameInput || fallback;

        saveSessionUser({ name: name, email: email, phone: "" });
        trackEvent("login", name, email);
        window.location.href = "account.html";
      }, 1100);
    });
  }

  /* ─────────────────────────────────────────────
     10. CUSTOMER ACCOUNT PAGE
     ───────────────────────────────────────────── */

  var ORDERS_KEY = "urch_orders";

  var DEMO_ORDERS = [
    {
      id: "URCH-1105",
      date: "Aug 10, 2026",
      items: [{ name: "Okpa Flour", qty: 1, price: 2500 }],
      total: 2500,
      status: "Processing",
      timeline: [
        { label: "Order Placed", date: "Aug 10, 2026", done: true, active: true },
        { label: "Confirmed", date: "Expected Aug 11", done: false },
        { label: "Dispatched", date: "—", done: false },
        { label: "Delivered", date: "—", done: false }
      ]
    },
    {
      id: "URCH-1098",
      date: "Aug 2, 2026",
      items: [
        { name: "Abacha (African Salad)", qty: 2, price: 2000 },
        { name: "Okpeye Nsukka", qty: 1, price: 1200 }
      ],
      total: 5200,
      status: "Dispatched",
      timeline: [
        { label: "Order Placed", date: "Aug 2, 2026", done: true },
        { label: "Confirmed", date: "Aug 3, 2026", done: true },
        { label: "Dispatched", date: "Aug 5, 2026", done: true, active: true },
        { label: "Delivered", date: "Expected Aug 11", done: false }
      ]
    },
    {
      id: "URCH-1042",
      date: "Jul 19, 2026",
      items: [
        { name: "Okpa Flour", qty: 2, price: 2500 },
        { name: "Achicha", qty: 1, price: 1800 },
        { name: "Palm Oil", qty: 1, price: 3000 }
      ],
      total: 9800,
      status: "Delivered",
      timeline: [
        { label: "Order Placed", date: "Jul 19, 2026", done: true },
        { label: "Confirmed", date: "Jul 20, 2026", done: true },
        { label: "Dispatched", date: "Jul 21, 2026", done: true },
        { label: "Delivered", date: "Jul 23, 2026", done: true }
      ]
    }
  ];

  function seedOrders() {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(DEMO_ORDERS));
    } catch (err) {}
  }

  function getOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      if (raw === null) {
        seedOrders();
        raw = localStorage.getItem(ORDERS_KEY);
      }
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return DEMO_ORDERS.slice();
    }
  }

  function statusClass(status) {
    var s = String(status || "").toLowerCase();
    if (s === "delivered") return "status-delivered";
    if (s === "dispatched" || s === "shipped") return "status-dispatched";
    return "status-processing";
  }

  function orderCardHTML(order) {
    var items = (order.items || [])
      .map(function (it) {
        return (
          '<div class="order-item">' +
            '<span>' + escapeHtml(it.name) + " x" + it.qty + "</span>" +
            '<span>' + formatNaira(Number(it.price) * Number(it.qty)) + "</span>" +
          "</div>"
        );
      })
      .join("");

    var steps = (order.timeline || [])
      .map(function (step) {
        var cls = step.done ? " done" : step.active ? " active" : "";
        return (
          '<div class="timeline-step' + cls + '">' +
            '<div class="timeline-dot"></div>' +
            '<div>' +
              '<div class="timeline-label">' + escapeHtml(step.label) + "</div>" +
              '<div class="timeline-date">' + escapeHtml(step.date || "") + "</div>" +
            "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="order-card">' +
        '<div class="order-head">' +
          '<div>' +
            '<div class="order-id">' + escapeHtml(order.id) + "</div>" +
            '<div class="order-date">Placed ' + escapeHtml(order.date) + "</div>" +
          "</div>" +
          '<span class="status-badge ' + statusClass(order.status) + '">' + escapeHtml(order.status) + "</span>" +
        "</div>" +
        '<div class="order-items">' + items + "</div>" +
        '<div class="order-total">Total: ' + formatNaira(order.total) + "</div>" +
        '<button type="button" class="order-track-btn">View tracking</button>' +
        '<div class="order-track">' +
          '<div class="timeline">' + steps + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderAccountOrders() {
    var list = document.getElementById("ordersList");
    if (!list) return;
    var orders = getOrders();
    if (!orders.length) {
      list.innerHTML =
        '<div class="account-empty">No orders yet. <a href="shop.html" class="auth-link">Start shopping</a></div>';
      return;
    }
    list.innerHTML = orders.map(orderCardHTML).join("");
  }

  function renderAccountSaved() {
    var grid = document.getElementById("savedList");
    if (!grid) return;
    var saved = getWishlist();
    var products = getProducts().filter(function (p) {
      return saved.indexOf(p.name) !== -1;
    });

    if (!products.length) {
      grid.innerHTML =
        '<div class="account-empty">No saved items yet. <a href="shop.html" class="auth-link">Browse products</a></div>';
      return;
    }
    grid.innerHTML = products.map(function (p) {
      return productCardHTML(p, {});
    }).join("");
  }

  function renderAccountOverview() {
    var statsEl = document.getElementById("overviewStats");
    if (!statsEl) return;

    var orders = getOrders();
    var savedCount = getWishlist().length;

    statsEl.innerHTML =
      '<div class="account-stat">' +
        '<div class="account-stat-value">' + orders.length + "</div>" +
        '<div class="account-stat-label">Total orders</div>' +
      "</div>" +
      '<div class="account-stat">' +
        '<div class="account-stat-value">' + savedCount + "</div>" +
        '<div class="account-stat-label">Saved items</div>' +
      "</div>" +
      '<div class="account-stat">' +
        '<div class="account-stat-value">2</div>' +
        '<div class="account-stat-label">Active coupons</div>' +
      "</div>";

    var latest = orders.length ? orders[0] : null;
    var latestEl = document.getElementById("latestOrder");
    if (latestEl) {
      if (latest) {
        var itemCount = (latest.items || []).reduce(function (s, it) {
          return s + Number(it.qty || 0);
        }, 0);
        latestEl.innerHTML =
          '<h3 class="account-card-title">Latest order</h3>' +
          '<div class="order-head" style="margin-bottom:8px;">' +
            "<div>" +
              '<div class="order-id">' + escapeHtml(latest.id) + "</div>" +
              '<div class="order-date">Placed ' + escapeHtml(latest.date) + "</div>" +
            "</div>" +
            '<span class="status-badge ' + statusClass(latest.status) + '">' + escapeHtml(latest.status) + "</span>" +
          "</div>" +
          '<p class="order-item" style="border:none;padding:0 0 12px;">' +
            itemCount + " item" + (itemCount !== 1 ? "s" : "") + " &middot; " + formatNaira(latest.total) +
          "</p>" +
          '<button type="button" class="auth-link" id="gotoOrdersBtn">View all orders &rarr;</button>';
      } else {
        latestEl.innerHTML =
          '<h3 class="account-card-title">Latest order</h3>' +
          '<p class="account-empty" style="padding:24px;">No orders yet.</p>';
      }
    }
  }

  function userInitials(name) {
    return (name || "U")
      .split(/\s+/)
      .map(function (w) {
        return w.charAt(0);
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function applyAvatar(el, user) {
    if (!el) return;
    if (user && user.photo) {
      el.style.backgroundImage = "url('" + user.photo + "')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
    } else {
      el.style.backgroundImage = "";
      el.textContent = userInitials(user && user.name);
    }
  }

  function compressImageFile(file, maxSize, quality, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = function () {
        cb(null);
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(file);
  }

  function initAccountPage() {
    var main = document.getElementById("accountMain");
    if (!main) return;

    var user = getSessionUser() || { name: "Customer", email: "" };
    main.hidden = false;

    var avatar = document.getElementById("accountAvatar");
    var nameEl = document.getElementById("accountUserName");
    var emailEl = document.getElementById("accountUserEmail");
    var overviewName = document.getElementById("overviewName");

    var initials = userInitials(user.name);

    applyAvatar(avatar, user);
    if (nameEl) nameEl.textContent = user.name || "Customer";
    if (emailEl) emailEl.textContent = user.email || "";
    if (overviewName) overviewName.textContent = (user.name || "there").split(" ")[0];

    renderAccountOverview();
    renderAccountOrders();
    renderAccountSaved();
  }

  var accountMenuButtons = document.querySelectorAll(".account-menu-item");
  accountMenuButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      accountMenuButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var panel = btn.getAttribute("data-panel");
      var panels = document.querySelectorAll(".account-panel");
      panels.forEach(function (p) {
        p.classList.remove("active");
      });
      var target = document.getElementById("panel-" + panel);
      if (target) target.classList.add("active");
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest("#gotoOrdersBtn")) {
      var target = document.getElementById("panel-orders");
      var btn = document.querySelector('.account-menu-item[data-panel="orders"]');
      if (btn) btn.click();
      else if (target) target.classList.add("active");
    }
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".order-track-btn");
    if (!btn) return;
    var track = btn.closest(".order-card") && btn.closest(".order-card").querySelector(".order-track");
    if (!track) return;
    track.classList.toggle("open");
    btn.textContent = track.classList.contains("open") ? "Hide tracking" : "View tracking";
  });

  var accountSignOut = document.getElementById("accountSignOut");
  if (accountSignOut) {
    accountSignOut.addEventListener("click", function () {
      clearSessionUser();
      trackEvent("logout", "customer");
      window.location.href = "index.html";
    });
  }

  var profileForm = document.getElementById("profileForm");
  if (profileForm) {
    var user = getSessionUser();
    var profileName = document.getElementById("profileName");
    var profileEmail = document.getElementById("profileEmail");
    var profilePhone = document.getElementById("profilePhone");
    if (profileName) profileName.value = (user && user.name) || "";
    if (profileEmail) profileEmail.value = (user && user.email) || "";
    if (profilePhone) profilePhone.value = (user && user.phone) || "";

    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var current = getSessionUser() || {};
      var updated = {
        name: (profileName && profileName.value.trim()) || current.name || "Customer",
        email: (profileEmail && profileEmail.value.trim()) || current.email || "",
        phone: (profilePhone && profilePhone.value.trim()) || current.phone || "",
        photo: current.photo || ""
      };
      saveSessionUser(updated);
      var avatar = document.getElementById("accountAvatar");
      var nameEl = document.getElementById("accountUserName");
      var emailEl = document.getElementById("accountUserEmail");
      var preview = document.getElementById("profileAvatarPreview");
      applyAvatar(avatar, updated);
      applyAvatar(preview, updated);
      if (nameEl) nameEl.textContent = updated.name;
      if (emailEl) emailEl.textContent = updated.email;
      showToast("Profile updated");
    });
  }

  var profilePhotoInput = document.getElementById("profilePhotoInput");
  var profilePhotoBtn = document.getElementById("profilePhotoBtn");
  var profilePhotoRemove = document.getElementById("profilePhotoRemove");

  function syncProfilePhotoUI() {
    var u = getSessionUser() || {};
    var preview = document.getElementById("profileAvatarPreview");
    applyAvatar(preview, u);
    if (profilePhotoRemove) profilePhotoRemove.hidden = !u.photo;
  }

  if (profilePhotoBtn) {
    profilePhotoBtn.addEventListener("click", function () {
      if (profilePhotoInput) profilePhotoInput.click();
    });
  }

  if (profilePhotoInput) {
    profilePhotoInput.addEventListener("change", function () {
      var file = profilePhotoInput.files && profilePhotoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image is too large. Please choose one under 2 MB.");
        profilePhotoInput.value = "";
        return;
      }
      compressImageFile(file, 400, 0.8, function (dataUrl) {
        if (!dataUrl) {
          showToast("Could not read that image. Try another file.");
          return;
        }
        var current = getSessionUser() || {};
        current.photo = dataUrl;
        saveSessionUser(current);
        syncProfilePhotoUI();
        applyAvatar(document.getElementById("accountAvatar"), current);
        showToast("Profile picture updated");
        profilePhotoInput.value = "";
      });
    });
  }

  if (profilePhotoRemove) {
    profilePhotoRemove.addEventListener("click", function () {
      var current = getSessionUser() || {};
      if (!current.photo) return;
      current.photo = "";
      saveSessionUser(current);
      syncProfilePhotoUI();
      applyAvatar(document.getElementById("accountAvatar"), current);
      showToast("Profile picture removed");
    });
  }

  syncProfilePhotoUI();

  var passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var pw = document.getElementById("newPassword");
      var confirm = document.getElementById("confirmPassword");
      if (!pw || !confirm) return;
      if (pw.value.length < 6) {
        showToast("Password must be at least 6 characters");
        return;
      }
      if (pw.value !== confirm.value) {
        showToast("Passwords do not match");
        return;
      }
      pw.value = "";
      confirm.value = "";
      showToast("Password updated");
    });
  }

  var copyReferral = document.getElementById("copyReferral");
  if (copyReferral) {
    copyReferral.addEventListener("click", function () {
      var code = document.getElementById("referralCode");
      if (!code) return;
      var text = code.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast("Referral code copied");
        });
      } else {
        showToast("Referral code: " + text);
      }
    });
  }

  initAccountPage();
})();
