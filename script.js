// ================= ELEMENT SELECT =================
const container = document.getElementById("templateContainer");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const modal = document.getElementById("previewModal");
const modalSlides = document.getElementById("modalSlides");
const closeModal = document.querySelector(".closeModal");

let modalSwiperInstance = null;


// ================= LOADER =================
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 123);
  }
});


// ================= RENDER TEMPLATE =================
function isVideoFile(src) {
  return typeof src === 'string' && src.toLowerCase().endsWith('.mp4');
}

function updateAspect(el) {
  const swiper = el.closest('.templateSwiper');
  if (!swiper || swiper.dataset.aspectSet === 'true') return;

  const width = el.naturalWidth || el.videoWidth;
  const height = el.naturalHeight || el.videoHeight;
  if (!width || !height) return;

  swiper.style.aspectRatio = `${width}/${height}`;
  swiper.dataset.aspectSet = 'true';
}

function parseAspectRatio(ratio) {
  if (!ratio || typeof ratio !== 'string') return null;
  const parts = ratio.split('/').map(Number);
  return parts.length === 2 && parts[0] && parts[1] ? parts[0] / parts[1] : null;
}

function getInitialAspectStyle(template) {
  return template.aspectRatio ? `style="aspect-ratio:${template.aspectRatio};"` : 'style="aspect-ratio:4/3;"';
}

function getTemplateOrientation(template) {
  if (template.aspectRatio) {
    const ratio = parseAspectRatio(template.aspectRatio);
    return ratio && ratio >= 1 ? 'landscape' : 'portrait';
  }

  const firstImage = Array.isArray(template.images) && template.images[0];
  if (!firstImage) return Promise.resolve('portrait');
  if (isVideoFile(firstImage)) return Promise.resolve('landscape');

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait');
    };
    img.onerror = () => resolve('portrait');
    img.src = firstImage;
  });
}

async function prepareTemplateOrientations(templates) {
  for (const template of templates) {
    template.orientation = await getTemplateOrientation(template);
  }
}

function orderTemplates(items) {
  const landscape = items.filter(item => item.orientation === 'landscape');
  const portrait = items.filter(item => item.orientation !== 'landscape');
  const ordered = [];

  while (landscape.length || portrait.length) {
    for (let i = 0; i < 2 && landscape.length; i += 1) {
      ordered.push(landscape.shift());
    }

    if (portrait.length) {
      ordered.push(portrait.shift());
    }

    if (!landscape.length) {
      ordered.push(...portrait.splice(0, portrait.length));
      break;
    }
  }

  if (landscape.length) {
    ordered.push(...landscape);
  }

  return ordered;
}

