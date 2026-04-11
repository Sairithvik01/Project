// --- 1. INITIALIZE DB AND ALL REQUIRED DATA ARRAYS ---
// DB is loaded from data.js
//
// Automatically update category counts
db.categories.forEach(cat => {
    cat.productCount = db.products.filter(p => p.catId === cat.id).length;
});

// --- WISHLIST STATE ---
let wishlist = [];

// --- UTILITY FUNCTIONS ---
function formatPrice(price) {
    return '₹' + Number(price).toLocaleString('en-IN');
}

// --- GLOBAL USER STATE ---
let currentUser = null;

// --- AUTH FUNCTIONS ---
function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

function togglePasswordVisibility(inputId = 'password') {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`;
    } else {
        input.type = 'password';
        button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
    }
}

function getUsers() {
    const users = localStorage.getItem('damodarUsers');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('damodarUsers', JSON.stringify(users));
}

function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function registerUser(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return false; // User already exists
    }
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    saveUsers(users);
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    navigate('home');
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // Update UI to show logged in state
        updateAuthUI();
    }
}

function updateAuthUI() {
    const loginLink = document.getElementById('nav-login');
    if (currentUser) {
        loginLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        loginLink.title = `Logged in as ${currentUser.name}`;
        loginLink.onclick = () => showUserMenu();
    } else {
        loginLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        loginLink.title = "Login";
        loginLink.onclick = () => navigate('login');
    }
}

function showUserMenu() {
    const root = document.getElementById('popup-root');
    root.innerHTML = `
        <div class="location-popup" id="user-menu-popup">
            <div class="location-content" style="max-width: 300px;">
                <button class="close-popup" onclick="closeUserMenu()">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <h3>Welcome, ${currentUser.name}!</h3>
                <div style="margin-top: 1rem;">
                    <button onclick="logoutUser()" style="width: 100%; padding: 0.75rem; background: var(--accent); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Logout</button>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('user-menu-popup').classList.add('show'), 10);
}

function closeUserMenu() {
    const popup = document.getElementById('user-menu-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }
}

// --- SPA ROUTING LOGIC ---
function navigate(viewId, categoryFilter = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(l => l.classList.remove('active-link'));
    
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');
    
    const navLink = document.getElementById(`nav-${viewId}`);
    if (navLink) navLink.classList.add('active-link');

    if (viewId === 'products') {
        renderProducts(categoryFilter);
    }
    if (viewId === 'categories') {
        renderCategories();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- CAROUSEL LOGIC ---
let currentSlideIndex = 0;
let slideInterval;

function renderCarousel() {
    const container = document.getElementById('slides-container');
    const dotsContainer = document.getElementById('carousel-dots');
    
    db.carousels.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slideEl.innerHTML = `
            <div class="slide-bg" style="background-image: url('${slide.image}')"></div>
            <div class="slide-content">
                <div class="slide-content-inner">
                    <h2>${slide.title}</h2>
                    <p>${slide.subtitle}</p>
                    <button class="btn-primary" onclick="navigate('products')">Shop Now</button>
                </div>
            </div>
        `;
        container.appendChild(slideEl);

        const dot = document.createElement('button');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    startAutoPlay();
}

function updateSlides() {
    const slides = document.querySelectorAll('.carousel-slide');
    slides.forEach((el, index) => el.classList.toggle('active', index === currentSlideIndex));
    document.querySelectorAll('.dot').forEach((el, index) => el.classList.toggle('active', index === currentSlideIndex));
}

function nextSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    updateSlides();
    resetInterval();
}

function prevSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    updateSlides();
    resetInterval();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateSlides();
    resetInterval();
}

function startAutoPlay() { slideInterval = setInterval(nextSlide, 5000); }
function resetInterval() { clearInterval(slideInterval); startAutoPlay(); }

// --- CATEGORIES RENDER ---
function renderCategories() {
    const homeGrid = document.getElementById('home-categories-grid');
    const catGrid = document.getElementById('subcategories-grid');
    
    // Ensure counts are always synced with the product data
    db.categories.forEach(cat => {
        cat.productCount = db.products.filter(p => p.catId === cat.id).length;
    });

    const html = db.categories.map(category => `
        <a href="#" onclick="navigate('products', '${category.id}'); return false;" class="category-card">
            <img src="${category.image}" alt="${category.name}" class="category-image">
            <div class="category-glass">
                <h3>${category.name}</h3>
                <p>${category.productCount} Products</p>
            </div>
        </a>
    `).join('');

    if(homeGrid) homeGrid.innerHTML = html;
    if(catGrid) catGrid.innerHTML = html;
}

function renderDropdownCategories() {
    const dropdown = document.getElementById('dropdown-categories');
    if (!dropdown) return;

    const html = db.categories.map(category => `
        <a href="#" onclick="navigate('products', '${category.id}'); return false;" class="dropdown-item">
            ${category.name} <span class="item-count">${category.productCount}</span>
        </a>
    `).join('');

    dropdown.innerHTML = html;
}

// --- PRODUCTS RENDER ---
function renderProducts(filterCatId = null) {
    const container = document.getElementById('products-grid-container');
    const title = document.getElementById('products-page-title');
    if (!container) return;

    let filteredProducts = db.products;
    if (filterCatId) {
        filteredProducts = db.products.filter(p => p.catId === filterCatId);
        const catInfo = db.categories.find(c => c.id === filterCatId);
        if (title) title.innerText = catInfo ? catInfo.name : 'Products';
    } else {
        if (title) title.innerText = 'All Products';
    }

    if (filteredProducts.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--muted-foreground); padding: 3rem 0;">No products found in this category.</p>`;
        return;
    }

    container.innerHTML = generateProductsHTML(filteredProducts);
}

