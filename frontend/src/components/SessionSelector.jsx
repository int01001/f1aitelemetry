import { motion } from 'framer-motion';

export default function SessionSelector({
  seasons,
  selectedYear,
  events,
  selectedEvent,
  sessions,
  selectedSession,
  onYearChange,
  onEventChange,
  onSessionChange,
  loading = false,
}) {
  const selectClassName = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-f1red';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass w-full rounded-xl border border-white/10 p-4"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300">FastF1 Session</h2>
          <p className="text-xs font-mono tracking-widest text-gray-500 mt-1">
            Pick any supported race weekend instead of using a hardcoded session.
          </p>
        </div>
        {loading && <span className="text-xs font-mono tracking-widest text-f1red">LOADING</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Season</span>
          <select
            className={selectClassName}
            value={selectedYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Weekend</span>
          <select
            className={selectClassName}
            value={selectedEvent}
            onChange={(event) => onEventChange(event.target.value)}
            disabled={!events.length}
          >
            {events.map((race) => (
              <option key={race.name} value={race.name}>
                {race.round}. {race.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase">Session</span>
          <select
            className={selectClassName}
            value={selectedSession}
            onChange={(event) => onSessionChange(event.target.value)}
            disabled={!sessions.length}
          >
            {sessions.map((session) => (
              <option key={session.name} value={session.name}>
                {session.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </motion.div>
  );
}
