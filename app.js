const grid = document.getElementById('grid');
const details = document.getElementById('details');
const datasetSelect = document.getElementById('datasetSelect');
const datasetDesc = document.getElementById('datasetDesc');

const titleEl = document.getElementById('title');
const introEl = document.getElementById('intro');
const placeholderEl = document.getElementById('placeholder');
const langSwitch = document.getElementById('langSwitch');

let activeBirdId = null;
let usedFallback = false;

let data = null;
let datasets = [];
let currentDataset = null;
let birds = [];

const STORAGE_LANG = 'mybirds_lang';
const STORAGE_DATASET = 'mybirds_dataset';

const text = {
  pl: {
    intro: 'Wybierz region, a następnie kliknij ptaka.',
    choose: 'Wybierz ptaka z listy.',
    fallback: 'Użyto domyślnego zestawu danych.'
  },
  en: {
    intro: 'Select a region, then click a bird.',
    choose: 'Select a bird from the list.',
    fallback: 'Using default dataset.'
  }
};

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getLang() {
  const saved = localStorage.getItem(STORAGE_LANG);
  if (saved === 'pl' || saved === 'en') {
    return saved;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'pl' ? 'pl' : 'en';
}

let lang = getLang();

function setLang(newLang) {
  lang = newLang;
  localStorage.setItem(STORAGE_LANG, newLang);

  renderLangSwitch();
  initTexts();
  initDatasetSelect();
  renderDatasetDescription();
  renderGrid();

  if (activeBirdId) {
    const activeBird = birds.find(bird => bird.id === activeBirdId);
    if (activeBird) {
      showDetails(activeBird);
    } else {
      renderRegionView();
    }
  } else {
    renderRegionView();
  }
}

function renderLangSwitch() {
  if (lang === 'pl') {
    langSwitch.innerHTML = `<span>PL</span> | <a href="#" id="toEn">EN</a>`;
  } else {
    langSwitch.innerHTML = `<a href="#" id="toPl">PL</a> | <span>EN</span>`;
  }

  const toPl = document.getElementById('toPl');
  const toEn = document.getElementById('toEn');

  if (toPl) {
    toPl.onclick = (e) => {
      e.preventDefault();
      setLang('pl');
    };
  }

  if (toEn) {
    toEn.onclick = (e) => {
      e.preventDefault();
      setLang('en');
    };
  }
}

function getDataUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('data') || 'data/birds.json';
}

function initTexts() {
  const pageTitle = document.getElementById('pageTitle');

  titleEl.textContent =
    lang === 'pl'
      ? 'MyBirds – Nauka Ptaków'
      : 'MyBirds – Bird Learning';

  if (pageTitle) {
    pageTitle.textContent =
      lang === 'pl'
        ? 'MyBirds – Nauka Ptaków'
        : 'MyBirds – Bird Learning';
  }

  introEl.textContent = text[lang].intro;
  placeholderEl.textContent = text[lang].choose;
}

function getBirdName(bird) {
  return lang === 'pl' ? bird.name_pl : bird.name_en;
}

function renderDatasetDescription() {
  const description =
    lang === 'pl'
      ? currentDataset.description_pl
      : currentDataset.description_en;

  if (usedFallback) {
    datasetDesc.innerHTML =
      `<span class="fallback-badge">${escapeHtml(text[lang].fallback)}</span> ` +
      escapeHtml(description);
    return;
  }

  datasetDesc.textContent = description;
}

function formatCoords(ds) {
  const lat =
    ds?.latitude ??
    ds?.lat ??
    ds?.coords?.lat ??
    ds?.coordinates?.lat ??
    ds?.geo?.lat;

  const lon =
    ds?.longitude ??
    ds?.lng ??
    ds?.lon ??
    ds?.coords?.lon ??
    ds?.coords?.lng ??
    ds?.coordinates?.lon ??
    ds?.coordinates?.lng ??
    ds?.geo?.lon ??
    ds?.geo?.lng;

  if (lat == null || lon == null) {
    return '';
  }

  return `${lat}, ${lon}`;
}

