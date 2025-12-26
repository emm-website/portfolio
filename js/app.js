/* =========================================================
   CONFIG
========================================================= */

const CART_KEY = "emm_cart"
const PRODUCTS_KEY = "emm_products"
const ORDERS_KEY = "emm_orders"

/* =========================================================
   PRODUCT DATABASE (SINGLE SOURCE OF TRUTH)
========================================================= */

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Blue Gem Bracelet", price: 6, image: "images/gem_blue.JPG" },
  { id: 2, name: "Purple Gem Bracelet", price: 6, image: "images/gem_purple.JPG" },
  { id: 3, name: "Dumbbell Necklace", price: 10, image: "images/dumbneck(small).jpg" },
  { id: 4, name: "Superman Ring", price: 7, image: "images/superman.jpg" },
  { id: 5, name: "Grey Gem Bracelet", price: 6, image: "images/gem_grey.JPG" },
  { id: 6, name: "Pink Gem Bracelet", price: 6, image: "images/gem_pink.JPG" }
]

// Initialize products from localStorage or use defaults
let PRODUCTS = []

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY)
    if (saved) {
      PRODUCTS = JSON.parse(saved)
    } else {
      PRODUCTS = [...DEFAULT_PRODUCTS]
      saveProducts()
    }
  } catch {
    PRODUCTS = [...DEFAULT_PRODUCTS]
    saveProducts()
  }
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(PRODUCTS))
}

// Load products on startup
loadProducts()

/* =========================================================
   CART CORE
========================================================= */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  updateCartCount()
}

function updateCartCount() {
  const cart = getCart()
  const count = cart.reduce((sum, item) => sum + item.qty, 0)
  const el = document.getElementById("cart-count")
  if (el) el.textContent = count
}

/* =========================================================
   CART ACTIONS
========================================================= */

function addToCart(productId) {
  const cart = getCart()
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return

  const existing = cart.find(item => item.id === productId)

  if (existing) {
    existing.qty++
  } else {
    cart.push({ ...product, qty: 1 })
  }

  saveCart(cart)
  notify("Added to cart")
}

function removeItem(index) {
  const cart = getCart()
  cart.splice(index, 1)
  saveCart(cart)
  renderCart()
}

function changeQty(index, value) {
  const cart = getCart()
  const qty = Math.max(1, Number(value))
  cart[index].qty = qty
  saveCart(cart)
  renderCart()
}

function clearCart() {
  localStorage.removeItem(CART_KEY)
  updateCartCount()
  renderCart()
}

