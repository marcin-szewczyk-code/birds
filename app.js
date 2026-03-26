const grid = document.getElementById('grid');
const details = document.getElementById('details');

const lang = window.APP_LANG === 'en' ? 'en' : 'pl';

const i18n = {
  pl: {
    loadError: 'Nie udało się wczytać data.json',
    browserNoAudio: 'Twoja przeglądarka nie obsługuje audio.',
    source: 'Źródło',
    imageSource: 'źródło zdjęcia',
    audioSource: 'źródło dźwięku',
    defaultCredit: 'Wikimedia Commons'
  },
  en: {
    loadError: 'Could not load data.json',
    browserNoAudio: 'Your browser does not support audio.',
    source: 'Source',
    imageSource: 'image source',
    audioSource: 'audio source',
    defaultCredit: 'Wikimedia Commons'
  }
};

let birds = [];
let activeId = '';

fetch('./data.json')
  .then((res) => {
    if (!res.ok) throw new Error(i18n[lang].loadError);
    return res.json();
  })
  .then((data) => {
    birds = Array.isArray(data) ? data : [];
    renderGrid();
  })
  .catch((err) => {
    details.classList.remove('empty');
    details.innerHTML = `<div class="placeholder">Błąd: ${escapeHtml(err.message)}</div>`;
  });

function getBirdName(bird) {
  if (lang === 'en') {
    return bird.name_en || bird.name;
  }
  return bird.name || bird.name_en || '';
}

function renderGrid() {
  grid.innerHTML = '';

  birds.forEach((bird) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.textContent = getBirdName(bird);
    button.dataset.id = bird.id;
    button.addEventListener('click', () => showBird(bird.id));
    grid.appendChild(button);
  });
}

function showBird(id) {
  activeId = id;
  const bird = birds.find((item) => item.id === id);
  if (!bird) return;

  [...grid.querySelectorAll('.tile')].forEach((tile) => {
    tile.classList.toggle('active', tile.dataset.id === bird.id);
  });

  const birdName = getBirdName(bird);

  details.classList.remove('empty');
  details.innerHTML = `
    <div class="details-card">
      <h2>${escapeHtml(birdName)}</h2>

      <audio class="audio-player" controls preload="none">
        <source src="${escapeAttr(bird.audio_url)}">
        ${escapeHtml(i18n[lang].browserNoAudio)}
      </audio>

      <div class="photo-box">
        <img src="${escapeAttr(bird.image_url)}" alt="${escapeAttr(birdName)}" loading="lazy">
      </div>

      <div class="meta">
        ${escapeHtml(i18n[lang].source)}: ${escapeHtml(bird.credit || i18n[lang].defaultCredit)}<br>
        <a href="${escapeAttr(bird.image_page)}" target="_blank" rel="noopener">${escapeHtml(i18n[lang].imageSource)}</a>
        ·
        <a href="${escapeAttr(bird.audio_page)}" target="_blank" rel="noopener">${escapeHtml(i18n[lang].audioSource)}</a>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
