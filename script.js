// ========================================
// ADVANCED WEATHER APP - MODERN JAVASCRIPT
// ES6+, Async/Await, LocalStorage, Geolocation
// ========================================

// API Configuration
const CONFIG = {
    API_KEY: 'c3aa817f1c8bf18d742cb979f3bbbff6',
    API_BASE_URL: 'https://api.openweathermap.org/data/2.5',
    ICON_BASE_URL: 'https://openweathermap.org/img/wn',
    STORAGE_KEY: 'weatherAppData',
    PARTICLE_COUNT: 50
};

// State Management
const state = {
    currentUnit: 'celsius',
    weatherData: null,
    lastSearch: null
};

// DOM Elements - Cached for performance
const DOM = {
    // Form elements
    searchForm: document.getElementById('searchForm'),
    locationInput: document.getElementById('locationInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    clearBtn: document.getElementById('clearBtn'),
    
    // Display elements
    errorMessage: document.getElementById('errorMessage'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    weatherDisplay: document.getElementById('weatherDisplay'),
    
    // Weather data elements
    cityName: document.getElementById('cityName'),
    country: document.getElementById('country'),
    dateTime: document.getElementById('dateTime'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    uvIndex: document.getElementById('uvIndex'),
    
    // Unit toggle
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    
    // Particles
    particles: document.getElementById('particles')
};

// ========================================
// INITIALIZATION
// ========================================
function init() {
    setupEventListeners();
    createParticles();
    loadFromStorage();
    DOM.locationInput.focus();
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Form submission
    DOM.searchForm.addEventListener('submit', handleSearch);
    
    // Input events
    DOM.locationInput.addEventListener('input', handleInputChange);
    DOM.clearBtn.addEventListener('click', clearInput);
    
    // Location button
    DOM.locationBtn.addEventListener('click', getUserLocation);
    
    // Unit toggle
    DOM.celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
    DOM.fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
async function handleSearch(e) {
    e.preventDefault();
    const location = DOM.locationInput.value.trim();
    
    if (!location) {
        showError('Please enter a city name');
        DOM.locationInput.focus();
        return;
    }
    
    if (location.length < 2) {
        showError('Please enter at least 2 characters');
        return;
    }
    
    hideError();
    await fetchWeatherData(location);
}

async function fetchWeatherData(location) {
    try {
        showLoading();
        
        // Validate API key
        if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
            throw new Error('API key not configured. Please add your OpenWeatherMap API key.');
        }
        
        // Fetch weather data
        const url = `${CONFIG.API_BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${CONFIG.API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            handleAPIError(response.status);
            return;
        }
        
        const data = await response.json();
        state.weatherData = data;
        state.lastSearch = location;
        
        displayWeatherData(data);
        saveToStorage();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error fetching weather data:', error);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        
        const url = `${CONFIG.API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data for your location');
        }
        
        const data = await response.json();
        state.weatherData = data;
        state.lastSearch = `${data.name}, ${data.sys.country}`;
        DOM.locationInput.value = state.lastSearch;
        
        displayWeatherData(data);
        saveToStorage();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error fetching weather by coordinates:', error);
    }
}

// ========================================
// DISPLAY FUNCTIONS
// ========================================
function displayWeatherData(data) {
    // Location info
    DOM.cityName.textContent = data.name;
    DOM.country.textContent = data.sys.country;
    DOM.dateTime.textContent = formatDateTime(new Date());
    
    // Weather icon
    const iconCode = data.weather[0].icon;
    DOM.weatherIcon.src = `${CONFIG.ICON_BASE_URL}/${iconCode}@4x.png`;
    DOM.weatherIcon.alt = data.weather[0].description;
    
    // Temperature
    updateTemperatureDisplay();
    
    // Weather description
    DOM.weatherDescription.textContent = data.weather[0].description;
    
    // Weather details
    DOM.humidity.textContent = `${data.main.humidity}%`;
    
    // Wind speed with direction
    const windSpeedValue = data.wind.speed.toFixed(1);
    const windDirection = getWindDirection(data.wind.deg);
    DOM.windSpeed.textContent = `${windSpeedValue} m/s ${windDirection}`;
    
    DOM.pressure.textContent = `${data.main.pressure} hPa`;
    
    // Visibility
    if (data.visibility) {
        const visibilityKm = (data.visibility / 1000).toFixed(1);
        DOM.visibility.textContent = `${visibilityKm} km`;
    } else {
        DOM.visibility.textContent = 'N/A';
    }
    
    // UV Index (not available in free tier)
    DOM.uvIndex.textContent = 'N/A';
    
    // Show weather display
    DOM.weatherDisplay.classList.add('show');
}

function updateTemperatureDisplay() {
    if (!state.weatherData) return;
    
    const tempCelsius = state.weatherData.main.temp;
    const feelsLikeCelsius = state.weatherData.main.feels_like;
    
    let displayTemp, displayFeelsLike, unit;
    
    if (state.currentUnit === 'celsius') {
        displayTemp = Math.round(tempCelsius);
        displayFeelsLike = Math.round(feelsLikeCelsius);
        unit = '°C';
    } else {
        displayTemp = Math.round(celsiusToFahrenheit(tempCelsius));
        displayFeelsLike = Math.round(celsiusToFahrenheit(feelsLikeCelsius));
        unit = '°F';
    }
    
    DOM.temperature.textContent = `${displayTemp}${unit}`;
    DOM.feelsLike.textContent = `${displayFeelsLike}${unit}`;
}

function switchUnit(unit) {
    if (state.currentUnit === unit) return;
    
    state.currentUnit = unit;
    
    // Update button states
    if (unit === 'celsius') {
        DOM.celsiusBtn.classList.add('active');
        DOM.celsiusBtn.setAttribute('aria-pressed', 'true');
        DOM.fahrenheitBtn.classList.remove('active');
        DOM.fahrenheitBtn.setAttribute('aria-pressed', 'false');
    } else {
        DOM.fahrenheitBtn.classList.add('active');
        DOM.fahrenheitBtn.setAttribute('aria-pressed', 'true');
        DOM.celsiusBtn.classList.remove('active');
        DOM.celsiusBtn.setAttribute('aria-pressed', 'false');
    }
    
    // Update temperature display
    if (DOM.weatherDisplay.classList.contains('show') && state.weatherData) {
        updateTemperatureDisplay();
    }
    
    saveToStorage();
}

// ========================================
// GEOLOCATION
// ========================================
function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            hideLoading();
            let errorMessage = 'Unable to retrieve your location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }
            
            showError(errorMessage);
        }
    );
}

