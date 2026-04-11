import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const RETRY_DELAY_MS = 1000;
const API_TIMEOUT_MS = 20000;

export const DEFAULT_SELECTION = {
  year: 2023,
  race: 'Italian Grand Prix',
  session: 'Race',
};

const FALLBACK_EVENTS = {
  2023: [
    {
      round: 14,
      name: 'Italian Grand Prix',
      official_name: "FORMULA 1 PIRELLI GRAN PREMIO D'ITALIA 2023",
      country: 'Italy',
      location: 'Monza',
      event_date: '2023-09-03T00:00:00',
      format: 'conventional',
      sessions: [
        { name: 'Practice 1', date: null },
        { name: 'Practice 2', date: null },
        { name: 'Practice 3', date: null },
        { name: 'Qualifying', date: null },
        { name: 'Race', date: null },
      ],
    },
  ],
};

// Fallback Mock Data: 2023 Full Grid
const MOCK_DRIVERS = [
  { driver_code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#3671C6', position: 1 },
  { driver_code: 'PER', name: 'Sergio Perez', team: 'Red Bull Racing', color: '#3671C6', position: 2 },
  { driver_code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', color: '#27F4D2', position: 3 },
  { driver_code: 'RUS', name: 'George Russell', team: 'Mercedes', color: '#27F4D2', position: 4 },
  { driver_code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', color: '#E8002D', position: 5 },
  { driver_code: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', color: '#E8002D', position: 6 },
  { driver_code: 'NOR', name: 'Lando Norris', team: 'McLaren', color: '#FF8000', position: 7 },
  { driver_code: 'PIA', name: 'Oscar Piastri', team: 'McLaren', color: '#FF8000', position: 8 },
  { driver_code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', color: '#229971', position: 9 },
  { driver_code: 'STR', name: 'Lance Stroll', team: 'Aston Martin', color: '#229971', position: 10 },
  { driver_code: 'GAS', name: 'Pierre Gasly', team: 'Alpine', color: '#0090FF', position: 11 },
  { driver_code: 'OCO', name: 'Esteban Ocon', team: 'Alpine', color: '#0090FF', position: 12 },
  { driver_code: 'ALB', name: 'Alexander Albon', team: 'Williams', color: '#37BEDD', position: 13 },
  { driver_code: 'SAR', name: 'Logan Sargeant', team: 'Williams', color: '#37BEDD', position: 14 },
  { driver_code: 'TSU', name: 'Yuki Tsunoda', team: 'AlphaTauri', color: '#5E8FAA', position: 15 },
  { driver_code: 'RIC', name: 'Daniel Ricciardo', team: 'AlphaTauri', color: '#5E8FAA', position: 16 },
  { driver_code: 'BOT', name: 'Valtteri Bottas', team: 'Alfa Romeo', color: '#900000', position: 17 },
  { driver_code: 'ZHO', name: 'Zhou Guanyu', team: 'Alfa Romeo', color: '#900000', position: 18 },
  { driver_code: 'MAG', name: 'Kevin Magnussen', team: 'Haas F1 Team', color: '#B6BABD', position: 19 },
  { driver_code: 'HUL', name: 'Nico Hulkenberg', team: 'Haas F1 Team', color: '#B6BABD', position: 20 },
];

const generateTelemetry = () => {
  const points = 100;
  return {
    distance: Array.from({ length: points }, (_, index) => index * 50),
    speed: Array.from({ length: points }, () => Math.floor(Math.random() * 200) + 100),
    rpm: Array.from({ length: points }, () => Math.floor(Math.random() * 5000) + 8000),
    gear: Array.from({ length: points }, () => Math.floor(Math.random() * 8) + 1),
    throttle: Array.from({ length: points }, () => (Math.random() > 0.3 ? 100 : Math.random() * 100)),
    brake: Array.from({ length: points }, () => (Math.random() > 0.8 ? 100 : 0)),
    lap_time: 81.234,
  };
};

const buildSelectionParams = (selection = {}) => {
  const params = {};

  if (selection.year) {
    params.year = selection.year;
  }

  if (selection.race) {
    params.race = selection.race;
  }

  if (selection.session) {
    params.session = selection.session;
  }

  return params;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (requestFactory, attempts = 6) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
};

export const fetchSeasons = async () => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/seasons`, { timeout: API_TIMEOUT_MS }),
      15,
    );
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable. Falling back to the default FastF1 season.', error);
    return [DEFAULT_SELECTION.year];
  }
};

export const fetchEvents = async (year = DEFAULT_SELECTION.year) => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/events`, {
        params: { year },
        timeout: API_TIMEOUT_MS,
      }),
      10,
    );
    return response.data;
  } catch (error) {
    console.warn(`Backend unavailable. Using fallback event list for ${year}.`, error);
    return FALLBACK_EVENTS[year] || FALLBACK_EVENTS[DEFAULT_SELECTION.year];
  }
};

export const fetchDrivers = async (selection = DEFAULT_SELECTION) => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/drivers`, {
        params: buildSelectionParams(selection),
        timeout: API_TIMEOUT_MS,
      }),
      2,
    );
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable. Using mock drivers.', error);
    return MOCK_DRIVERS;
  }
};

export const fetchTelemetry = async (driverCode, selection = DEFAULT_SELECTION) => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/telemetry/${driverCode}`, {
        params: buildSelectionParams(selection),
        timeout: API_TIMEOUT_MS,
      }),
      2,
    );
    return response.data;
  } catch (error) {
    console.warn(`Backend unavailable. Using mock telemetry for ${driverCode}.`, error);
    return { driver: driverCode, ...generateTelemetry() };
  }
};

export const fetchCompareData = async (driver1, driver2, selection = DEFAULT_SELECTION) => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/compare`, {
        params: {
          ...buildSelectionParams(selection),
          driver1,
          driver2,
        },
        timeout: API_TIMEOUT_MS,
      }),
      2,
    );
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable. Using mock comparison.', error);
    return {
      [driver1]: { driver: driver1, ...generateTelemetry() },
      [driver2]: { driver: driver2, ...generateTelemetry() },
    };
  }
};

export const fetchAIInsights = async (driverCode, selection = DEFAULT_SELECTION) => {
  try {
    const response = await requestWithRetry(
      () => axios.get(`${API_URL}/ai-insights/${driverCode}`, {
        params: buildSelectionParams(selection),
        timeout: 60000,
      }),
      1,
    );
    return response.data;
  } catch (error) {
    console.warn(`AI insights unavailable for ${driverCode}. Falling back to UI heuristics.`, error);
    return {
      available: false,
      insights: [],
      model: null,
    };
  }
};
