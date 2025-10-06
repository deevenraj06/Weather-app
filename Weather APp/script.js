// Replace with your OpenWeatherMap API key:
const apiKey = 'bcaeb745ab8592976b6afb66167778b2';

const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const locBtn = document.getElementById('loc-btn');

const card = document.getElementById('card');
const locationEl = document.getElementById('location');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const iconEl = document.getElementById('icon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const updatedEl = document.getElementById('updated');

const errorEl = document.getElementById('error');
const loadingEl = document.getElementById('loading');
const unitToggle = document.getElementById('unit-toggle');

let lastData = null; // store the latest fetch result
let showCelsius = true;

function showLoading(){ loadingEl.classList.remove('hidden'); }
function hideLoading(){ loadingEl.classList.add('hidden'); }
function showError(msg){ errorEl.textContent = msg; errorEl.classList.remove('hidden'); }
function clearError(){ errorEl.classList.add('hidden'); errorEl.textContent = ''; }

function showCard(){ card.classList.remove('hidden'); }
function hideCard(){ card.classList.add('hidden'); }

async function fetchWeatherByCity(city){
  clearError(); showLoading();
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid API key. Put your OpenWeatherMap key in script.js.');
      if (res.status === 404) throw new Error('City not found. Check spelling.');
      throw new Error('Failed to fetch weather data.');
    }
    const data = await res.json();
    lastData = data;
    renderWeather(data);
    // cache last result for quick reload
    localStorage.setItem('weather_last', JSON.stringify({ data, ts: Date.now() }));
  } catch (err) {
    showError(err.message);
    hideCard();
  } finally {
    hideLoading();
  }
}

async function fetchWeatherByCoords(lat, lon){
  clearError(); showLoading();
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch location weather.');
    const data = await res.json();
    lastData = data;
    renderWeather(data);
    localStorage.setItem('weather_last', JSON.stringify({ data, ts: Date.now() }));
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

function renderWeather(data){
  showCard();
  const name = data.name;
  const country = data.sys?.country || '';
  locationEl.textContent = `${name}, ${country}`;

  const w = data.weather?.[0];
  const desc = w?.description ?? '';
  descEl.textContent = desc[0]?.toUpperCase() + desc.slice(1);

  const icon = w?.icon;
  iconEl.src = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';
  iconEl.alt = w?.description || 'weather icon';

  // temperatures (we store metric base in API)
  const tempC = Math.round(data.main?.temp);
  tempEl.textContent = showCelsius ? `${tempC}°C` : `${cToF(tempC)}°F`;

  humidityEl.textContent = `${data.main?.humidity ?? '-'}%`;
  windEl.textContent = `${data.wind?.speed ?? '-'} m/s`;

  updatedEl.textContent = `Updated: ${new Date((data.dt || Date.now()) * 1000).toLocaleString()}`;
  unitToggle.textContent = showCelsius ? '°C' : '°F';
}

function cToF(c){ return Math.round((c * 9) / 5 + 32); }
function fToC(f){ return Math.round((f - 32) * 5 / 9); }

/* EVENTS */
form.addEventListener('submit', e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) { showError('Please type a city name'); return; }
  fetchWeatherByCity(q);
});

locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showError('Geolocation not supported by your browser'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  }, err => {
    showError('Unable to retrieve location. Allow location permission and try again.');
  });
});

// Unit toggle
unitToggle.addEventListener('click', () => {
  showCelsius = !showCelsius;
  if (!lastData) return;
  // We always have API metric value in lastData.main.temp
  const baseC = Math.round(lastData.main.temp);
  tempEl.textContent = showCelsius ? `${baseC}°C` : `${cToF(baseC)}°F`;
  unitToggle.textContent = showCelsius ? '°C' : '°F';
});

// Load cached result on start (optional)
window.addEventListener('load', () => {
  try {
    const cached = JSON.parse(localStorage.getItem('weather_last') || 'null');
    if (cached?.data) {
      lastData = cached.data;
      renderWeather(cached.data);
    }
  } catch (e) { /* ignore */ }
});