function generateProductsHTML(productsArray) {
    return productsArray.map(product => {
        const catName = db.categories.find(c => c.id === product.catId)?.name || 'General';
        const inWishlist = isInWishlist(product.id);
        const buttonColor = inWishlist ? 'style="border-color: #f43f5e; color: #e11d48;"' : '';
        const buttonText = inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
        const fillAttr = inWishlist ? 'fill="currentColor"' : 'fill="none"';
        
        return `
        <div class="product-card" onclick="showProductDetail(${product.id})">
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400'">
            </div>
            <div class="product-info">
                <span class="product-category">${catName}</span>
                <h3 class="product-title">${product.name}</h3>
                <span class="product-price">${formatPrice(product.price)}</span>
                <button class="wishlist-btn" data-product-id="${product.id}" ${buttonColor} onclick="event.stopPropagation(); ${inWishlist ? `removeFromWishlist(${product.id})` : `addToWishlist(${product.id})`}">
                    <svg viewBox="0 0 24 24" ${fillAttr} stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>${buttonText}</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

// --- AI ASSISTANT LOGIC ---
function handleAIPrompt() {
const queryInput = document.getElementById('ai-query-input').value.trim().toLowerCase();
const container = document.getElementById('ai-results-container');
const grid = document.getElementById('ai-products-grid');
const subtitle = document.getElementById('ai-results-subtitle');

if (!queryInput) {
    alert('Please enter an occasion, style, recipient, or gift purpose.');
    return;
}

const queryWords = queryInput
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const intentProfiles = {
    trophies: 'winner sports tournament competition champion recognition award medal hockey cricket football',
    academic: 'school college appreciation certificate plaque achievement recognition',
    glass: 'corporate premium office award crystal recognition elegant',
    'home-decor': 'home decoration housewarming interior stylish statue figurine decor',
    'wall-decor': 'wall decoration art design hanging room interior decor'
};

const scoredProducts = db.products.map(product => {
    let score = 0;

    const categoryName = db.categories.find(c => c.id === product.catId)?.name.toLowerCase() || '';
    const productText = `${product.name} ${categoryName} ${intentProfiles[product.catId] || ''}`.toLowerCase();

    queryWords.forEach(word => {
        if (productText.includes(word)) score += 6;
    });

    // partial semantic similarity
    const stems = ['decor', 'sport', 'award', 'gift', 'home', 'wall'];
    stems.forEach(stem => {
        if (queryInput.includes(stem) && productText.includes(stem)) score += 5;
    });

    // intent-based boosts
    if ((queryInput.includes('decor') || queryInput.includes('decoration')) && ['home-decor','wall-decor'].includes(product.catId)) {
        score += 15;
    }

    if ((queryInput.includes('sport') || queryInput.includes('winner') || queryInput.includes('hockey')) && product.catId === 'trophies') {
        score += 15;
    }

    if ((queryInput.includes('office') || queryInput.includes('corporate')) && ['glass','academic'].includes(product.catId)) {
        score += 12;
    }

    // price intelligence
    if (queryInput.includes('premium') && product.price > 2000) score += 5;
    if ((queryInput.includes('budget') || queryInput.includes('cheap')) && product.price < 1000) score += 5;

    return { ...product, score };
});

let recommendations = scoredProducts
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

// smart fallback based on closest intent category
if (recommendations.length === 0) {
    let fallbackCategory = 'glass';
    if (queryInput.includes('decor')) fallbackCategory = 'home-decor';
    else if (queryInput.includes('wall')) fallbackCategory = 'wall-decor';
    else if (queryInput.includes('sport')) fallbackCategory = 'trophies';

    recommendations = db.products
        .filter(p => p.catId === fallbackCategory)
        .slice(0, 8);
}

container.style.display = 'block';
subtitle.innerText = `Smart recommendations for "${queryInput}"`;
grid.innerHTML = generateProductsHTML(recommendations);
container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Allow pressing Enter in AI input — wired up in DOMContentLoaded below


// --- WISHLIST LOGIC ---
function isInWishlist(productId) {
    return wishlist.some(item => item.id === productId);
}

function addToWishlist(productId) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return;

    if (!isInWishlist(productId)) {
        wishlist.push(product);
        updateProductCards();
        showWishlistPopup(); // Show popup to confirm
    }
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    updateProductCards();
    showWishlistPopup(); // Re-render
}

function updateProductCards() {
    const allCards = document.querySelectorAll('.product-card');
    allCards.forEach(card => {
        const button = card.querySelector('.wishlist-btn');
        if (!button) return;
        
        const productId = parseInt(button.getAttribute('data-product-id'));
        const inWishlist = isInWishlist(productId);
        
        if (inWishlist) {
            button.textContent = '';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>Remove from Wishlist</span>
            `;
            button.style.borderColor = '#f43f5e';
            button.style.color = '#e11d48';
            button.onclick = (e) => {
                e.stopPropagation();
                removeFromWishlist(productId);
            };
        } else {
            button.textContent = '';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>Add to Wishlist</span>
            `;
            button.style.borderColor = '';
            button.style.color = '';
            button.onclick = (e) => {
                e.stopPropagation();
                addToWishlist(productId);
            };
        }
    });
}

function showWishlistPopup() {
    const root = document.getElementById('popup-root');
    
    let contentHtml = '';

    if (wishlist.length === 0) {
        contentHtml = `
            <div style="text-align: center; padding: 2rem 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" stroke-width="1.5" style="width: 4rem; height: 4rem; margin-bottom: 1rem;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <p style="color: var(--muted-foreground); margin-bottom: 1.5rem;">Your wishlist is currently empty.</p>
                <button class="btn-primary" style="width: 100%; border: none;" onclick="closeWishlistPopup(); navigate('products')">Browse Products</button>
            </div>
        `;
    } else {
        const itemsHtml = wishlist.map(item => `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem;" onerror="this.src='https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100'">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">${item.name}</h4>
                    <div style="color: var(--accent); font-weight: bold; font-size: 0.9rem;">${formatPrice(item.price)}</div>
                </div>
                <button onclick="removeFromWishlist(${item.id})" style="border: none; background: var(--secondary); color: var(--foreground); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer;">Remove</button>
            </div>
        `).join('');

        contentHtml = `
            <div class="wishlist-items" style="max-height: 40vh; overflow-y: auto; margin-bottom: 1.5rem; padding-right: 0.5rem;">
                ${itemsHtml}
            </div>
            <p style="text-align: center; color: var(--muted-foreground); font-size: 0.9rem;">Visit our store to inquire about these items.</p>
        `;
    }

    root.innerHTML = `
        <div class="location-popup" id="wishlist-popup">
            <div class="location-content" style="max-width: 480px;">
                <button class="close-popup" onclick="closeWishlistPopup()">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <h3 style="margin-bottom: 1.5rem;">Your Wishlist</h3>
                ${contentHtml}
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('wishlist-popup').classList.add('show'), 10);
}

function closeWishlistPopup() {
    const popup = document.getElementById('wishlist-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }
}

// --- LOCATION POPUP ---
function showLocationPopup() {
    const root = document.getElementById('popup-root');
    root.innerHTML = `
        <div class="location-popup" id="loc-popup">
            <div class="location-content">
                <button class="close-popup" onclick="closeLocationPopup()">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <h3>Our Locations</h3>
                <div class="location-list">
                    ${db.locations.map(loc => `
                        <div class="location-item">
                            <h4>${loc.name}</h4>
                            <p>📍 ${loc.address}</p>
                            <p>📞 ${loc.phone}</p>
                            <p>🕒 ${loc.hours}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    setTimeout(() => document.getElementById('loc-popup').classList.add('show'), 10);
}

function closeLocationPopup() {
    const popup = document.getElementById('loc-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }
}

// --- PRODUCT DETAIL MODAL ---
let currentDetailProductId = null;

function showProductDetail(productId) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return;

    currentDetailProductId = productId;
    const catName = db.categories.find(c => c.id === product.catId)?.name || 'General';

    document.getElementById('detail-product-image').src = product.image;
    document.getElementById('detail-product-category').textContent = catName;
    document.getElementById('detail-product-name').textContent = product.name;
    document.getElementById('detail-product-description').textContent = product.description;
    document.getElementById('detail-product-price').textContent = formatPrice(product.price);

    updateDetailModalButton();

    const modal = document.getElementById('product-detail-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateDetailModalButton() {
    const btn = document.getElementById('detail-wishlist-btn');
    if (!btn || !currentDetailProductId) return;
    
    const inWishlist = isInWishlist(currentDetailProductId);
    
    if (inWishlist) {
        btn.textContent = '';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Remove from Wishlist
        `;
    } else {
        btn.textContent = '';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Add to Wishlist
        `;
    }
}

function closeProductDetail() {
    const modal = document.getElementById('product-detail-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentDetailProductId = null;
}

function addToWishlistFromDetail() {
    if (currentDetailProductId) {
        if (isInWishlist(currentDetailProductId)) {
            removeFromWishlist(currentDetailProductId);
        } else {
            addToWishlist(currentDetailProductId);
        }
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    renderCarousel();
    renderCategories();
    renderDropdownCategories();

    // Close modal when clicking outside
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductDetail();
        });
    }
    
    // Events
    document.getElementById('prev-btn')?.addEventListener('click', prevSlide);
    document.getElementById('next-btn')?.addEventListener('click', nextSlide);

    // Set Initial Active Link
    document.getElementById('nav-home').classList.add('active-link');

    // AI input Enter key
    const aiInput = document.getElementById('ai-query-input');
    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAIPrompt();
        });
    }

    // Search bar
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                document.getElementById('ai-query-input').value = searchInput.value.trim();
                navigate('home');
                handleAIPrompt();
                searchInput.value = '';
            }
        });
    }

    // Login Form Validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('password-error');

            if (password.length < 6) {
                errorDiv.textContent = 'Password must be at least 6 characters';
                errorDiv.style.display = 'block';
                return;
            }

            if (loginUser(email, password)) {
                errorDiv.style.display = 'none';
                updateAuthUI();
                navigate('home');
                alert('Login successful!');
            } else {
                errorDiv.textContent = 'Invalid email or password';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Register Form Validation
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const errorDiv = document.getElementById('reg-password-error');

            if (password.length < 6) {
                errorDiv.textContent = 'Password must be at least 6 characters';
                errorDiv.style.display = 'block';
                return;
            }

            if (password !== confirmPassword) {
                errorDiv.textContent = 'Passwords do not match';
                errorDiv.style.display = 'block';
                return;
            }

            if (registerUser(name, email, password)) {
                errorDiv.style.display = 'none';
                updateAuthUI();
                navigate('home');
                alert('Registration successful!');
            } else {
                errorDiv.textContent = 'Email already exists';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Check auth status on load
    checkAuthStatus();
});
