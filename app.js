// ── Auth ──────────────────────────────────────────────────────────────────
const VALID_USERS = [
  { username: 'admin', password: 'admin123', name: 'Admin User' },
  { username: 'demo',  password: 'demo2024', name: 'Demo User'  },
];

let currentUser = null;

function login(username, password) {
  const found = VALID_USERS.find(u => u.username === username && u.password === password);
  if (found) {
    currentUser = { username: found.username, name: found.name };
    return { success: true };
  }
  return { success: false, error: 'Invalid username or password.' };
}

function logout() {
  currentUser = null;
}

// ── Router / SPA ──────────────────────────────────────────────────────────
const pages = ['home', 'outbound', 'form', 'video', 'download'];
let activePage = 'home';

function showPage(name) {
  if (!pages.includes(name)) name = 'home';
  activePage = name;

  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('hidden', p !== name);
  });

  // update active nav items
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });

  // Special: rebuild video player when switching to video tab
  if (name === 'video') initVideoPage();
}

function navigate(page) {
  showPage(page);
  closeMobileMenu();
}

// ── Delegated click navigation ────────────────────────────────────────────
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-page]');
  if (el) {
    e.preventDefault();
    navigate(el.dataset.page);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────
const loginPage = document.getElementById('login-page');
const app       = document.getElementById('app');

document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('login-error');
  const errText  = document.getElementById('error-text');
  const btn      = document.getElementById('login-btn');

  errEl.classList.add('hidden');

  if (!username || !password) {
    errText.textContent = 'Please enter both username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  await delay(500);

  const result = login(username, password);
  btn.disabled = false;
  btn.textContent = 'Sign in';

  if (result.success) {
    loginPage.classList.add('hidden');
    app.classList.remove('hidden');
    document.getElementById('nav-username').textContent = currentUser.name;
    document.getElementById('mobile-username').textContent = currentUser.name;
    buildOutboundGrid();
    buildDownloadList();
    buildPlaylist();
    showPage('home');
  } else {
    errText.textContent = result.error;
    errEl.classList.remove('hidden');
  }
});

// Show/hide password
document.getElementById('toggle-pw').addEventListener('click', function() {
  const input = document.getElementById('password');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  this.textContent = isHidden ? 'hide' : 'show';
});

// ── Logout ────────────────────────────────────────────────────────────────
function handleLogout() {
  logout();
  app.classList.add('hidden');
  loginPage.classList.remove('hidden');
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-btn').textContent = 'Sign in';
  closeMobileMenu();
}

document.getElementById('logout-btn').addEventListener('click', handleLogout);
document.getElementById('mobile-logout-btn').addEventListener('click', handleLogout);

// ── Mobile menu ───────────────────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const iconMenu   = document.getElementById('icon-menu');
const iconClose  = document.getElementById('icon-close');

hamburger.addEventListener('click', function() {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden', isOpen);
  iconMenu.classList.toggle('hidden', !isOpen);
  iconClose.classList.toggle('hidden', isOpen);
});

function closeMobileMenu() {
  mobileMenu.classList.add('hidden');
  iconMenu.classList.remove('hidden');
  iconClose.classList.add('hidden');
}

// ── Outbound page ─────────────────────────────────────────────────────────
const outboundLinks = [
  { label: 'Visit Google',    url: 'https://www.google.com',           category: 'Search Engine',  desc: 'Navigate to Google homepage.' },
  { label: 'Visit GitHub',    url: 'https://www.github.com',           category: 'Developer',      desc: 'Open GitHub in a new tab.' },
  { label: 'Visit MDN',       url: 'https://developer.mozilla.org',    category: 'Documentation',  desc: 'Go to Mozilla Developer Network.' },
  { label: 'Visit Vite Docs', url: 'https://vitejs.dev',               category: 'Documentation',  desc: 'Official Vite documentation.' },
  { label: 'Visit Tailwind',  url: 'https://tailwindcss.com',          category: 'Styling',        desc: 'Tailwind CSS official site.' },
  { label: 'Visit React Docs',url: 'https://react.dev',                category: 'Framework',      desc: 'Official React documentation.' },
];

