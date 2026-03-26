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

function showDetails(bird) {
  const sourceLabel = lang === 'pl' ? 'Źródło:' : 'Source:';

  details.innerHTML = `
    <div class="details-card">
      <h2>${escapeHtml(getBirdName(bird))}</h2>
      <audio controls src="${bird.audio_url}"></audio>
      <img src="${bird.image_url}" alt="">
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

      const defaultId = data.default_dataset_id;
      currentDataset =
        datasets.find(d => d.id === defaultId) || datasets[0];

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