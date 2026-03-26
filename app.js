const grid = document.getElementById('grid');
const details = document.getElementById('details');
const datasetSelect = document.getElementById('datasetSelect');
const datasetDesc = document.getElementById('datasetDesc');

const titleEl = document.getElementById('title');
const introEl = document.getElementById('intro');
const placeholderEl = document.getElementById('placeholder');
const langSwitch = document.getElementById('langSwitch');

let activeBirdId = null;

function renderRegionView() {
  const mapImage = currentDataset?.map?.image || '';
  const mapLicense = data?.map_base?.license || '';

  if (!mapImage) {
    details.innerHTML = `<p>${text[lang].choose}</p>`;
    return;
  }

  details.innerHTML = `
    <div class="details-card">
      <img src="${mapImage}" alt="">
      <div class="map-credit">${escapeHtml(mapLicense)}</div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getLang() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'pl' ? 'pl' : 'en';
}

let lang = getLang();

function setLang(newLang) {
  const params = new URLSearchParams(window.location.search);
  params.set('lang', newLang);
  window.location.search = params.toString();
}

function renderLangSwitch() {
  if (lang === 'pl') {
    langSwitch.innerHTML = `<span>PL</span> | <a href="#" id="toEn">EN</a>`;
  } else {
    langSwitch.innerHTML = `<a href="#" id="toPl">PL</a> | <span>EN</span>`;
  }

  const toPl = document.getElementById('toPl');
  const toEn = document.getElementById('toEn');

  if (toPl) toPl.onclick = () => setLang('pl');
  if (toEn) toEn.onclick = () => setLang('en');
}

function getDataUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('data') || 'data/birds.json';
}

let data = null;
let datasets = [];
let currentDataset = null;
let birds = [];

const text = {
  pl: {
    intro: 'Kilka ptaków pod ręką do nauki. Wybierz region, a następnie kliknij kafelek.',
    choose: 'Wybierz ptaka z listy.'
  },
  en: {
    intro: 'A few birds for quick learning. Select a region, then click a bird.',
    choose: 'Select a bird from the list.'
  }
};

function initTexts() {
  titleEl.textContent = 'MyBirds';
  introEl.textContent = text[lang].intro;
  placeholderEl.textContent = text[lang].choose;
}

function initDatasetSelect() {
  datasetSelect.innerHTML = '';

  datasets.forEach(ds => {
    const opt = document.createElement('option');
    opt.value = ds.id;
    opt.textContent = lang === 'pl' ? ds.name_pl : ds.name_en;
    datasetSelect.appendChild(opt);
  });

  datasetSelect.value = currentDataset.id;

  datasetSelect.addEventListener('change', () => {
    loadDataset(datasetSelect.value);
  });
}

function loadDataset(id) {
  currentDataset = datasets.find(d => d.id === id);
  birds = currentDataset.birds || [];
  activeBirdId = null;

  renderDatasetDescription();
  renderGrid();
  renderRegionView();
}

function renderDatasetDescription() {
  datasetDesc.textContent =
    lang === 'pl'
      ? currentDataset.description_pl
      : currentDataset.description_en;
}

function renderGrid() {
  grid.innerHTML = '';

  birds.forEach(bird => {
    const btn = document.createElement('button');
    btn.className = 'tile';
    btn.textContent = getBirdName(bird);

    if (bird.id === activeBirdId) {
      btn.classList.add('active');
    }

    btn.onclick = () => {
      if (activeBirdId === bird.id) {
        activeBirdId = null;
        renderGrid();
        renderRegionView();
        return;
      }

      activeBirdId = bird.id;
      renderGrid();
      showDetails(bird);
    };

    grid.appendChild(btn);
  });
}

function getBirdName(bird) {
  return lang === 'pl' ? bird.name_pl : bird.name_en;
}

function showDetails(bird) {
  details.innerHTML = `
    <div class="details-card">
      <h2>${escapeHtml(getBirdName(bird))}</h2>
      <audio controls src="${bird.audio_url}"></audio>
      <img src="${bird.image_url}" alt="">
      <div class="credits">
        <a href="${bird.image_page}" target="_blank" rel="noopener noreferrer">image</a> ·
        <a href="${bird.audio_page}" target="_blank" rel="noopener noreferrer">audio</a>
      </div>
    </div>
  `;
}

function init() {
  renderLangSwitch();
  initTexts();

  fetch(getDataUrl())
    .then(r => r.json())
    .then(json => {
      data = json;
      datasets = data.datasets || [];

      const defaultId = data.default_dataset_id;
      currentDataset =
        datasets.find(d => d.id === defaultId) || datasets[0];

      initDatasetSelect();
      loadDataset(currentDataset.id);
    })
    .catch(err => {
      console.error(err);
      grid.innerHTML = '<p>Cannot load data.</p>';
    });
}

init();