function formatCoords(lat, lon) {
  if (lat == null || lon == null) return '';

  const latAbs = Math.abs(lat).toFixed(2);
  const lonAbs = Math.abs(lon).toFixed(2);

  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${latAbs}°${latDir}, ${lonAbs}°${lonDir}`;
}

function renderRegionView() {
  const mapImage = currentDataset?.map?.image || '';
  const mapLicense = data?.map_base?.license || '';

  const countryLabel = lang === 'pl' ? 'Polska' : 'Poland';

  const lat = currentDataset?.map?.lat;
  const lon = currentDataset?.map?.lon;

  const coords = formatCoords(lat, lon);

  if (!mapImage) {
    details.innerHTML = `<p>${text[lang].choose}</p>`;
    return;
  }

  details.innerHTML = `
  <div class="details-card">
    <h2>
      ${escapeHtml(countryLabel)}${coords ? ', ' + escapeHtml(coords) : ''}
    </h2>
    <img src="${mapImage}" alt="">
    <div class="map-credit">${escapeHtml(mapLicense)}</div>
  </div>
`;
}

function resolveMedia(path) {
  return `data/${path}`;
}

function showDetails(bird) {
  const sourceLabel = lang === 'pl' ? 'Źródło:' : 'Source:';

  details.innerHTML = `
    <div class="details-card">
      <h2>${escapeHtml(getBirdName(bird))}</h2>
      <audio controls src="${resolveMedia(bird.audio_path)}"></audio>
      <img src="${resolveMedia(bird.image_path)}" alt="">
      <div class="credits">
        <span class="credits-label">${sourceLabel}</span>
        <a href="${bird.image_page}" target="_blank" rel="noopener noreferrer">image</a> ·
        <a href="${bird.audio_page}" target="_blank" rel="noopener noreferrer">audio</a>
      </div>
    </div>
  `;
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

function initDatasetSelect() {
  datasetSelect.innerHTML = '';

  datasets.forEach(ds => {
    const opt = document.createElement('option');
    opt.value = ds.id;
    opt.textContent = lang === 'pl' ? ds.name_pl : ds.name_en;
    datasetSelect.appendChild(opt);
  });

  datasetSelect.value = currentDataset.id;

  datasetSelect.onchange = () => {
    localStorage.setItem(STORAGE_DATASET, datasetSelect.value);
    loadDataset(datasetSelect.value);
  };
}

function loadDataset(id) {
  currentDataset = datasets.find(d => d.id === id);
  birds = currentDataset?.birds || [];
  activeBirdId = null;

  renderDatasetDescription();
  renderGrid();
  renderRegionView();
}

function loadJson(url) {
  return fetch(url).then(r => {
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    return r.json();
  });
}

function init() {
  renderLangSwitch();
  initTexts();

  const remoteUrl = getDataUrl();
  const localUrl = 'data/birds.json';

  loadJson(remoteUrl)
    .catch(err => {
      console.warn('Remote JSON failed, fallback to local:', err);
      usedFallback = true;
      return loadJson(localUrl);
    })
    .then(json => {
      data = json;
      datasets = data.datasets || [];

      const savedDatasetId = localStorage.getItem(STORAGE_DATASET);
      const defaultId = data.default_dataset_id;

      currentDataset =
        datasets.find(d => d.id === savedDatasetId) ||
        datasets.find(d => d.id === defaultId) ||
        datasets[0];

      initDatasetSelect();
      loadDataset(currentDataset.id);
    })
    .catch(err => {
      console.error('Both remote and local JSON failed:', err);
      grid.innerHTML = `<p>${text[lang].choose}</p>`;
      details.innerHTML = '<p>Cannot load data.</p>';
    });
}

init();