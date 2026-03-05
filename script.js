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
    }, 500);
  }
});


// ================= RENDER TEMPLATE =================
function renderTemplates(data) {
  container.innerHTML = "";

  data.forEach((template, index) => {

      let slidesHTML = template.images.map(img => `
        <div class="swiper-slide">
          <img src="${img}" onclick="openModal(${index})">
          <div class="slide-watermark">© Fauzi Template</div>
        </div>
      `).join("");

    container.innerHTML += `
      <div class="card" data-category="${template.category}">
        <div class="swiper templateSwiper">
          <div class="swiper-wrapper">
            ${slidesHTML}
          </div>
          <div class="swiper-pagination"></div>
        </div>

<h3>${template.title}</h3>

<p>⭐⭐⭐⭐⭐ 4.9</p>

<p>${template.category}</p>

        <div class="card-buttons">
          <button onclick="addFavorite(${index})">❤️ Favorite</button>
          <a href="${template.link}" target="_blank">
            <button>Use Template</button>
          </a>
        </div>
      </div>
    `;
  });

  initSwiper();
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


// ================= MODAL =================
function openModal(index) {
  modal.style.display = "block";
  modalSlides.innerHTML = "";

  const slides = templates[index].images.map(img => `
    <div class="swiper-slide">
      <img src="${img}">
    </div>
  `).join("");

  modalSlides.innerHTML = slides;

  // Destroy previous instance (important!)
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


// ================= SEARCH =================
search.addEventListener("input", () => {
  const value = search.value.toLowerCase();
  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(value)
  );
  renderTemplates(filtered);
});


// ================= FILTER =================
filter.addEventListener("change", () => {
  const value = filter.value;

  if (value === "all") {
    renderTemplates(templates);
  } else {
    const filtered = templates.filter(t =>
      t.category === value
    );
    renderTemplates(filtered);
  }
});


// ================= FAVORITE =================
function addFavorite(index) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  const exists = favorites.find(f => f.title === templates[index].title);

  if (!exists) {
    favorites.push(templates[index]);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert("Added to Favorite 🔥");
  } else {
    alert("Already in Favorite 😎");
  }
}


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


// ================= INITIAL RENDER =================
renderTemplates(templates);

// ================= SCROLL REVEAL =================

const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){

entry.target.style.opacity = "1";
entry.target.style.transform = "translateY(0)";

}

});

});

document.addEventListener("DOMContentLoaded",()=>{

document.querySelectorAll(".card").forEach(card=>{

card.style.opacity="0";
card.style.transform="translateY(40px)";
card.style.transition="all 0.6s ease";

observer.observe(card);

});

});