function renderTemplates(data) {
  container.innerHTML = "";

  // 🔥 anti kosong
  if (!data || data.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; grid-column:1/-1;">
        ❌ Template tidak ditemukan
      </p>
    `;
    return;
  }

  const ordered = orderTemplates(data);

  ordered.forEach((template) => {
    const aspectStyle = getInitialAspectStyle(template);
    const orientationClass = template.orientation === 'landscape' ? 'landscape' : 'portrait';

    let slidesHTML = template.images.map(img => `
      <div class="swiper-slide">
        ${isVideoFile(img)
          ? `<video src="${img}" muted autoplay loop playsinline preload="metadata" onloadedmetadata="updateAspect(this)" onclick="openModal(${template.originalIndex})"></video>`
          : `<img src="${img}" onload="updateAspect(this)" onclick="openModal(${template.originalIndex})">`}
        <div class="slide-watermark">© Fauzi Template</div>
      </div>
    `).join("");

    container.innerHTML += `
      <div class="card ${orientationClass}" data-category="${template.category}" data-orientation="${orientationClass}">
        <div class="swiper templateSwiper" ${aspectStyle}>
          <div class="swiper-wrapper">
            ${slidesHTML}
          </div>
          <div class="swiper-pagination"></div>
        </div>

        <h3>${template.title}</h3>
        <p>⭐⭐⭐⭐⭐ 4.9</p>
        <p>${template.category}</p>

        <div class="card-buttons">
          <button class="favorite-button" data-index="${template.originalIndex}" type="button">❤️ Favorite</button>
          <a href="${template.link}" target="_blank">
            <button type="button">Use Template</button>
          </a>
        </div>
      </div>
    `;
  });

  initSwiper();
  animateCards();
}


// ================= INIT SWIPER =================
function initSwiper() {
  document.querySelectorAll('.templateSwiper').forEach(swiperEl => {
    new Swiper(swiperEl, {
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      pagination: {
        el: swiperEl.querySelector('.swiper-pagination'),
        clickable: true,
      }
    });
  });
}

function animateCards() {
  document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(40px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
  });
}


// ================= MODAL =================
function openModal(index) {
  modal.style.display = "block";
  modalSlides.innerHTML = "";

  const slides = templates[index].images.map(img => `
    <div class="swiper-slide">
      ${isVideoFile(img)
        ? `<video src="${img}" controls playsinline preload="metadata"></video>`
        : `<img src="${img}">`}
    </div>
  `).join("");

  modalSlides.innerHTML = slides;

  if (modalSwiperInstance) {
    modalSwiperInstance.destroy(true, true);
  }

  modalSwiperInstance = new Swiper(".modalSwiper", {
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".modalSwiper .swiper-pagination",
      clickable: true,
    }
  });
}

closeModal.onclick = () => {
  modal.style.display = "none";
};

const favoritesButton = document.getElementById("favoritesButton");
const favoritesModal = document.getElementById("favoritesModal");
const favoritesContent = document.getElementById("favoritesContent");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const closeFavorites = document.querySelector(".closeFavorites");
let favoritesOnly = false;

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(list) {
  localStorage.setItem("favorites", JSON.stringify(list));
}

function updateFavoriteCount() {
  const count = getFavorites().length;
  const badge = document.getElementById("favoriteCount");
  if (badge) badge.innerText = count;
}

function renderFavorites() {
  const favorites = getFavorites();

  favoritesEmpty.style.display = favorites.length === 0 ? "block" : "none";
  favoritesContent.innerHTML = favorites
    .map((template, index) => `
      <div class="favorite-card">
        <h3>${template.title}</h3>
        <p>${template.category}</p>
        <div class="favorite-actions">
          <a href="${template.link}" target="_blank" class="favorite-link">Use Template</a>
          <button class="favorite-remove" data-index="${index}">Remove</button>
        </div>
      </div>
    `)
    .join("");

  favoritesContent.querySelectorAll(".favorite-remove").forEach(button => {
    button.addEventListener("click", () => removeFavorite(Number(button.dataset.index)));
  });
  renderFavoritesPreview();
}

function renderFavoritesPreview() {
  return;
}

function updateFavoriteButton() {
  if (!favoritesButton) return;
  favoritesButton.innerHTML = favoritesOnly
    ? `Show All <span id="favoriteCount">${getFavorites().length}</span>`
    : `Favorites <span id="favoriteCount">${getFavorites().length}</span>`;
  favoritesButton.classList.toggle("active", favoritesOnly);
}

function openFavoritesModal() {
  renderFavorites();
  favoritesModal.style.display = "block";
}

function removeFavorite(index) {
  const favorites = getFavorites();
  favorites.splice(index, 1);
  saveFavorites(favorites);
  updateFavoriteCount();
  renderFavorites();
}

closeFavorites.onclick = () => {
  favoritesModal.style.display = "none";
};

favoritesButton.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  updateFavoriteButton();
  updateDisplay();
});

container.addEventListener("click", event => {
  const button = event.target.closest(".favorite-button");
  if (!button) return;

  const index = Number(button.dataset.index);
  if (!Number.isNaN(index)) {
    toggleFavorite(index);
  }
});

const allTemplates = templates.map((t, index) => ({ ...t, originalIndex: index }));

async function initializeTemplates() {
  await prepareTemplateOrientations(allTemplates);
  renderTemplates(allTemplates);
  updateFavoriteCount();
  updateFavoriteButton();
}

// ================= SEARCH + FILTER (FIX TOTAL) =================
function normalizeCategory(value) {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function updateDisplay() {
  const searchValue = search.value.toLowerCase().trim();
  const filterValue = filter.value.toLowerCase();

  const favoriteTitles = new Set(getFavorites().map(f => f.title));
  const filtered = allTemplates.filter(t => {
    const titleMatch = t.title.toLowerCase().includes(searchValue);
    const categoryMatch = t.category.toLowerCase().includes(searchValue);
    const matchSearch = searchValue === "" || titleMatch || categoryMatch;

    const matchCategory =
      filterValue === "all" || normalizeCategory(t.category) === normalizeCategory(filterValue);

    const matchFavorites = !favoritesOnly || favoriteTitles.has(t.title);

    return matchSearch && matchCategory && matchFavorites;
  });

  renderTemplates(filtered);
}
search.addEventListener("input", updateDisplay);
filter.addEventListener("change", updateDisplay);


// ================= FAVORITE =================
function toggleFavorite(index) {
  const templateToAdd = allTemplates[index];
  if (!templateToAdd) return;

  const favorites = getFavorites();
  const existsIndex = favorites.findIndex(f => f.title === templateToAdd.title);

  if (existsIndex === -1) {
    favorites.push(templateToAdd);
    saveFavorites(favorites);
    updateFavoriteCount();
    if (favoritesOnly) updateDisplay();
    alert("Added to Favorite 🔥");
  } else {
    favorites.splice(existsIndex, 1);
    saveFavorites(favorites);
    updateFavoriteCount();
    if (favoritesOnly) updateDisplay();
    alert("Removed from Favorite ❌");
  }
}

updateFavoriteCount();
updateFavoriteButton();

// ================= COUNTER =================
document.querySelectorAll(".counter").forEach(counter => {

  const updateCounter = () => {
    const target = +counter.getAttribute("data-target");
    const current = +counter.innerText;
    const increment = target / 100;

    if (current < target) {
      counter.innerText = Math.ceil(current + increment);
      setTimeout(updateCounter, 20);
    } else {
      counter.innerText = target;
    }
  };

  updateCounter();
});


const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
});

initializeTemplates();