/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {
  const cart = getCart()
  
  if (cart.length === 0) {
    notify("Your cart is empty")
    return
  }

  const user = getCurrentUser()
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const order = {
    id: Date.now(),
    userEmail: user ? user.email : "Guest",
    items: cart,
    total: total,
    date: new Date().toLocaleString()
  }

  // Save order
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")
  orders.push(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

  // Clear cart
  clearCart()

  notify("Order placed successfully!")
  
  setTimeout(() => {
    alert(`Thank you for your order!\n\nOrder #${order.id}\nTotal: ${total} dt\n\nYou'll receive a confirmation email soon.`)
  }, 500)
}

/* =========================================================
   PRODUCT RENDERING
========================================================= */

function renderProducts(list = PRODUCTS) {
  const container = document.getElementById("products")
  if (!container) return

  if (list.length === 0) {
    container.innerHTML = "<p>No products found.</p>"
    return
  }

  container.innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.price} dt</p>
      <button onclick="addToCart(${p.id})">
        Add to cart
      </button>
    </article>
  `).join("")
}

/* =========================================================
   CART PAGE RENDERING
========================================================= */

function renderCart() {
  const container = document.getElementById("cart-items")
  const totalEl = document.getElementById("total")
  if (!container || !totalEl) return

  const cart = getCart()

  if (cart.length === 0) {
    container.innerHTML = `
      <p>Your cart is empty.</p>
      <button onclick="location.href='index.html'">
        Continue shopping
      </button>
    `
    totalEl.textContent = "0 dt"
    return
  }

  let total = 0

  container.innerHTML = cart.map((item, index) => {
    const subtotal = item.price * item.qty
    total += subtotal

    return `
      <div class="cart-row">
        <img src="${item.image}" alt="${item.name}">
        <span>${item.name}</span>

        <input
          type="number"
          min="1"
          value="${item.qty}"
          onchange="changeQty(${index}, this.value)"
        >

        <span>${subtotal} dt</span>

        <button onclick="removeItem(${index})" aria-label="Remove item">
          ✕
        </button>
      </div>
    `
  }).join("")

  totalEl.textContent = `${total} dt`
}

/* =========================================================
   SEARCH (INDEX PAGE)
========================================================= */

function initSearch() {
  const input = document.getElementById("search-input")
  if (!input) return

  input.addEventListener("input", () => {
    const value = input.value.toLowerCase().trim()
    const filtered = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(value)
    )
    renderProducts(filtered)
  })
}

/* =========================================================
   UI FEEDBACK (NON-INTRUSIVE)
========================================================= */

function notify(text) {
  const toast = document.createElement("div")
  toast.textContent = text
  toast.style.position = "fixed"
  toast.style.bottom = "20px"
  toast.style.right = "20px"
  toast.style.background = "#1db954"
  toast.style.color = "#000"
  toast.style.padding = "10px 16px"
  toast.style.borderRadius = "6px"
  toast.style.fontWeight = "700"
  toast.style.zIndex = "9999"

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 1500)
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount()
  renderProducts()
  renderCart()
  initSearch()
  initAuth()
  initProfile()
})

/* =========================================================
   AUTH PAGE FUNCTIONALITY
========================================================= */

const AUTH_USER_KEY = "emm_user"

function initAuth() {
  const authForm = document.getElementById("auth-form")
  if (!authForm) return

  authForm.addEventListener("submit", handleAuthSubmit)
}

function handleAuthSubmit(e) {
  e.preventDefault()

  const title = document.getElementById("auth-title").textContent
  const isSignIn = title === "Sign In"

  const email = document.getElementById("auth-email").value.trim()
  const password = document.getElementById("auth-password").value
  const name = document.getElementById("auth-name").value.trim()

  if (isSignIn) {
    // Sign In Logic
    const storedUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null")

    if (!storedUser) {
      notify("No account found. Please register first.")
      return
    }

    if (storedUser.email === email && storedUser.password === password) {
      notify("Welcome back!")
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1000)
    } else {
      notify("Invalid email or password")
    }
  } else {
    // Register Logic
    if (!name) {
      notify("Please enter your name")
      return
    }

    // Check if user wants admin role (secret: add "admin" at the end of email)
    const isAdminUser = email.endsWith("@admin") || email === "admin@emm.com"

    const userData = {
      name: name,
      email: email,
      password: password,
      role: isAdminUser ? "admin" : "user",
      createdAt: new Date().toISOString()
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
    notify("Account created successfully!")
    
    setTimeout(() => {
      window.location.href = isAdminUser ? "admin.html" : "index.html"
    }, 1000)
  }
}

function toggleAuthMode() {
  const title = document.getElementById("auth-title")
  const nameInput = document.getElementById("auth-name")
  const submitBtn = document.getElementById("auth-submit")
  const switchText = document.getElementById("auth-text")
  const switchBtn = document.querySelector(".auth-switch button")

  const isSignIn = title.textContent === "Sign In"

  if (isSignIn) {
    // Switch to Register mode
    title.textContent = "Create Account"
    nameInput.hidden = false
    nameInput.required = true
    submitBtn.textContent = "Register"
    switchText.textContent = "Already have an account?"
    switchBtn.textContent = "Sign In"
  } else {
    // Switch to Sign In mode
    title.textContent = "Sign In"
    nameInput.hidden = true
    nameInput.required = false
    submitBtn.textContent = "Sign In"
    switchText.textContent = "Don't have an account?"
    switchBtn.textContent = "Register"
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null")
}

function logout() {
  localStorage.removeItem(AUTH_USER_KEY)
  notify("Logged out successfully")
  setTimeout(() => {
    window.location.href = "index.html"
  }, 800)
}

/* =========================================================
   PROFILE PAGE FUNCTIONALITY
========================================================= */

function initProfile() {
  const profilePage = document.querySelector(".profile-overview")
  if (!profilePage) return

  renderProfile()

  // Handle profile action button
  const actionBtn = document.querySelector(".profile-action-btn")
  if (actionBtn) {
    actionBtn.addEventListener("click", handleProfileAction)
  }

  // Handle avatar upload
  const avatarUpload = document.getElementById("avatar-upload")
  if (avatarUpload) {
    avatarUpload.addEventListener("change", handleAvatarUpload)
  }
}

function renderProfile() {
  const user = getCurrentUser()
  const profileName = document.querySelector(".profile-name")
  const profileEmail = document.querySelector(".profile-email")
  const actionBtn = document.querySelector(".profile-action-btn")
  const accountStatus = document.querySelector(".info-block:nth-child(1) p")
  const orders = document.querySelector(".info-block:nth-child(2) p")
  const savedItems = document.querySelector(".info-block:nth-child(3) p")
  const avatarImg = document.getElementById("profile-avatar")

  // Get cart count
  const cart = getCart()
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  if (!user) {
    // Guest user
    if (profileName) profileName.textContent = "Guest User"
    if (profileEmail) profileEmail.textContent = "Not logged in"
    if (actionBtn) {
      actionBtn.textContent = "Sign In / Register"
      actionBtn.style.background = ""
    }
    if (accountStatus) accountStatus.textContent = "Guest"
    if (orders) orders.textContent = "No orders yet"
    if (savedItems) savedItems.textContent = itemCount > 0 ? `${itemCount} items in cart` : "0 items"
    
    // Load guest avatar if exists
    const guestAvatar = localStorage.getItem('emm_guest_avatar')
    if (avatarImg && guestAvatar) {
      avatarImg.src = guestAvatar
    }
  } else {
    // Logged in user
    if (profileName) profileName.textContent = user.name
    if (profileEmail) profileEmail.textContent = user.email
    if (actionBtn) {
      actionBtn.textContent = "Sign Out"
      actionBtn.style.background = "#ff5c5c"
    }
    if (accountStatus) accountStatus.textContent = user.role === "admin" ? "Administrator" : "Active Member"
    if (orders) orders.textContent = "No orders yet"
    if (savedItems) savedItems.textContent = itemCount > 0 ? `${itemCount} items in cart` : "0 items"
    
    // Load user avatar if exists
    if (avatarImg && user.avatar) {
      avatarImg.src = user.avatar
    }

    // Add admin link if user is admin
    if (user.role === "admin") {
      const profileCard = document.querySelector(".profile-card")
      if (profileCard && !document.getElementById("admin-link-btn")) {
        const adminBtn = document.createElement("button")
        adminBtn.id = "admin-link-btn"
        adminBtn.textContent = "Admin Dashboard"
        adminBtn.style.cssText = "margin-top: 12px; background: var(--gradient-primary); color: #000; padding: 14px 20px; border-radius: 8px; font-weight: 800; width: 100%; cursor: pointer;"
        adminBtn.onclick = () => window.location.href = "admin.html"
        profileCard.insertBefore(adminBtn, actionBtn)
      }
    }
  }
}

function handleProfileAction() {
  const user = getCurrentUser()
  
  if (!user) {
    // Redirect to auth page
    window.location.href = "auth.html"
  } else {
    // Logout
    logout()
  }
}

function handleAvatarUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    notify('Please select an image file')
    return
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    notify('Image size must be less than 2MB')
    return
  }

  const reader = new FileReader()
  
  reader.onload = function(event) {
    const imageData = event.target.result
    
    // Save to user data
    const user = getCurrentUser()
    if (user) {
      user.avatar = imageData
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } else {
      // For guest users, save separately
      localStorage.setItem('emm_guest_avatar', imageData)
    }
    
    // Update display
    const avatarImg = document.getElementById('profile-avatar')
    if (avatarImg) {
      avatarImg.src = imageData
    }
    
    notify('Profile picture updated!')
  }
  
  reader.onerror = function() {
    notify('Failed to upload image')
  }
  
  reader.readAsDataURL(file)
}

/* ===============================
   ADMIN SUPPORT (ADDED)
================================ */

function isAdmin() {
  const user = getCurrentUser()
  return user && user.role === "admin"
}

/* ===============================
   EXTEND REGISTER LOGIC
================================ */

// PATCH: add role if missing
(function patchUserRole() {
  const user = getCurrentUser()
  if (user && !user.role) {
    user.role = "user"
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
})()

/* ===============================
   ADMIN PRODUCTS
================================ */

function renderAdminProducts() {
  const container = document.getElementById("admin-products")
  if (!container) return

  if (PRODUCTS.length === 0) {
    container.innerHTML = "<p>No products yet.</p>"
    return
  }

  container.innerHTML = PRODUCTS.map((p, i) => `
    <div class="admin-row">
      <span>${p.name}</span>
      <span>${p.price} dt</span>
      <button onclick="deleteAdminProduct(${i})">Delete</button>
    </div>
  `).join("")
}

function deleteAdminProduct(index) {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  PRODUCTS.splice(index, 1)
  saveProducts()
  notify("Product deleted")
  renderAdminProducts()
}

function addProduct() {
  const name = document.getElementById("new-name").value.trim()
  const price = Number(document.getElementById("new-price").value)
  const image = document.getElementById("new-image").value.trim()

  if (!name || !price || !image) {
    notify("Fill all fields")
    return
  }

  if (price <= 0) {
    notify("Price must be greater than 0")
    return
  }

  PRODUCTS.push({
    id: Date.now(),
    name,
    price,
    image
  })

  saveProducts()
  notify("Product added")
  renderAdminProducts()

  // Clear form
  document.getElementById("new-name").value = ""
  document.getElementById("new-price").value = ""
  document.getElementById("new-image").value = ""
}

/* ===============================
   ADMIN ORDERS
================================ */

function renderAdminOrders() {
  const container = document.getElementById("admin-orders")
  if (!container) return

  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")

  if (orders.length === 0) {
    container.innerHTML = "<p>No orders yet.</p>"
    return
  }

  container.innerHTML = orders.map((o, idx) => `
    <div class="order-card">
      <strong>Order #${o.id || idx + 1}</strong><br>
      User: ${o.userEmail || 'Guest'}<br>
      Total: ${o.total} dt<br>
      Date: ${o.date || 'N/A'}<br>
      Items: ${o.items.map(i => `${i.name} × ${i.qty}`).join(", ")}
    </div>
  `).join("")
}
