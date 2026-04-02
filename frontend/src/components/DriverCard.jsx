import { motion } from 'framer-motion';

const teamLogos = {
  "Red Bull Racing": "https://media.formula1.com/content/dam/fom-website/teams/2023/red-bull-racing-logo.png",
  "Mercedes": "https://media.formula1.com/content/dam/fom-website/teams/2023/mercedes-logo.png",
  "Ferrari": "https://media.formula1.com/content/dam/fom-website/teams/2023/ferrari-logo.png",
  "McLaren": "https://media.formula1.com/content/dam/fom-website/teams/2023/mclaren-logo.png",
  "Aston Martin": "https://media.formula1.com/content/dam/fom-website/teams/2023/aston-martin-logo.png",
  "Alpine": "https://media.formula1.com/content/dam/fom-website/teams/2023/alpine-logo.png",
  "Williams": "https://media.formula1.com/content/dam/fom-website/teams/2023/williams-logo.png",
  "AlphaTauri": "https://media.formula1.com/content/dam/fom-website/teams/2023/alphatauri-logo.png",
  "Alfa Romeo": "https://media.formula1.com/content/dam/fom-website/teams/2023/alfa-romeo-logo.png",
  "Haas F1 Team": "https://media.formula1.com/content/dam/fom-website/teams/2023/haas-f1-team-logo.png"
};

const headshots = {
  VER: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png',
  PER: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png',
  HAM: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png',
  RUS: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png',
  LEC: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png',
  SAI: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png',
  NOR: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png',
  PIA: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png',
  ALO: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png',
  STR: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png',
  GAS: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png',
  OCO: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png',
  ALB: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png',
  SAR: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LOGSAR01_Logan_Sargeant/logsar01.png',
  TSU: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png',
  RIC: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/D/DANRIC01_Daniel_Ricciardo/danric01.png',
  BOT: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png',
  ZHO: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GUAZHO01_Guanyu_Zhou/guazho01.png',
  MAG: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KEVMAG01_Kevin_Magnussen/kevmag01.png',
  HUL: 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png'
};

const getDriverImage = (code) => {
  return headshots[code] || `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${code}.png`;
};

export default function DriverCard({ driver }) {
  if (!driver) return null;

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
        <img 
          src={getDriverImage(driver.driver_code)} 
          onError={(e) => { e.target.src = "https://media.formula1.com/content/dam/fom-website/drivers/2023Drivers/default.png"; }}
          className="w-full h-full object-cover object-top scale-110" 
          alt={driver.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Details */}
      <div className="flex-1 px-4 flex flex-col justify-center">
        <h2 className="text-2xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md">
          {driver.name.split(' ')[0]} <br/> {driver.name.split(' ').slice(1).join(' ')}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          {teamLogos[driver.team] && (
            <img 
              src={teamLogos[driver.team]} 
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
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">GRID</span>
        <span className="text-3xl font-black font-mono" style={{ color: driver.color || '#fff' }}>
          P{driver.position}
        </span>
      </div>
    </motion.div>
  );
}
