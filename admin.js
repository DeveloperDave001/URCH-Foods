/* URCH Foods — Admin Dashboard Scripts */

(function () {
  "use strict";

  var CATALOG_KEY = "urch_products";
  var CATALOG_VERSION_KEY = "urch_products_version";
  var CATALOG_VERSION = 2;
  var SALES_KEY = "urch_sales";
  var EVENTS_KEY = "urch_events";
  var DIST_KEY = "urch_distributor_applications";
  var DIST_STATUSES = ["New", "Contacted", "Approved", "Declined"];
  var REVIEWS_KEY = "urch_reviews";

  var CATEGORIES = ["flagship", "flour", "traditional", "essentials"];

  /* ── Storage helpers ── */

  function defaultProducts() {
    try {
      var el = document.getElementById("adminDefaults");
      var list = el ? JSON.parse(el.textContent) : null;
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function migrateCatalog(list, defaults) {
    var merged = Array.isArray(list) ? list.slice() : [];
    defaults.forEach(function (d) {
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

  function seedProducts() {
    var defaults = defaultProducts();
    if (defaults.length) {
      try {
        localStorage.setItem(CATALOG_KEY, JSON.stringify(defaults));
        localStorage.setItem(CATALOG_VERSION_KEY, String(CATALOG_VERSION));
      } catch (err) {}
    }
  }

  function getProducts() {
    try {
      var raw = localStorage.getItem(CATALOG_KEY);
      if (raw === null) {
        seedProducts();
        raw = localStorage.getItem(CATALOG_KEY);
      }
      var list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list) && list.every(function (p) { return p && p.id && p.name; })) {
        var defaults = defaultProducts();
        if (localStorage.getItem(CATALOG_VERSION_KEY) !== String(CATALOG_VERSION) && defaults.length) {
          list = migrateCatalog(list, defaults);
          saveProducts(list);
          localStorage.setItem(CATALOG_VERSION_KEY, String(CATALOG_VERSION));
        }
        return list;
      }
    } catch (err) {}
    return defaultProducts();
  }

  function saveProducts(list) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
    } catch (err) {
      showToast("Warning: storage full — try a smaller image.");
    }
  }

  function getSales() {
    try {
      var raw = localStorage.getItem(SALES_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function saveSales(list) {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(list));
    } catch (err) {}
  }

  function getEvents() {
    try {
      var raw = localStorage.getItem(EVENTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function uid() {
    return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatNaira(amount) {
    return "\u20A6" + Number(amount || 0).toLocaleString("en-NG");
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var opts = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
    return d.toLocaleString(undefined, opts);
  }

  /* ── Toast ── */

  var toastTimer = null;
  function showToast(message) {
    var el = document.getElementById("adminToast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2400);
  }

  /* ── Tabs ── */

  var tabButtons = document.querySelectorAll(".admin-tab");

  function switchTab(name) {
    tabButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === name);
    });
    ["dashboard", "products", "sales", "activity", "distributors", "reviews"].forEach(function (tab) {
      var panel = document.getElementById("panel-" + tab);
      if (panel) panel.hidden = tab !== name;
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      switchTab(tab);
      if (tab === "distributors") renderDistributors();
      if (tab === "reviews") initReviewSection();
    });
  });

  /* ── Dashboard ── */

  function productTotals(products) {
    return products.reduce(function (acc, p) {
      var name = p.productName || p.name;
      if (!name) return acc;
      if (!acc[name]) acc[name] = { qty: 0, revenue: 0 };
      acc[name].qty += Number(p.qty) || 0;
      acc[name].revenue += Number(p.total) || 0;
      return acc;
    }, {});
  }

  function renderBarList(elId, entries, valueKey, valueFmt) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (!entries.length) {
      el.innerHTML = '<p class="bar-empty">No data yet. Log a sale to see rankings.</p>';
      return;
    }
    var max = entries[0].value;
    el.innerHTML = entries
      .map(function (e) {
        var pct = max > 0 ? Math.max(6, Math.round((e.value / max) * 100)) : 6;
        return (
          '<div class="bar-row">' +
            '<div class="bar-label" title="' + escapeHtml(e.name) + '">' + escapeHtml(e.name) + "</div>" +
            '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="bar-value">' + valueFmt(e.value) + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderDashboard() {
    var products = getProducts();
    var sales = getSales();
    var events = getEvents();

    var revenue = sales.reduce(function (s, x) { return s + (Number(x.total) || 0); }, 0);
    var itemsSold = sales.reduce(function (s, x) { return s + (Number(x.qty) || 0); }, 0);
    var adds = events.filter(function (e) { return e.type === "add_to_cart"; }).length;
    var checkouts = events.filter(function (e) { return e.type === "checkout_click"; }).length;

    var setText = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    setText("statRevenue", formatNaira(revenue));
    setText("statItemsSold", itemsSold.toLocaleString("en-NG"));
    setText("statOrdersSub", sales.length + " sale record" + (sales.length !== 1 ? "s" : ""));
    setText("statProducts", String(products.length));
    setText("statAddToCarts", adds.toLocaleString("en-NG"));
    setText("statCheckoutSub", checkouts + " checkout" + (checkouts !== 1 ? "s" : "") + " started");

    var totals = productTotals(sales);
    var byQty = Object.keys(totals)
      .map(function (name) { return { name: name, value: totals[name].qty }; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 5);
    var byRevenue = Object.keys(totals)
      .map(function (name) { return { name: name, value: totals[name].revenue }; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 5);

    renderBarList("topSold", byQty, "qty", function (v) { return v.toLocaleString("en-NG"); });
    renderBarList("topRevenue", byRevenue, "revenue", formatNaira);

    // Recent sales
    var recent = sales.slice(-5).reverse();
    var recentEl = document.getElementById("recentSales");
    if (recentEl) {
      if (!recent.length) {
        recentEl.innerHTML = '<p class="bar-empty">No sales logged yet.</p>';
      } else {
        recentEl.innerHTML = recent
          .map(function (s) {
            return (
              '<div class="recent-row">' +
                '<div><div class="recent-name">' + escapeHtml(s.productName) + "</div>" +
                '<div class="recent-meta">' + escapeHtml(formatDate(s.date)) + " \u00b7 qty " + s.qty + "</div></div>" +
                '<div class="recent-total">' + formatNaira(s.total) + "</div>" +
              "</div>"
            );
          })
          .join("");
      }
    }
  }

  /* ── Products ── */

  var productsTableBody = document.querySelector("#productsTable tbody");
  var productFormWrap = document.getElementById("productFormWrap");
  var productForm = document.getElementById("productForm");
  var productFormTitle = document.getElementById("productFormTitle");
  var editingId = null;
  var pendingImage = "";

  function categoryLabel(val) {
    var map = { flagship: "Flagship", flour: "Flours", traditional: "Traditional", essentials: "Essentials" };
    return map[val] || val;
  }

  function renderProducts() {
    var products = getProducts();
    if (!productsTableBody) return;
    if (!products.length) {
      productsTableBody.innerHTML = '<tr><td colspan="5" class="empty-row">No products yet. Add one above.</td></tr>';
      return;
    }
    productsTableBody.innerHTML = products
      .map(function (p) {
        return (
          '<tr>' +
            '<td><div class="cell-product">' +
              '<img src="' + escapeHtml(p.img || "images/product-01.jpg") + '" alt="" />' +
              "<strong>" + escapeHtml(p.name) + "</strong>" +
            "</div></td>" +
            '<td class="table-price">' + formatNaira(p.price) + ' <small>/ ' + escapeHtml(p.unit || "pack") + "</small></td>" +
            '<td><div class="cell-cats">' +
              (p.categories || []).map(function (c) {
                return '<span class="cell-badge">' + escapeHtml(categoryLabel(c)) + "</span>";
              }).join("") +
            "</div></td>" +
            '<td>' + (p.tag ? '<span class="cell-badge">' + escapeHtml(p.tag) + "</span>" : "\u2014") + "</td>" +
            '<td><div class="cell-actions">' +
              '<button class="admin-btn admin-btn-ghost admin-btn-sm" data-action="edit" data-id="' + escapeHtml(p.id) + '">Edit</button>' +
              '<button class="admin-btn admin-btn-danger admin-btn-sm" data-action="delete" data-id="' + escapeHtml(p.id) + '">Delete</button>' +
            "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function resetForm() {
    editingId = null;
    pendingImage = "";
    productForm.reset();
    document.querySelectorAll(".pfCat").forEach(function (cb) { cb.checked = false; });
    var preview = document.getElementById("pfImagePreview");
    if (preview) preview.innerHTML = '<span class="img-placeholder">No image selected</span>';
    if (productFormTitle) productFormTitle.textContent = "Add Product";
  }

  function openAdd() {
    resetForm();
    if (productFormWrap) productFormWrap.hidden = false;
    var name = document.getElementById("pfName");
    if (name) name.focus();
  }

  function openEdit(id) {
    var products = getProducts();
    var p = null;
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) { p = products[i]; break; }
    }
    if (!p) return;

    resetForm();
    editingId = id;
    setVal("pfName", p.name);
    setVal("pfPrice", p.price);
    setVal("pfUnit", p.unit || "pack");
    setVal("pfTag", p.tag || "");
    setVal("pfDesc", p.desc || "");
    var cats = p.categories || [];
    document.querySelectorAll(".pfCat").forEach(function (cb) {
      cb.checked = cats.indexOf(cb.value) !== -1;
    });
    var preview = document.getElementById("pfImagePreview");
    if (preview) {
      if (p.img) {
        preview.innerHTML = '<img src="' + escapeHtml(p.img) + '" alt="Preview" />';
      } else {
        preview.innerHTML = '<span class="img-placeholder">No image</span>';
      }
    }
    if (productFormTitle) productFormTitle.textContent = "Edit Product";
    if (productFormWrap) productFormWrap.hidden = false;
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val == null ? "" : val;
  }

  var imageInput = document.getElementById("pfImage");
  if (imageInput) {
    imageInput.addEventListener("change", function () {
      var file = imageInput.files && imageInput.files[0];
      if (!file) return;
      compressImage(file, function (dataUrl) {
        if (!dataUrl) {
          showToast("Could not read that image.");
          return;
        }
        pendingImage = dataUrl;
        var preview = document.getElementById("pfImagePreview");
        if (preview) preview.innerHTML = '<img src="' + dataUrl + '" alt="Preview" />';
      });
    });
  }

  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var MAX = 800;
        var w = img.width;
        var h = img.height;
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { callback(""); };
      img.src = e.target.result;
    };
    reader.onerror = function () { callback(""); };
    reader.readAsDataURL(file);
  }

  function productFromForm() {
    var name = (document.getElementById("pfName").value || "").trim();
    var price = parseFloat(document.getElementById("pfPrice").value) || 0;
    if (!name || price <= 0) {
      showToast("Please enter a name and a valid price.");
      return null;
    }
    var cats = [];
    document.querySelectorAll(".pfCat").forEach(function (cb) {
      if (cb.checked) cats.push(cb.value);
    });
    if (!cats.length) {
      showToast("Select at least one category.");
      return null;
    }
    return {
      name: name,
      price: price,
      unit: (document.getElementById("pfUnit").value || "pack").trim() || "pack",
      tag: (document.getElementById("pfTag").value || "").trim(),
      desc: (document.getElementById("pfDesc").value || "").trim(),
      categories: cats,
    };
  }

  if (productForm) {
    productForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = productFromForm();
      if (!data) return;

      var products = getProducts();
      if (editingId) {
        for (var i = 0; i < products.length; i++) {
          if (products[i].id === editingId) {
            products[i].name = data.name;
            products[i].price = data.price;
            products[i].unit = data.unit;
            products[i].tag = data.tag;
            products[i].desc = data.desc;
            products[i].categories = data.categories;
            if (pendingImage) products[i].img = pendingImage;
            break;
          }
        }
        showToast("Product updated.");
      } else {
        data.id = uid();
        data.img = pendingImage || "images/product-01.jpg";
        products.push(data);
        showToast("Product published to the store.");
      }

      saveProducts(products);
      resetForm();
      if (productFormWrap) productFormWrap.hidden = true;
      renderProducts();
      populateSaleSelects();
      renderDashboard();
    });
  }

  var btnAddProduct = document.getElementById("btnAddProduct");
  if (btnAddProduct) {
    btnAddProduct.addEventListener("click", function () {
      var wrap = productFormWrap;
      if (wrap && !wrap.hidden) {
        resetForm();
      } else {
        openAdd();
      }
    });
  }

  var btnCancelProduct = document.getElementById("btnCancelProduct");
  if (btnCancelProduct) {
    btnCancelProduct.addEventListener("click", function () {
      if (productFormWrap) productFormWrap.hidden = true;
    });
  }

  var btnResetProducts = document.getElementById("btnResetProducts");
  if (btnResetProducts) {
    btnResetProducts.addEventListener("click", function () {
      if (!confirm("Reset the product list to the original URCH catalog? Any products you added will be removed.")) return;
      saveProducts(defaultProducts());
      resetForm();
      if (productFormWrap) productFormWrap.hidden = true;
      renderProducts();
      populateSaleSelects();
      renderDashboard();
      showToast("Products reset to defaults.");
    });
  }

  if (productsTableBody) {
    productsTableBody.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var action = btn.getAttribute("data-action");
      if (action === "edit") {
        openEdit(id);
      } else if (action === "delete") {
        var products = getProducts();
        var target = null;
        for (var i = 0; i < products.length; i++) {
          if (products[i].id === id) { target = products[i]; break; }
        }
        if (!target) return;
        if (!confirm('Delete "' + target.name + '"? This cannot be undone.')) return;
        saveProducts(products.filter(function (p) { return p.id !== id; }));
        renderProducts();
        populateSaleSelects();
        renderDashboard();
        showToast("Product deleted.");
      }
    });
  }

  /* ── Sales ── */

  var saleSelect = document.getElementById("saleProduct");
  var quickSelect = document.getElementById("quickProduct");
  var saleQty = document.getElementById("saleQty");
  var quickQty = document.getElementById("quickQty");
  var saleNote = document.getElementById("saleNote");
  var saleTotalPreview = document.getElementById("saleTotalPreview");
  var salesTableBody = document.querySelector("#salesTable tbody");

  function populateSaleSelects() {
    var products = getProducts();
    var keep = saleSelect ? saleSelect.value : "";
    [saleSelect, quickSelect].forEach(function (sel) {
      if (!sel) return;
      var prev = keep || sel.value;
      sel.innerHTML = products
        .map(function (p) {
          return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + " \u2014 " + formatNaira(p.price) + "</option>";
        })
        .join("");
      if (products.length) {
        var found = products.some(function (p) { return p.id === prev; });
        sel.value = found ? prev : products[0].id;
      }
    });
    updateSaleTotal();
  }

  function selectedProduct(sel) {
    var s = sel || saleSelect || quickSelect;
    if (!s) return null;
    var products = getProducts();
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === s.value) return products[i];
    }
    return products[0] || null;
  }

  function updateSaleTotal() {
    if (!saleTotalPreview) return;
    var p = selectedProduct(saleSelect);
    var qty = parseInt(saleQty ? saleQty.value : 1, 10) || 1;
    if (!p) {
      saleTotalPreview.textContent = "";
      return;
    }
    saleTotalPreview.textContent = formatNaira(p.price * qty) + " \u00d7 " + qty;
  }

  if (saleSelect) saleSelect.addEventListener("change", updateSaleTotal);
  if (saleQty) saleQty.addEventListener("input", updateSaleTotal);

  function recordSale(select, qtyInput, noteInput) {
    var p = selectedProduct(select);
    if (!p) {
      showToast("Add a product before logging a sale.");
      return;
    }
    var qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
    if (!qty || qty < 1) {
      showToast("Enter a valid quantity.");
      return;
    }
    var sales = getSales();
    sales.push({
      id: uid().replace("p_", "s_"),
      productId: p.id,
      productName: p.name,
      unit: p.unit || "pack",
      unitPrice: Number(p.price) || 0,
      qty: qty,
      total: (Number(p.price) || 0) * qty,
      note: noteInput ? (noteInput.value || "").trim() : "",
      date: Date.now(),
    });
    saveSales(sales);
    if (qtyInput) qtyInput.value = "1";
    if (noteInput) noteInput.value = "";
    renderSales();
    renderDashboard();
    showToast("Sale logged \u2014 " + p.name + " \u00d7 " + qty);
  }

  var quickSaleForm = document.getElementById("quickSaleForm");
  if (quickSaleForm) {
    quickSaleForm.addEventListener("submit", function (e) {
      e.preventDefault();
      recordSale(quickSelect, quickQty, null);
    });
  }

  var saleForm = document.getElementById("saleForm");
  if (saleForm) {
    saleForm.addEventListener("submit", function (e) {
      e.preventDefault();
      recordSale(saleSelect, saleQty, saleNote);
    });
  }

  function renderSales() {
    var sales = getSales();
    if (!salesTableBody) return;
    if (!sales.length) {
      salesTableBody.innerHTML = '<tr><td colspan="6" class="empty-row">No sales logged yet. Use the form to record completed orders.</td></tr>';
      return;
    }
    var rows = sales.slice().reverse();
    salesTableBody.innerHTML = rows
      .map(function (s) {
        return (
          '<tr>' +
            '<td class="table-price">' + escapeHtml(formatDate(s.date)) + "</td>" +
            "<td>" + escapeHtml(s.productName) + "</td>" +
            "<td>" + s.qty + "</td>" +
            '<td class="table-price">' + formatNaira(s.total) + "</td>" +
            "<td>" + (s.note ? escapeHtml(s.note) : "\u2014") + "</td>" +
            '<td><button class="admin-btn admin-btn-danger admin-btn-sm" data-id="' + escapeHtml(s.id) + '">Delete</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  if (salesTableBody) {
    salesTableBody.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      saveSales(getSales().filter(function (s) { return s.id !== id; }));
      renderSales();
      renderDashboard();
      showToast("Sale removed.");
    });
  }

  var btnClearSales = document.getElementById("btnClearSales");
  if (btnClearSales) {
    btnClearSales.addEventListener("click", function () {
      if (!getSales().length) { showToast("Nothing to clear."); return; }
      if (!confirm("Delete the entire sales log?")) return;
      saveSales([]);
      renderSales();
      renderDashboard();
      showToast("Sales log cleared.");
    });
  }

  var btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", function () {
      var sales = getSales();
      if (!sales.length) { showToast("No sales to export."); return; }
      var csv = "\uFEFFDate,Product,Qty,Unit Price,Total,Note\n";
      sales.forEach(function (s) {
        csv +=
          [new Date(s.date).toISOString(), s.productName, s.qty, s.unitPrice, s.total, (s.note || "").replace(/,/g, " ")]
            .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; })
            .join(",") + "\n";
      });
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "urch-sales.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Sales exported to CSV.");
    });
  }

  /* ── Activity ── */

  var activityTableBody = document.querySelector("#activityTable tbody");

  function renderActivity() {
    var events = getEvents();
    var count = function (type) { return events.filter(function (e) { return e.type === type; }).length; };
    var setText = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    setText("actViews", count("view").toLocaleString("en-NG"));
    setText("actAdds", count("add_to_cart").toLocaleString("en-NG"));
    setText("actCheckouts", count("checkout_click").toLocaleString("en-NG"));

    if (!activityTableBody) return;
    if (!events.length) {
      activityTableBody.innerHTML = '<tr><td colspan="3" class="empty-row">No activity recorded yet. Browse the shop to see events here.</td></tr>';
      return;
    }
    var rows = events.slice().reverse();
    activityTableBody.innerHTML = rows
      .map(function (e) {
        var label = { view: "Viewed", add_to_cart: "Added to cart", checkout_click: "Checkout started" };
        var detail = e.type === "checkout_click" ? "WhatsApp \u2014 " + (e.meta || "total") : e.name;
        return (
          '<tr>' +
            '<td class="table-price">' + escapeHtml(formatDate(e.ts)) + "</td>" +
            '<td><span class="event-badge ' + escapeHtml(e.type) + '">' + escapeHtml(label[e.type] || e.type) + "</span></td>" +
            "<td>" + escapeHtml(detail) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  var btnClearActivity = document.getElementById("btnClearActivity");
  if (btnClearActivity) {
    btnClearActivity.addEventListener("click", function () {
      if (!getEvents().length) { showToast("Nothing to clear."); return; }
      if (!confirm("Clear all recorded activity?")) return;
      try { localStorage.setItem(EVENTS_KEY, "[]"); } catch (err) {}
      renderActivity();
      renderDashboard();
      showToast("Activity cleared.");
    });
  }

  /* ── Distributors ── */

  function getDistributors() {
    try {
      var raw = localStorage.getItem(DIST_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function saveDistributors(list) {
    try {
      localStorage.setItem(DIST_KEY, JSON.stringify(list));
    } catch (err) {
      showToast("Warning: could not save — storage full.");
    }
  }

  function distStatusClass(status) {
    var s = String(status || "").toLowerCase();
    if (s === "approved") return "dist-status-approved";
    if (s === "contacted") return "dist-status-contacted";
    if (s === "declined") return "dist-status-declined";
    return "dist-status-new";
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .map(function (w) { return w.charAt(0); })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function whatsappLink(phone) {
    var digits = String(phone || "").replace(/[^\d]/g, "").replace(/^0/, "234");
    return digits ? "https://wa.me/" + digits : "#";
  }

  function renderDistributors() {
    var listEl = document.getElementById("distributorList");
    var summaryEl = document.getElementById("distSummary");
    if (!listEl) return;

    var apps = getDistributors();

    if (summaryEl) {
      var byStatus = {};
      DIST_STATUSES.forEach(function (s) { byStatus[s] = 0; });
      apps.forEach(function (a) {
        var key = DIST_STATUSES.indexOf(a.status) !== -1 ? a.status : "New";
        byStatus[key] += 1;
      });
      summaryEl.innerHTML =
        '<div class="dist-admin-stat"><span>Total</span><strong>' + apps.length + "</strong></div>" +
        DIST_STATUSES.map(function (s) {
          return '<div class="dist-admin-stat"><span>' + s + "</span><strong>" + byStatus[s] + "</strong></div>";
        }).join("");
    }

    if (!apps.length) {
      listEl.innerHTML = '<div class="empty-row" style="grid-column:1/-1;">No distributor applications yet. Submissions from the "Become a Distributor" page will appear here.</div>';
      return;
    }

    listEl.innerHTML = apps.map(distCardHTML).join("");
  }

  function distCardHTML(a) {
    var when = formatDate(a.ts);
    var statusBtns = DIST_STATUSES.map(function (s) {
      return (
        '<button type="button" class="dist-status-btn' + (a.status === s ? " active" : "") + '"' +
          ' data-status="' + s + '" data-id="' + escapeHtml(a.id) + '">' + s + "</button>"
      );
    }).join("");

    var photo = a.photo
      ? '<img class="dist-admin-img" src="' + escapeHtml(a.photo) + '" alt="' + escapeHtml(a.photoName || "Business photo") + '" />'
      : '<div class="dist-admin-img dist-admin-img-empty">No photo</div>';
    var idImg = a.idImage
      ? '<img class="dist-admin-img" src="' + escapeHtml(a.idImage) + '" alt="' + escapeHtml(a.idImageName || "ID") + '" />'
      : '<div class="dist-admin-img dist-admin-img-empty">No ID</div>';

    var extra = [
      ["Business name", a.businessName],
      ["Business type", a.businessType],
      ["Years in business", a.yearsBusiness],
      ["City / State", (a.city ? a.city + ", " : "") + (a.state || "")]
    ];
    if (a.monthlyVolume) extra.push(["Monthly volume", a.monthlyVolume]);
    if (a.plan) extra.push(["Sales plan", a.plan]);
    if (a.whyUrch) extra.push(["Why URCH Foods", a.whyUrch]);

    var rows = extra
      .map(function (r) {
        return (
          '<div class="dist-admin-row"><span>' + escapeHtml(r[0]) + "</span>" +
          "<p>" + (r[1] ? escapeHtml(r[1]) : "\u2014") + "</p></div>"
        );
      })
      .join("");

    return (
      '<div class="dist-admin-card">' +
        '<div class="dist-admin-head">' +
          '<div class="dist-admin-id">' +
            '<div class="dist-admin-avatar">' + escapeHtml(initials(a.fullName)) + "</div>" +
            "<div>" +
              '<div class="dist-admin-name">' + escapeHtml(a.fullName) + "</div>" +
              '<div class="dist-admin-meta">' + escapeHtml(when) + " &middot; " + escapeHtml(a.id) + "</div>" +
            "</div>" +
          "</div>" +
          '<span class="dist-status ' + distStatusClass(a.status) + '">' + escapeHtml(a.status || "New") + "</span>" +
        "</div>" +
        '<div class="dist-admin-body">' +
          '<div class="dist-admin-row"><span>Email</span><p><a href="mailto:' + escapeHtml(a.email) + '">' + escapeHtml(a.email) + "</a></p></div>" +
          '<div class="dist-admin-row"><span>Phone</span><p><a href="' + whatsappLink(a.phone) + '" target="_blank" rel="noopener">' + escapeHtml(a.phone) + " (WhatsApp)</a></p></div>" +
          '<div class="dist-admin-row"><span>Address</span><p>' + escapeHtml(a.address) + "</p></div>" +
          rows +
          '<div class="dist-admin-media">' +
            "<div>" +
              '<span class="dist-admin-media-label">Business photo</span>' + photo +
              (a.photoName ? '<div class="dist-admin-filename">' + escapeHtml(a.photoName) + "</div>" : "") +
            "</div>" +
            "<div>" +
              '<span class="dist-admin-media-label">ID / Registration</span>' + idImg +
              (a.idImageName ? '<div class="dist-admin-filename">' + escapeHtml(a.idImageName) + "</div>" : "") +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="dist-admin-foot">' +
          '<div class="dist-status-group">' + statusBtns + "</div>" +
          '<button type="button" class="admin-btn admin-btn-danger admin-btn-sm" data-action="delete" data-id="' + escapeHtml(a.id) + '">Delete</button>' +
        "</div>" +
      "</div>"
    );
  }

  var distListEl = document.getElementById("distributorList");
  if (distListEl) {
    distListEl.addEventListener("click", function (e) {
      var statusBtn = e.target.closest(".dist-status-btn");
      if (statusBtn) {
        var id = statusBtn.getAttribute("data-id");
        var status = statusBtn.getAttribute("data-status");
        var apps = getDistributors();
        apps.forEach(function (a) { if (a.id === id) a.status = status; });
        saveDistributors(apps);
        renderDistributors();
        showToast("Status updated to " + status + ".");
        return;
      }

      var delBtn = e.target.closest("[data-action='delete']");
      if (delBtn) {
        var delId = delBtn.getAttribute("data-id");
        if (!confirm("Delete this application? This cannot be undone.")) return;
        saveDistributors(getDistributors().filter(function (a) { return a.id !== delId; }));
        renderDistributors();
        showToast("Application deleted.");
      }
    });
  }

  var btnDistExport = document.getElementById("btnDistExport");
  if (btnDistExport) {
    btnDistExport.addEventListener("click", function () {
      var apps = getDistributors();
      if (!apps.length) { showToast("No applications to export."); return; }
      var headers = [
        "Date", "Status", "Full Name", "Email", "Phone", "Business Name", "Business Type",
        "Years", "City", "State", "Address", "Monthly Volume", "Plan", "Why URCH", "Photo File", "ID File"
      ];
      var csv = "\uFEFF" + headers.join(",") + "\n";
      apps.forEach(function (a) {
        var row = [
          new Date(a.ts).toISOString(), a.status, a.fullName, a.email, a.phone,
          a.businessName, a.businessType, a.yearsBusiness, a.city, a.state,
          a.address, a.monthlyVolume, a.plan, a.whyUrch, a.photoName, a.idImageName
        ];
        csv += row
          .map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; })
          .join(",") + "\n";
      });
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "urch-distributor-applications.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Applications exported to CSV.");
    });
  }

  var btnDistClear = document.getElementById("btnDistClear");
  if (btnDistClear) {
    btnDistClear.addEventListener("click", function () {
      if (!getDistributors().length) { showToast("Nothing to clear."); return; }
      if (!confirm("Delete all distributor applications?")) return;
      saveDistributors([]);
      renderDistributors();
      showToast("Distributor applications cleared.");
    });
  }

  /* ── Reviews ── */

  var reviewProductFilter = "";
  var reviewRatingFilter = "";

  function getReviews() {
    try {
      var raw = localStorage.getItem(REVIEWS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function saveReviews(list) {
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
    } catch (err) {
      showToast("Warning: could not save — storage full.");
    }
  }

  function starsHTML(rating) {
    var full = Math.max(0, Math.min(5, Number(rating) || 0));
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html +=
        '<svg class="rev-star' + (i <= full ? " on" : "") + '" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
    }
    return '<span class="rev-stars">' + html + "</span>";
  }

  function filteredReviews() {
    return getReviews().filter(function (r) {
      if (reviewProductFilter && r.product !== reviewProductFilter) return false;
      if (reviewRatingFilter && Number(r.rating) !== Number(reviewRatingFilter)) return false;
      return true;
    });
  }

  function renderReviewFilters() {
    var productEl = document.getElementById("reviewProductFilter");
    var ratingEl = document.getElementById("reviewRatingFilter");
    if (!productEl && !ratingEl) return;

    var reviews = getReviews();
    var products = [];
    reviews.forEach(function (r) {
      if (r.product && products.indexOf(r.product) === -1) products.push(r.product);
    });
    products.sort(function (a, b) { return a.localeCompare(b); });

    if (productEl) {
      var current = productEl.value;
      var html = '<option value="">All products</option>' +
        products.map(function (p) {
          return '<option value="' + escapeHtml(p) + '"' + (p === current ? " selected" : "") + ">" + escapeHtml(p) + "</option>";
        }).join("");
      if (current && products.indexOf(current) === -1) {
        html = '<option value="">All products</option><option value="' + escapeHtml(current) + '" selected>' + escapeHtml(current) + "</option>" +
          products.map(function (p) {
            return '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + "</option>";
          }).join("");
      }
      productEl.innerHTML = html;
    }

    if (ratingEl) {
      var curRating = ratingEl.value;
      var opts = ['<option value="">All ratings</option>'];
      for (var i = 5; i >= 1; i--) {
        opts.push('<option value="' + i + '"' + (String(i) === curRating ? " selected" : "") + ">" + i + " star" + (i !== 1 ? "s" : "") + "</option>");
      }
      ratingEl.innerHTML = opts.join("");
    }
  }

  function renderReviews() {
    var listEl = document.getElementById("reviewsList");
    var summaryEl = document.getElementById("reviewSummary");
    var countEl = document.getElementById("reviewFilterCount");
    if (!listEl) return;

    var reviews = filteredReviews();
    var allCount = getReviews().length;

    if (countEl) {
      countEl.textContent =
        (reviewProductFilter || reviewRatingFilter)
          ? "Showing " + reviews.length + " of " + allCount + " review" + (allCount !== 1 ? "s" : "")
          : allCount + " review" + (allCount !== 1 ? "s" : "");
    }

    if (summaryEl) {
      var total = reviews.length;
      var avg = total
        ? reviews.reduce(function (sum, r) { return sum + (Number(r.rating) || 0); }, 0) / total
        : 0;
      var complaints = reviews.filter(function (r) { return (r.complaint || "").trim(); }).length;
      var fiveStar = reviews.filter(function (r) { return Number(r.rating) === 5; }).length;
      summaryEl.innerHTML =
        '<div class="dist-admin-stat"><span>Total reviews</span><strong>' + total + "</strong></div>" +
        '<div class="dist-admin-stat"><span>Avg rating</span><strong>' + (total ? avg.toFixed(1) : "\u2014") + "</strong></div>" +
        '<div class="dist-admin-stat"><span>Complaints</span><strong>' + complaints + "</strong></div>" +
        '<div class="dist-admin-stat"><span>5-star</span><strong>' + fiveStar + "</strong></div>";
    }

    if (!reviews.length) {
      listEl.innerHTML = '<div class="empty-row" style="grid-column:1/-1;">' +
        (allCount ? "No reviews match this filter." : "No reviews yet. They appear here once customers submit feedback from the review page.") +
        "</div>";
      return;
    }

    listEl.innerHTML = reviews.map(reviewCardHTML).join("");
  }

  function reviewProductStats(reviews) {
    var map = {};
    reviews.forEach(function (r) {
      var name = r.product || "Unknown product";
      if (!map[name]) {
        map[name] = { name: name, count: 0, total: 0, complaints: 0, changes: 0, fiveStar: 0 };
      }
      var p = map[name];
      p.count += 1;
      p.total += Number(r.rating) || 0;
      if ((r.complaint || "").trim()) p.complaints += 1;
      if ((r.change || "").trim()) p.changes += 1;
      if (Number(r.rating) === 5) p.fiveStar += 1;
    });
    return Object.keys(map)
      .map(function (key) { return map[key]; })
      .sort(function (a, b) {
        var diff = b.total / b.count - a.total / a.count;
        if (diff !== 0) return diff;
        return b.count - a.count;
      });
  }

  function renderReviewAnalytics() {
    var statsBody = document.getElementById("reviewStatsBody");
    var calloutsEl = document.getElementById("reviewCallouts");
    if (!statsBody) return;

    var all = getReviews();
    var stats = reviewProductStats(all);

    if (!all.length) {
      if (calloutsEl) calloutsEl.innerHTML = "";
      statsBody.innerHTML = '<tr><td colspan="7" class="empty-row" style="padding:28px;text-align:center;">No reviews yet — insights appear once customers start reviewing products.</td></tr>';
      return;
    }

    if (calloutsEl) {
      var mostReviewed = stats.slice().sort(function (a, b) { return b.count - a.count; })[0];
      var topRated = stats[0];
      var needsAttention = stats.slice().sort(function (a, b) { return b.complaints - a.complaints; })[0];
      calloutsEl.innerHTML =
        '<div class="review-callout">' +
          '<span class="review-callout-label">Most reviewed</span>' +
          '<strong>' + escapeHtml(mostReviewed.name) + "</strong>" +
          "<p>" + mostReviewed.count + " review" + (mostReviewed.count !== 1 ? "s" : "") + "</p>" +
        "</div>" +
        '<div class="review-callout review-callout-green">' +
          '<span class="review-callout-label">Top rated</span>' +
          '<strong>' + escapeHtml(topRated.name) + "</strong>" +
          '<p>' + (topRated.total / topRated.count).toFixed(1) + "/5 average" + "</p>" +
        "</div>" +
        '<div class="review-callout review-callout-red">' +
          '<span class="review-callout-label">Needs attention</span>' +
          '<strong>' + escapeHtml(needsAttention.name) + "</strong>" +
          "<p>" + needsAttention.complaints + " complaint" + (needsAttention.complaints !== 1 ? "s" : "") + "</p>" +
        "</div>";
    }

    statsBody.innerHTML = stats
      .map(function (p, idx) {
        var avg = p.count ? p.total / p.count : 0;
        return (
          "<tr>" +
            "<td>" + (idx + 1) + "</td>" +
            "<td><strong>" + escapeHtml(p.name) + "</strong></td>" +
            "<td>" + p.count + "</td>" +
            "<td>" + starsHTML(avg) + ' <span class="rev-avg">' + avg.toFixed(1) + "</span></td>" +
            "<td>" + p.fiveStar + " <span class=\"rev-sub\">(" + Math.round((p.fiveStar / p.count) * 100) + "%)</span></td>" +
            '<td class="' + (p.complaints ? "rev-warn" : "") + '">' + p.complaints + "</td>" +
            "<td>" + p.changes + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function initReviewSection() {
    renderReviewFilters();
    renderReviews();
    renderReviewAnalytics();
  }

  function reviewCardHTML(r) {
    var contact = [r.name, r.phone, r.email].filter(function (v) { return v && v.trim(); });
    var contactLine = contact.length
      ? contact.map(function (v) {
          var href = "";
          if (/^[\d+\s\-().]+$/.test(v)) {
            var digits = v.replace(/[^\d]/g, "").replace(/^0/, "234");
            href = ' href="https://wa.me/' + digits + '" target="_blank" rel="noopener"';
          } else if (/@/.test(v)) {
            href = ' href="mailto:' + escapeHtml(v) + '"';
          }
          return href ? '<a' + href + ">" + escapeHtml(v) + "</a>" : escapeHtml(v);
        })
        .join(" &middot; ")
      : "\u2014";

    return (
      '<div class="dist-admin-card">' +
        '<div class="dist-admin-head">' +
          '<div class="dist-admin-id">' +
            '<div class="dist-admin-avatar">' + escapeHtml(initials(r.name || r.product)) + "</div>" +
            "<div>" +
              '<div class="dist-admin-name">' + escapeHtml(r.product) + "</div>" +
              '<div class="dist-admin-meta">' + escapeHtml(formatDate(r.ts)) +
                (r.order ? " &middot; " + escapeHtml(r.order) : "") + "</div>" +
            "</div>" +
          "</div>" +
          '<span class="rev-stars-badge">' + starsHTML(r.rating) + "</span>" +
        "</div>" +
        '<div class="dist-admin-body">' +
          '<div class="dist-admin-row"><span>Rating</span><p>' + starsHTML(r.rating) + "</p></div>" +
          '<div class="dist-admin-row"><span>Complaint</span><p>' + escapeHtml(r.complaint || "\u2014") + "</p></div>" +
          '<div class="dist-admin-row"><span>Change wanted</span><p>' + escapeHtml(r.change || "\u2014") + "</p></div>" +
          '<div class="dist-admin-row"><span>Contact</span><p>' + contactLine + "</p></div>" +
        "</div>" +
        '<div class="dist-admin-foot">' +
          '<span class="dist-status ' + (Number(r.rating) >= 4 ? "dist-status-approved" : "dist-status-new") + '">' +
            escapeHtml(r.status || "New") + "</span>" +
          '<button type="button" class="admin-btn admin-btn-danger admin-btn-sm" data-action="review-delete" data-id="' + escapeHtml(r.id) + '">Delete</button>' +
        "</div>" +
      "</div>"
    );
  }

  var reviewsListEl = document.getElementById("reviewsList");
  if (reviewsListEl) {
    reviewsListEl.addEventListener("click", function (e) {
      var delBtn = e.target.closest("[data-action='review-delete']");
      if (!delBtn) return;
      var id = delBtn.getAttribute("data-id");
      if (!confirm("Delete this review?")) return;
      saveReviews(getReviews().filter(function (r) { return r.id !== id; }));
      initReviewSection();
      showToast("Review deleted.");
    });
  }

  var reviewProductEl = document.getElementById("reviewProductFilter");
  if (reviewProductEl) {
    reviewProductEl.addEventListener("change", function () {
      reviewProductFilter = reviewProductEl.value;
      renderReviews();
      renderReviewAnalytics();
    });
  }

  var reviewRatingEl = document.getElementById("reviewRatingFilter");
  if (reviewRatingEl) {
    reviewRatingEl.addEventListener("change", function () {
      reviewRatingFilter = reviewRatingEl.value;
      renderReviews();
      renderReviewAnalytics();
    });
  }

  var reviewFilterReset = document.getElementById("reviewFilterReset");
  if (reviewFilterReset) {
    reviewFilterReset.addEventListener("click", function () {
      reviewProductFilter = "";
      reviewRatingFilter = "";
      initReviewSection();
    });
  }

  var btnReviewExport = document.getElementById("btnReviewExport");
  if (btnReviewExport) {
    btnReviewExport.addEventListener("click", function () {
      var reviews = getReviews();
      if (!reviews.length) { showToast("No reviews to export."); return; }
      var headers = ["Date", "Status", "Product", "Rating", "Complaint", "Change Wanted", "Name", "Phone", "Email", "Order"];
      var csv = "\uFEFF" + headers.join(",") + "\n";
      reviews.forEach(function (r) {
        var row = [
          new Date(r.ts).toISOString(), r.status, r.product, r.rating, r.complaint,
          r.change, r.name, r.phone, r.email, r.order
        ];
        csv += row
          .map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; })
          .join(",") + "\n";
      });
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "urch-product-reviews.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Reviews exported to CSV.");
    });
  }

  var btnReviewClear = document.getElementById("btnReviewClear");
  if (btnReviewClear) {
    btnReviewClear.addEventListener("click", function () {
      if (!getReviews().length) { showToast("Nothing to clear."); return; }
      if (!confirm("Delete all reviews?")) return;
      saveReviews([]);
      renderReviews();
      showToast("Reviews cleared.");
    });
  }

  /* ── Init ── */

  function init() {
    getProducts(); // ensure seeded
    populateSaleSelects();
    renderProducts();
    renderSales();
    renderActivity();
    renderDistributors();
    initReviewSection();
    renderDashboard();
  }

  init();
})();
