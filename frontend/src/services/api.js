import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
  { driver_code: 'HUL', name: 'Nico Hulkenberg', team: 'Haas F1 Team', color: '#B6BABD', position: 20 }
];

const generateTelemetry = () => {
  const points = 100;
  return {
    distance: Array.from({length: points}, (_, i) => i * 50),
    speed: Array.from({length: points}, () => Math.floor(Math.random() * 200) + 100),
    rpm: Array.from({length: points}, () => Math.floor(Math.random() * 5000) + 8000),
    gear: Array.from({length: points}, () => Math.floor(Math.random() * 8) + 1),
    throttle: Array.from({length: points}, () => Math.random() > 0.3 ? 100 : Math.random() * 100),
    brake: Array.from({length: points}, () => Math.random() > 0.8 ? 100 : 0),
    lap_time: 81.234
  };
};

export const fetchDrivers = async () => {
  try {
    const response = await axios.get(`${API_URL}/drivers`);
    return response.data;
  } catch (error) {
    console.warn("Backend unavailable. Using mock drivers.", error);
    return MOCK_DRIVERS;
  }
};

export const fetchTelemetry = async (driverCode) => {
  try {
    const response = await axios.get(`${API_URL}/telemetry/${driverCode}`);
    return response.data;
  } catch (error) {
    console.warn(`Backend unavailable. Using mock telemetry for ${driverCode}.`, error);
    return { driver: driverCode, ...generateTelemetry() };
  }
};

export const fetchCompareData = async (driver1, driver2) => {
  try {
    const response = await axios.get(`${API_URL}/compare?driver1=${driver1}&driver2=${driver2}`);
    return response.data;
  } catch (error) {
    console.warn("Backend unavailable. Using mock comparison.", error);
    return {
      [driver1]: { driver: driver1, ...generateTelemetry() },
      [driver2]: { driver: driver2, ...generateTelemetry() }
    };
  }
};
