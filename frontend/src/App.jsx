import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  DEFAULT_SELECTION,
  fetchDrivers,
  fetchEvents,
  fetchSeasons,
  fetchTelemetry,
} from './services/api';

import AIInsights from './components/AIInsights';
import DRSIndicator from './components/DRSIndicator';
import DriverCard from './components/DriverCard';
import DriverSelector from './components/DriverSelector';
import Leaderboard from './components/Leaderboard';
import LiveSpeedGraph from './components/LiveSpeedGraph';
import Login from './components/Login';
import SessionSelector from './components/SessionSelector';
import SectorTiming from './components/SectorTiming';
import Speedometer from './components/Speedometer';
import TelemetryPanel from './components/TelemetryPanel';
import TrackMap from './components/TrackMap';
import WeatherPanel from './components/WeatherPanel';


function getPreferredEvent(events, preferredEvent) {
  if (!events.length) {
    return null;
  }

  if (preferredEvent && events.some((event) => event.name === preferredEvent)) {
    return preferredEvent;
  }

  if (events.some((event) => event.name === DEFAULT_SELECTION.race)) {
    return DEFAULT_SELECTION.race;
  }

  return events[0].name;
}

function getPreferredSession(event, preferredSession) {
  if (!event?.sessions?.length) {
    return DEFAULT_SELECTION.session;
  }

  if (preferredSession && event.sessions.some((session) => session.name === preferredSession)) {
    return preferredSession;
  }

  const raceSession = event.sessions.find((session) => session.name === 'Race');
  return raceSession ? raceSession.name : event.sessions[event.sessions.length - 1].name;
}


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [seasons, setSeasons] = useState([DEFAULT_SELECTION.year]);
  const [selectedYear, setSelectedYear] = useState(DEFAULT_SELECTION.year);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(DEFAULT_SELECTION.race);
  const [selectedSession, setSelectedSession] = useState(DEFAULT_SELECTION.session);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectionLoading, setSelectionLoading] = useState(true);

  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [raceMode, setRaceMode] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPitting, setIsPitting] = useState(false);
  const [pitTimer, setPitTimer] = useState('0.0');

  const pitIntervalRef = useRef(null);

  const selectedEventData = events.find((event) => event.name === selectedEvent) || null;
  const availableSessions = selectedEventData?.sessions || [];
  const activeSelection = {
    year: selectedYear,
    race: selectedEvent,
    session: selectedSession,
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSeasons() {
      const availableSeasons = await fetchSeasons();
      if (cancelled || !availableSeasons?.length) {
        return;
      }

      setSeasons(availableSeasons);
      if (!availableSeasons.includes(DEFAULT_SELECTION.year)) {
        setSelectedYear(availableSeasons[0]);
      }
    }

    loadSeasons();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setSelectionLoading(true);
      const availableEvents = await fetchEvents(selectedYear);
      if (cancelled) {
        return;
      }

      setEvents(availableEvents);

      const nextEvent = getPreferredEvent(availableEvents, selectedEvent);
      const nextEventData = availableEvents.find((event) => event.name === nextEvent) || availableEvents[0] || null;
      const nextSession = getPreferredSession(nextEventData, selectedSession);

      setSelectedEvent(nextEvent);
      setSelectedSession(nextSession);
      setSelectionLoading(false);
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedEventData) {
      return;
    }

    const nextSession = getPreferredSession(selectedEventData, selectedSession);
    if (nextSession !== selectedSession) {
      setSelectedSession(nextSession);
    }
  }, [selectedEventData, selectedSession]);

  useEffect(() => {
    if (selectionLoading || !selectedEvent || !selectedSession) {
      return;
    }

    let cancelled = false;

    async function loadDrivers() {
      setLoading(true);
      try {
        const driverData = await fetchDrivers(activeSelection);
        if (cancelled) {
          return;
        }

        setDrivers(driverData);
        setSelectedDriver((currentDriver) => (
          driverData.find((driver) => driver.driver_code === currentDriver?.driver_code) || driverData[0] || null
        ));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDrivers();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedEvent, selectedSession, selectionLoading]);

  useEffect(() => {
    if (selectionLoading || !selectedDriver || !selectedEvent || !selectedSession) {
      return;
    }

    let cancelled = false;

    async function loadTelemetry() {
      setTelemetry(null);
      setPlaybackIndex(0);
      setIsPlaying(true);
      setIsLiveMode(true);

      const telemetryData = await fetchTelemetry(selectedDriver.driver_code, activeSelection);
      if (cancelled) {
        return;
      }

      setTelemetry(telemetryData);
    }

    loadTelemetry();

    return () => {
      cancelled = true;
    };
  }, [selectedDriver, selectedYear, selectedEvent, selectedSession, selectionLoading]);

  useEffect(() => {
    if (!telemetry?.speed?.length) {
      return;
    }

    if (playbackIndex === 80 && !isPitting && isPlaying) {
      triggerPitStop();
    }

    if (!isPlaying || isPitting) {
      return;
    }

    const speedMs = raceMode ? 40 : 100;

    const interval = setInterval(() => {
      setPlaybackIndex((previousIndex) => {
        if (previousIndex >= telemetry.speed.length - 1) {
          setIsPlaying(false);
          setIsLiveMode(false);
          return previousIndex;
        }

        return previousIndex + 1;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [telemetry, raceMode, isPitting, isPlaying, playbackIndex]);

  const triggerPitStop = () => {
    setIsPitting(true);
    let ms = 0;

    pitIntervalRef.current = setInterval(() => {
      ms += 100;
      setPitTimer((ms / 1000).toFixed(1));

      if (ms >= 2400) {
        clearInterval(pitIntervalRef.current);
        setIsPitting(false);
        setPitTimer('0.0');
        setPlaybackIndex((previousIndex) => previousIndex + 1);
      }
    }, 100);
  };

  const currentSpeed = isPitting ? 0 : (telemetry?.speed?.[playbackIndex] || 0);
  const currentRpm = isPitting ? 3000 : (telemetry?.rpm?.[playbackIndex] || 0);
  const currentGear = isPitting ? 1 : (telemetry?.gear?.[playbackIndex] || 0);
  const currentThrottle = isPitting ? 10 : (telemetry?.throttle?.[playbackIndex] || 0);
  const currentBrake = isPitting ? 100 : (telemetry?.brake?.[playbackIndex] || 0);
  const trackProgress = telemetry?.speed?.length ? (playbackIndex / telemetry.speed.length) * 100 : 0;
  const isDRS = currentSpeed > 290 && currentThrottle > 90;
  const isErsDepleted = trackProgress > 80;

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (loading || selectionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white pb-20">
        <div className="w-16 h-16 border-t-4 border-f1red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white p-6 pb-20 relative font-sans transition-colors duration-1000 ${raceMode ? 'bg-[#050000]' : 'bg-f1dark'}`}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center center' }} />
      <div className="scan-overlay"></div>
      {raceMode && <div className="fixed inset-0 pulse-bg pointer-events-none z-0"></div>}

      <header className="relative z-50 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 border-b border-f1red/20 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 bg-f1red rounded flex items-center justify-center transition-all ${raceMode ? 'neon-glow animate-pulse' : 'shadow-lg'}`}>
            <span className="font-black text-2xl italic tracking-tighter">F1</span>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Telemetry Dashboard</h1>
            <div className="flex flex-wrap gap-4 items-center mt-1">
              <p className="text-gray-400 font-mono text-sm tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                FASTF1 REPLAY
              </p>
              <p className="text-gray-500 font-mono text-xs tracking-[0.2em] uppercase">
                {selectedYear} / {selectedEvent} / {selectedSession}
              </p>
              <button
                onClick={() => setRaceMode(!raceMode)}
                className={`px-3 py-1 text-xs font-bold font-mono border rounded transition-all ${raceMode ? 'border-f1red text-f1red shadow-[0_0_10px_#E10600]' : 'border-gray-600 text-gray-400 hover:text-white'}`}
              >
                {raceMode ? '[ RACE MODE ]' : '[ NORMAL ]'}
              </button>
            </div>
          </div>
        </div>

        <DriverSelector drivers={drivers} selectedDriver={selectedDriver} onSelect={setSelectedDriver} />
      </header>

      <div className="relative z-20 mb-6">
        <SessionSelector
          seasons={seasons}
          selectedYear={selectedYear}
          events={events}
          selectedEvent={selectedEvent}
          sessions={availableSessions}
          selectedSession={selectedSession}
          onYearChange={setSelectedYear}
          onEventChange={setSelectedEvent}
          onSessionChange={setSelectedSession}
          loading={selectionLoading}
        />
      </div>

      <AnimatePresence>
        {isPitting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <h1 className="text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_#E10600] animate-pulse">PIT STOP</h1>
            <div className="text-6xl font-mono text-f1red font-bold mt-4 shadow-[0_0_15px_#E10600]">{pitTimer}s</div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {selectedDriver && <DriverCard key={selectedDriver.driver_code} driver={selectedDriver} />}
          </AnimatePresence>

          <motion.div className="flex justify-center mt-4 mb-4">
            <Speedometer speed={currentSpeed} raceMode={raceMode} />
          </motion.div>

          <DRSIndicator drsEnabled={isDRS} ersDepleted={isErsDepleted} />

          <TelemetryPanel rpm={currentRpm} gear={currentGear} throttle={currentThrottle} brake={currentBrake} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-64">
            <TrackMap
              progressPercent={trackProgress}
              color={selectedDriver?.color}
              title={selectedEventData?.location || 'Track Progress'}
              subtitle={`${selectedEventData?.name || selectedEvent} / ${selectedSession}`}
            />
          </div>

          <SectorTiming />

          <AIInsights
            speed={currentSpeed}
            gear={currentGear}
            throttle={currentThrottle}
            isPitting={isPitting}
          />

          <WeatherPanel />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass p-5 rounded-xl border border-[#E10600]/20 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span>Race Timeline</span>
                {isLiveMode && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-1" />}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    setIsLiveMode(false);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-bold transition-colors"
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={() => {
                    setPlaybackIndex(0);
                    setIsPlaying(true);
                    setIsLiveMode(true);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-bold transition-colors"
                >
                  RESET
                </button>
                <button
                  onClick={() => {
                    setIsLiveMode(true);
                    setIsPlaying(true);
                  }}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors border ${isLiveMode ? 'bg-f1red/20 text-f1red border-f1red' : 'bg-transparent border-gray-600 text-gray-400 hover:text-white'}`}
                >
                  LIVE MODE
                </button>
              </div>
            </div>

            <input
              type="range"
              className="w-full accent-f1red cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none"
              min="0"
              max={(telemetry?.speed?.length || 100) - 1}
              value={playbackIndex}
              onChange={(event) => {
                setIsPlaying(false);
                setIsLiveMode(false);
                setPlaybackIndex(Number(event.target.value));
              }}
            />
          </div>

          <div className="h-80">
            <LiveSpeedGraph telemetryData={telemetry} driverColor={selectedDriver?.color} />
          </div>

          <Leaderboard drivers={drivers} fastestLapDriverCode={selectedDriver?.driver_code} />
        </div>
      </main>
    </div>
  );
}


export default App;