// ========================================
// INPUT HANDLING
// ========================================
function handleInputChange(e) {
    const value = e.target.value;
    
    if (value.length > 0) {
        DOM.clearBtn.classList.add('show');
    } else {
        DOM.clearBtn.classList.remove('show');
    }
    
    if (DOM.errorMessage.classList.contains('show')) {
        hideError();
    }
}

function clearInput() {
    DOM.locationInput.value = '';
    DOM.clearBtn.classList.remove('show');
    DOM.locationInput.focus();
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        DOM.locationInput.focus();
        DOM.locationInput.select();
    }
    
    // Escape to clear input
    if (e.key === 'Escape' && document.activeElement === DOM.locationInput) {
        clearInput();
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function formatDateTime(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function getWindDirection(degrees) {
    if (degrees === undefined || degrees === null) return '';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return directions[index];
}

// ========================================
// ERROR HANDLING
// ========================================
function handleAPIError(status) {
    let errorMessage;
    
    switch(status) {
        case 404:
            errorMessage = 'City not found. Please check the spelling and try again.';
            break;
        case 401:
            errorMessage = 'Invalid API key. Please check your OpenWeatherMap API key.';
            break;
        case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
        default:
            errorMessage = 'Failed to fetch weather data. Please try again later.';
    }
    
    showError(errorMessage);
}

function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    DOM.errorMessage.classList.remove('show');
}

// ========================================
// LOADING STATE
// ========================================
function showLoading() {
    DOM.loadingSpinner.classList.add('show');
    DOM.weatherDisplay.classList.remove('show');
    DOM.searchBtn.disabled = true;
    DOM.locationBtn.disabled = true;
    DOM.locationInput.disabled = true;
}

function hideLoading() {
    DOM.loadingSpinner.classList.remove('show');
    DOM.searchBtn.disabled = false;
    DOM.locationBtn.disabled = false;
    DOM.locationInput.disabled = false;
}

// ========================================
// LOCAL STORAGE
// ========================================
function saveToStorage() {
    try {
        const dataToSave = {
            weatherData: state.weatherData,
            lastSearch: state.lastSearch,
            currentUnit: state.currentUnit,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromStorage() {
    try {
        const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        
        // Check if data is less than 1 hour old
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - data.timestamp > oneHour) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return;
        }
        
        // Restore state
        state.weatherData = data.weatherData;
        state.lastSearch = data.lastSearch;
        state.currentUnit = data.currentUnit;
        
        // Update UI
        if (state.lastSearch) {
            DOM.locationInput.value = state.lastSearch;
        }
        
        if (state.currentUnit === 'fahrenheit') {
            switchUnit('fahrenheit');
        }
        
        if (state.weatherData) {
            displayWeatherData(state.weatherData);
        }
        
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
}

// ========================================
// PARTICLE ANIMATION
// ========================================
function createParticles() {
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        
        DOM.particles.appendChild(particle);
    }
}

// ========================================
// START APPLICATION
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