function handleOutboundClick(url, label) {
  // GA4 hook: gtag('event', 'outbound_click', { link_url: url, link_text: label });
  console.log(`[Analytics] outbound_click — ${label} → ${url}`);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function buildOutboundGrid() {
  const grid = document.getElementById('outbound-grid');
  grid.innerHTML = outboundLinks.map(({ label, url, category, desc }) => `
    <div class="link-card">
      <p class="section-label card-cat">${category}</p>
      <p class="card-desc">${desc}</p>
      <button class="btn-primary" onclick="handleOutboundClick('${url}','${label}')">
        ${label} <span class="muted">↗</span>
      </button>
    </div>
  `).join('');
}

// ── Contact form ──────────────────────────────────────────────────────────
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const name    = document.getElementById('cf-name');
  const email   = document.getElementById('cf-email');
  const message = document.getElementById('cf-message');
  const btn     = document.getElementById('form-submit-btn');

  // Clear errors
  ['name', 'email', 'message'].forEach(f => {
    document.getElementById('err-' + f).classList.add('hidden');
    document.getElementById('cf-' + f).classList.remove('error-border');
  });

  let valid = true;

  if (!name.value.trim()) {
    document.getElementById('err-name').classList.remove('hidden');
    name.classList.add('error-border');
    valid = false;
  }
  const emailRe = /^\S+@\S+\.\S+$/;
  if (!emailRe.test(email.value.trim())) {
    document.getElementById('err-email').classList.remove('hidden');
    email.classList.add('error-border');
    valid = false;
  }
  if (message.value.trim().length < 10) {
    document.getElementById('err-message').classList.remove('hidden');
    message.classList.add('error-border');
    valid = false;
  }

  if (!valid) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';
  await delay(800);

  const data = {
    name:      name.value,
    email:     email.value,
    subject:   document.getElementById('cf-subject').value,
    message:   message.value,
    subscribe: document.getElementById('cf-subscribe').checked,
  };

  // GA4 hook: gtag('event', 'form_submit', { form_name: 'contact' });
  console.log('[Analytics] form_submit —', data);

  btn.disabled = false;
  btn.textContent = 'Send message';

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('form-success').classList.remove('hidden');
});

document.getElementById('form-reset-btn').addEventListener('click', function() {
  document.getElementById('contact-form').reset();
  ['name', 'email', 'message'].forEach(f => {
    document.getElementById('err-' + f).classList.add('hidden');
    document.getElementById('cf-' + f).classList.remove('error-border');
  });
  document.getElementById('form-success').classList.add('hidden');
  document.getElementById('form-view').classList.remove('hidden');
});

// ── Video page ────────────────────────────────────────────────────────────
const videos = [
  { title: 'Big Buck Bunny',       ytId: 'aqz-KE-bpKQ', desc: 'A classic open-source short film by Blender Foundation.' },
  { title: 'React in 100 Seconds', ytId: 'Tn6-PIqc4UM', desc: 'Fireship quick intro to React.' },
  { title: 'Vite in 100 Seconds',  ytId: 'KCrXgy8qtjM', desc: 'Fireship quick intro to Vite.' },
];
let activeVideo = 0;

function buildPlaylist() {
  const container = document.getElementById('playlist-items');
  container.innerHTML = videos.map((v, i) => `
    <button class="playlist-btn${i === 0 ? ' active' : ''}" onclick="selectVideo(${i})">
      <span class="pl-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="pl-title">${v.title}</span>
    </button>
  `).join('');
}

function selectVideo(index) {
  activeVideo = index;
  const v = videos[index];

  // Update player
  const wrap = document.getElementById('video-player-wrap');
  wrap.innerHTML = `<iframe
    src="https://www.youtube.com/embed/${v.ytId}?autoplay=1&enablejsapi=1"
    allow="autoplay; fullscreen"
    allowfullscreen></iframe>`;

  // GA4 hook: gtag('event', 'video_play', { video_title: v.title });
  console.log(`[Analytics] video_play — ${v.title}`);

  document.getElementById('video-title').textContent = v.title;
  document.getElementById('video-desc').textContent  = v.desc;

  document.querySelectorAll('.playlist-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
}

function initVideoPage() {
  const wrap = document.getElementById('video-player-wrap');
  if (wrap.innerHTML.trim() === '') {
    // Load first video (no autoplay on initial load)
    const v = videos[0];
    wrap.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${v.ytId}"
      allow="fullscreen"
      allowfullscreen></iframe>`;
  }
}

// ── Download page ─────────────────────────────────────────────────────────
const downloadFiles = [
  { name: 'sample-report.pdf', label: 'Sample Report',  size: '~45 KB', type: 'PDF', href: 'sample-report.pdf' },
  { name: 'sample-data.csv',   label: 'Sample Dataset', size: '~2 KB',  type: 'CSV', href: 'sample-data.csv'   },
  { name: 'readme.txt',        label: 'Read Me',        size: '~1 KB',  type: 'TXT', href: 'readme.txt'        },
];

const badgeClass = { PDF: 'badge-pdf', CSV: 'badge-csv', TXT: 'badge-txt' };

function buildDownloadList() {
  const list = document.getElementById('download-list');
  list.innerHTML = downloadFiles.map(file => `
    <div class="download-row">
      <div class="dl-left">
        <span class="file-type-badge ${badgeClass[file.type]}">${file.type}</span>
        <div class="dl-info">
          <p>${file.label}</p>
          <span>${file.name} · ${file.size}</span>
        </div>
      </div>
      <a href="${file.href}"
         download="${file.name}"
         class="btn-outline dl-btn"
         onclick="trackDownload('${file.name}')">
        Download ↓
      </a>
    </div>
  `).join('');
}

function trackDownload(name) {
  // GA4 hook: gtag('event', 'file_download', { file_name: name });
  console.log(`[Analytics] file_download — ${name}`);
}

// ── Utility ───────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
