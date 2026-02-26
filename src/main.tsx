import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCwjeLijCB4-HfFbJjHrpfocJ5mn39pat0",
  authDomain: "nexusapp-c0a21.firebaseapp.com",
  databaseURL: "https://nexusapp-c0a21-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nexusapp-c0a21",
  storageBucket: "nexusapp-c0a21.firebasestorage.app",
  messagingSenderId: "487113661451",
  appId: "1:487113661451:web:1774402530bfd189c6fb0e",
  measurementId: "G-TQ7GDCG5QX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 2. ESTADO GLOBAL
let currentUser = null;
let currentView = 'home';
let library = JSON.parse(localStorage.getItem('qtoon_library') || '[]');

// 3. ELEMENTOS DEL DOM
const mainContent = document.getElementById('main-content');
const authView = document.getElementById('auth-view');
const navItems = document.querySelectorAll('.nav-item');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');
const detailModal = document.getElementById('detail-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const headerAvatarImg = document.getElementById('header-avatar-img');

// 4. UTILIDADES
const saveToLibrary = (item) => {
  if (!library.find(i => i.id === item.id)) {
    library.push(item);
    localStorage.setItem('qtoon_library', JSON.stringify(library));
    alert('¡Guardado en tu biblioteca!');
  } else {
    alert('Ya está en tu biblioteca');
  }
};

const removeFromLibrary = (id) => {
  library = library.filter(i => i.id !== id);
  localStorage.setItem('qtoon_library', JSON.stringify(library));
  if (currentView === 'library') renderLibrary();
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// 5. APIS
const APIs = {
  books: {
    trending: async () => {
      const res = await fetch('https://openlibrary.org/trending/daily.json?limit=10');
      const data = await res.json();
      return data.works.map(w => ({
        id: w.key,
        title: w.title,
        author: w.author_name?.[0] || 'Desconocido',
        image: w.cover_i ? `https://covers.openlibrary.org/b/id/${w.cover_i}-M.jpg` : 'https://via.placeholder.com/150x200?text=No+Cover',
        type: 'Libro',
        desc: 'Un libro fascinante disponible en OpenLibrary.'
      }));
    },
    search: async (q) => {
      const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=5`);
      const data = await res.json();
      return data.docs.map(w => ({
        id: w.key,
        title: w.title,
        author: w.author_name?.[0] || 'Desconocido',
        image: w.cover_i ? `https://covers.openlibrary.org/b/id/${w.cover_i}-M.jpg` : 'https://via.placeholder.com/150x200?text=No+Cover',
        type: 'Libro',
        desc: w.first_sentence?.[0] || 'Sin descripción disponible.'
      }));
    }
  },
  podcasts: {
    trending: async () => {
      const res = await fetch('https://itunes.apple.com/search?term=podcast&limit=10&media=podcast');
      const data = await res.json();
      return data.results.map(p => ({
        id: p.collectionId.toString(),
        title: p.collectionName,
        author: p.artistName,
        image: p.artworkUrl600 || p.artworkUrl100,
        type: 'Podcast',
        desc: `Podcast de ${p.primaryGenreName}.`
      }));
    },
    search: async (q) => {
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&limit=5&media=podcast`);
      const data = await res.json();
      return data.results.map(p => ({
        id: p.collectionId.toString(),
        title: p.collectionName,
        author: p.artistName,
        image: p.artworkUrl600 || p.artworkUrl100,
        type: 'Podcast',
        desc: `Podcast de ${p.primaryGenreName}.`
      }));
    }
  },
  manga: {
    trending: async () => {
      const res = await fetch('https://api.mangadex.org/manga?limit=10&includes[]=cover_art&order[followedCount]=desc');
      const data = await res.json();
      return data.data.map(m => {
        const cover = m.relationships.find(r => r.type === 'cover_art');
        return {
          id: m.id,
          title: m.attributes.title.en || Object.values(m.attributes.title)[0],
          author: 'MangaDex',
          image: cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover.attributes.fileName}.256.jpg` : 'https://via.placeholder.com/150x200?text=No+Cover',
          type: 'Manga',
          desc: m.attributes.description.en || 'Sin descripción.'
        };
      });
    },
    search: async (q) => {
      const res = await fetch(`https://api.mangadex.org/manga?title=${q}&limit=5&includes[]=cover_art`);
      const data = await res.json();
      return data.data.map(m => {
        const cover = m.relationships.find(r => r.type === 'cover_art');
        return {
          id: m.id,
          title: m.attributes.title.en || Object.values(m.attributes.title)[0],
          author: 'MangaDex',
          image: cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover.attributes.fileName}.256.jpg` : 'https://via.placeholder.com/150x200?text=No+Cover',
          type: 'Manga',
          desc: m.attributes.description.en || 'Sin descripción.'
        };
      });
    }
  }
};

// 6. RENDERIZADO
const openModal = (item) => {
  modalContent.innerHTML = `
    <div class="flex flex-col items-center text-center space-y-4">
      <img src="${item.image}" class="w-48 h-64 object-cover rounded-[28px] shadow-xl" alt="${item.title}">
      <div>
        <span class="px-3 py-1 bg-[#ff4757]/10 text-[#ff4757] text-xs font-bold rounded-full uppercase tracking-widest">${item.type}</span>
        <h3 class="text-2xl font-bold text-slate-900 mt-2">${item.title}</h3>
        <p class="text-slate-400 font-medium">${item.author}</p>
      </div>
      <p class="text-slate-600 leading-relaxed text-sm">${item.desc}</p>
      <button id="modal-save-btn" class="qtoon-btn w-full py-4 bg-[#ff4757] text-white font-bold shadow-lg shadow-red-200">
        ${library.find(i => i.id === item.id) ? 'En tu Biblioteca' : 'Guardar en mi Biblioteca'}
      </button>
    </div>
  `;
  
  document.getElementById('modal-save-btn').onclick = () => {
    saveToLibrary(item);
    openModal(item); // Refresh modal state
  };

  modalOverlay.classList.remove('hidden');
  setTimeout(() => {
    modalOverlay.classList.add('opacity-100');
    detailModal.classList.add('open');
  }, 10);
};

const closeModal = () => {
  detailModal.classList.remove('open');
  modalOverlay.classList.remove('opacity-100');
  setTimeout(() => {
    modalOverlay.classList.add('hidden');
  }, 400);
};

modalOverlay.onclick = closeModal;

const createCard = (item) => {
  const card = document.createElement('div');
  card.className = 'qtoon-card flex-shrink-0 w-40 space-y-2 cursor-pointer';
  card.innerHTML = `
    <div class="relative aspect-[3/4] rounded-[28px] overflow-hidden bg-slate-100 shadow-sm">
      <img src="${item.image}" class="w-full h-full object-cover" loading="lazy">
      <div class="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold uppercase text-[#ff4757]">${item.type}</div>
    </div>
    <div class="px-1">
      <h4 class="font-bold text-sm text-slate-800 line-clamp-1">${item.title}</h4>
      <p class="text-xs text-slate-400 line-clamp-1">${item.author}</p>
    </div>
  `;
  card.onclick = () => openModal(item);
  return card;
};

const renderSection = async (title, fetchFn) => {
  const safeId = title.replace(/[^a-z0-9]/gi, '');
  const sectionEl = document.createElement('div');
  sectionEl.className = 'space-y-4';
  sectionEl.innerHTML = `
    <div class="flex justify-between items-center">
      <h3 class="text-xl font-bold text-slate-900">${title}</h3>
      <button class="text-[#ff4757] text-xs font-bold uppercase tracking-wider">Ver todo</button>
    </div>
    <div class="flex gap-4 overflow-x-auto hide-scrollbar pb-4 min-h-[200px] items-center justify-center" id="section-container-${safeId}">
      <div class="loader w-8 h-8 border-4 border-slate-100 rounded-full"></div>
    </div>
  `;
  mainContent.appendChild(sectionEl);
  const container = sectionEl.querySelector(`#section-container-${safeId}`);

  try {
    const data = await fetchFn();
    container.innerHTML = '';
    container.classList.remove('justify-center');
    if (data.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm">No hay contenido disponible.</p>';
    } else {
      data.forEach(item => container.appendChild(createCard(item)));
    }
  } catch (err) {
    console.error(`Error en ${title}:`, err);
    container.innerHTML = `
      <div class="text-center space-y-2">
        <p class="text-xs text-red-400">Error de conexión</p>
        <button class="text-[10px] font-bold uppercase text-[#ff4757] border border-[#ff4757]/20 px-3 py-1 rounded-full" onclick="this.parentElement.innerHTML='<div class=\'loader w-5 h-5 border-2 border-slate-100 rounded-full\'></div>'; renderHome();">Reintentar</button>
      </div>
    `;
  }
};

const renderHome = async () => {
  mainContent.innerHTML = '';
  
  // Cargamos las secciones en paralelo pero se renderizan de forma independiente
  renderSection('Libros Tendencia', APIs.books.trending);
  renderSection('Podcasts Populares', APIs.podcasts.trending);
  renderSection('Manga & Comics', APIs.manga.trending);
};

const renderSearch = () => {
  mainContent.innerHTML = `
    <div class="space-y-6">
      <div class="relative">
        <input type="text" id="global-search" placeholder="Busca libros, podcasts o manga..." class="w-full p-5 bg-[#f1f2f6] rounded-[28px] outline-none focus:ring-4 focus:ring-[#ff4757]/10 transition-all pl-14">
        <svg class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <div id="search-results" class="grid grid-cols-2 gap-6">
        <div class="col-span-2 text-center py-20 text-slate-400">
          <p>Escribe algo para empezar a buscar...</p>
        </div>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('global-search');
  const resultsContainer = document.getElementById('search-results');

  const performSearch = debounce(async (q) => {
    if (!q) return;
    resultsContainer.innerHTML = '<div class="col-span-2 flex justify-center py-10"><div class="loader w-10 h-10 border-4 border-slate-100 rounded-full"></div></div>';
    
    try {
      const [books, podcasts, manga] = await Promise.all([
        APIs.books.search(q),
        APIs.podcasts.search(q),
        APIs.manga.search(q)
      ]);

      const allResults = [...books, ...podcasts, ...manga];
      resultsContainer.innerHTML = '';
      
      if (allResults.length === 0) {
        resultsContainer.innerHTML = '<p class="col-span-2 text-center py-10 text-slate-400">No se encontraron resultados.</p>';
        return;
      }

      allResults.forEach(item => {
        const card = createCard(item);
        card.classList.remove('w-40');
        card.classList.add('w-full');
        resultsContainer.appendChild(card);
      });
    } catch (err) {
      resultsContainer.innerHTML = `<p class="col-span-2 text-center text-red-500 py-10">Error: ${err.message}</p>`;
    }
  }, 500);

  searchInput.oninput = (e) => performSearch(e.target.value);
};

const renderLibrary = () => {
  if (library.length === 0) {
    mainContent.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div class="w-24 h-24 bg-[#f1f2f6] rounded-full flex items-center justify-center text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 18H20"/></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900">Tu biblioteca está vacía</h3>
        <p class="text-slate-400 max-w-xs">Guarda tus libros, podcasts y manga favoritos para verlos aquí.</p>
        <button onclick="switchView('home')" class="qtoon-btn px-8 py-3 bg-[#ff4757] text-white font-bold">Explorar ahora</button>
      </div>
    `;
    return;
  }

  mainContent.innerHTML = '<div class="grid grid-cols-2 gap-6" id="lib-grid"></div>';
  const grid = document.getElementById('lib-grid');
  library.forEach(item => {
    const card = createCard(item);
    card.classList.remove('w-40');
    card.classList.add('w-full');
    
    // Add remove button overlay
    const removeBtn = document.createElement('button');
    removeBtn.className = 'absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#ff4757] shadow-sm z-10';
    removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeFromLibrary(item.id);
    };
    
    card.querySelector('.relative').appendChild(removeBtn);
    grid.appendChild(card);
  });
};

