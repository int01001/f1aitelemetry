import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const teamLogoMatchers = [
  { match: ['Red Bull'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/red-bull-racing-logo.png' },
  { match: ['Mercedes'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/mercedes-logo.png' },
  { match: ['Ferrari'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/ferrari-logo.png' },
  { match: ['McLaren'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/mclaren-logo.png' },
  { match: ['Aston Martin'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/aston-martin-logo.png' },
  { match: ['Alpine'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/alpine-logo.png' },
  { match: ['Williams'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/williams-logo.png' },
  { match: ['AlphaTauri', 'RB', 'Racing Bulls'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/alphatauri-logo.png' },
  { match: ['Alfa Romeo', 'Sauber', 'Stake', 'Kick'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/alfa-romeo-logo.png' },
  { match: ['Haas'], logo: 'https://media.formula1.com/content/dam/fom-website/teams/2023/haas-f1-team-logo.png' },
];

const getTeamLogo = (teamName = '') => {
  const normalizedTeamName = teamName.toLowerCase();
  const teamMatch = teamLogoMatchers.find(({ match }) => (
    match.some((candidate) => normalizedTeamName.includes(candidate.toLowerCase()))
  ));

  return teamMatch?.logo || null;
};

const getDriverInitials = (name = '') => (
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
);

export default function DriverCard({ driver }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [driver?.driver_code, driver?.headshot_url]);

  if (!driver) return null;

  const positionLabel = Number.isInteger(driver.position)
    ? `P${driver.position}`
    : (driver.driver_number ? `#${driver.driver_number}` : '--');
  const driverInitials = getDriverInitials(driver.name);
  const teamLogo = getTeamLogo(driver.team);
  const showDriverImage = Boolean(driver.headshot_url) && !imageFailed;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ scale: 1.02 }}
      className="glass p-4 rounded-2xl flex items-center justify-between w-full max-w-sm relative overflow-hidden group hover:neon-glow transition-all duration-300 border border-white/5"
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 opacity-80"
        style={{ backgroundColor: driver.color || '#E10600' }}
      />
      
      {/* Driver Headshot */}
      <div className="relative w-20 h-20 overflow-hidden ml-2 rounded-full border-2 border-white/10 shadow-lg shrink-0">
        {showDriverImage ? (
          <img
            src={driver.headshot_url}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover object-top scale-110"
            alt={driver.name}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-black tracking-widest"
            style={{
              background: `linear-gradient(135deg, ${driver.color || '#E10600'} 0%, rgba(0, 0, 0, 0.95) 100%)`,
            }}
          >
            {driverInitials}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Details */}
      <div className="flex-1 px-4 flex flex-col justify-center">
        <h2 className="text-2xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md">
          {driver.name.split(' ')[0]} <br/> {driver.name.split(' ').slice(1).join(' ')}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          {teamLogo && (
            <img 
              src={teamLogo} 
              className="h-4 object-contain opacity-80" 
              alt={driver.team} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <p className="text-gray-400 text-xs font-mono tracking-wide truncate">
            {driver.team}
          </p>
        </div>
      </div>
      
      {/* Position */}
      <div className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl border border-white/10 shrink-0 shadow-inner group-hover:bg-white/5 transition-colors">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">SESSION</span>
        <span className="text-3xl font-black font-mono" style={{ color: driver.color || '#fff' }}>
          {positionLabel}
        </span>
      </div>
    </motion.div>
  );
}