const renderProfile = () => {
  mainContent.innerHTML = `
    <div class="space-y-8">
      <div class="bg-[#f1f2f6] p-8 rounded-[32px] flex flex-col items-center text-center space-y-4">
        <div class="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
          <img src="${currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUser.email}" class="w-full h-full object-cover">
        </div>
        <div>
          <h3 class="text-2xl font-bold text-slate-900">${currentUser.displayName || 'Usuario QToon'}</h3>
          <p class="text-slate-400">${currentUser.email}</p>
        </div>
      </div>
      
      <div class="space-y-4">
        <button class="qtoon-btn w-full p-5 bg-white border border-slate-100 flex items-center justify-between font-bold text-slate-700">
          Configuración de cuenta
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button class="qtoon-btn w-full p-5 bg-white border border-slate-100 flex items-center justify-between font-bold text-slate-700">
          Notificaciones
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button id="logout-btn" class="qtoon-btn w-full p-5 bg-red-50 text-[#ff4757] font-bold flex items-center justify-center gap-2 mt-4">
          Cerrar Sesión
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => signOut(auth);
};

// 7. NAVEGACIÓN
const switchView = (view) => {
  currentView = view;
  navItems.forEach(item => {
    if (item.dataset.view === view) {
      item.classList.add('active', 'text-[#ff4757]');
      item.classList.remove('text-slate-300');
    } else {
      item.classList.remove('active', 'text-[#ff4757]');
      item.classList.add('text-slate-300');
    }
  });

  switch(view) {
    case 'home':
      viewTitle.innerText = 'Inicio';
      viewSubtitle.innerText = 'Explora tendencias';
      renderHome();
      break;
    case 'search':
      viewTitle.innerText = 'Búsqueda';
      viewSubtitle.innerText = 'Encuentra tu pasión';
      renderSearch();
      break;
    case 'library':
      viewTitle.innerText = 'Biblioteca';
      viewSubtitle.innerText = 'Tus favoritos';
      renderLibrary();
      break;
    case 'profile':
      viewTitle.innerText = 'Perfil';
      viewSubtitle.innerText = 'Tu espacio personal';
      renderProfile();
      break;
  }
  window.scrollTo(0, 0);
};

navItems.forEach(item => {
  item.onclick = () => switchView(item.dataset.view);
});

// 8. AUTENTICACIÓN
const termsCheckbox = document.getElementById('terms-checkbox');
const termsModal = document.getElementById('terms-modal');
const termsOverlay = document.getElementById('terms-modal-overlay');

const showTerms = () => {
  termsOverlay.classList.remove('hidden');
  termsModal.classList.remove('hidden');
  setTimeout(() => termsOverlay.classList.add('opacity-100'), 10);
};

const closeTerms = () => {
  termsOverlay.classList.remove('opacity-100');
  setTimeout(() => {
    termsOverlay.classList.add('hidden');
    termsModal.classList.add('hidden');
  }, 300);
};

document.getElementById('show-terms-btn').onclick = (e) => {
  e.preventDefault();
  showTerms();
};
document.getElementById('close-terms-btn').onclick = closeTerms;
termsOverlay.onclick = closeTerms;

const authError = document.getElementById('auth-error');

const setAuthLoading = (isLoading) => {
  const buttons = ['email-login', 'email-register', 'google-login'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = isLoading;
      btn.style.opacity = isLoading ? '0.5' : '1';
    }
  });
  if (isLoading) {
    authError.classList.add('hidden');
  }
};

const showAuthError = (msg) => {
  authError.innerText = msg;
  authError.classList.remove('hidden');
};

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? "Logged in" : "Logged out");
  setAuthLoading(false);
  if (user) {
    currentUser = user;
    authView.classList.add('hidden');
    headerAvatarImg.src = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    switchView('home');
  } else {
    currentUser = null;
    authView.classList.remove('hidden');
  }
});

document.getElementById('google-login').onclick = async () => {
  if (!termsCheckbox.checked) return alert('Debes aceptar los términos y condiciones');
  setAuthLoading(true);
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    setAuthLoading(false);
    showAuthError('Error con Google: ' + err.message);
  }
};

document.getElementById('email-login').onclick = async () => {
  const email = document.getElementById('email-input').value;
  const pass = document.getElementById('pass-input').value;
  if (!email || !pass) return showAuthError('Completa los campos');
  if (!termsCheckbox.checked) return showAuthError('Debes aceptar los términos y condiciones');
  
  setAuthLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    setAuthLoading(false);
    showAuthError('Error: ' + err.message);
  }
};

document.getElementById('email-register').onclick = async () => {
  const email = document.getElementById('email-input').value;
  const pass = document.getElementById('pass-input').value;
  if (!email || !pass) return showAuthError('Completa los campos');
  if (pass.length < 6) return showAuthError('La contraseña debe tener al menos 6 caracteres');
  if (!termsCheckbox.checked) return showAuthError('Debes aceptar los términos y condiciones');
  
  setAuthLoading(true);
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle the rest
  } catch (err) {
    setAuthLoading(false);
    showAuthError('Error: ' + err.message);
  }
};

// Expose switchView to global for inline calls
window.switchView = switchView;

