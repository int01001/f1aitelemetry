import { motion } from 'framer-motion';

export default function Speedometer({ speed, raceMode }) {
  const maxSpeed = 350;
  const progress = Math.min(Math.max(speed / maxSpeed, 0), 1);
  const displaySpeed = Math.round(speed);
  
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const getColor = () => {
    if (speed < 150) return '#22c55e'; // Green
    if (speed < 250) return '#eab308'; // Yellow
    if (speed < 300) return '#f97316'; // Orange
    return '#E10600'; // F1 Red
  };

  const isInsaneSpeed = speed >= 300;
  const currentColor = getColor();

  // Needle angle calculations
  const needleRotation = (progress * 360) - 90;

  return (
    <div className={`relative w-72 h-72 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 ${isInsaneSpeed ? 'speedometer-pulse' : 'shadow-[0_0_30px_rgba(225,6,0,0.1)]'}`}>
      
      {/* Glow aura inside the gauge */}
      <div className="absolute inset-4 rounded-full" style={{ boxShadow: `inset 0 0 ${isInsaneSpeed ? '50px' : '20px'} ${currentColor}40` }} />

      <svg className="absolute w-full h-full transform -rotate-90 z-10" width="288" height="288">
        {/* Background Track */}
        <circle
          cx="144"
          cy="144"
          r={radius}
          fill="transparent"
          stroke="#1f2937"
          strokeWidth="14"
          strokeDasharray={circumference}
        />
        {/* Animated Speed Track */}
        <motion.circle
          cx="144"
          cy="144"
          r={radius}
          fill="transparent"
          stroke={currentColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset, stroke: currentColor }}
          transition={raceMode ? { type: "spring", stiffness: 300, damping: 20 } : { type: "spring", stiffness: 100, damping: 15 }}
          style={{ filter: isInsaneSpeed ? `drop-shadow(0 0 15px ${currentColor})` : `drop-shadow(0 0 5px ${currentColor})` }}
        />
      </svg>
      
      {/* Animated Needle */}
      <motion.div
        className="absolute w-1 rounded-t-full origin-bottom z-20"
        style={{ height: radius, bottom: '50%', left: '50%', marginLeft: '-2px', backgroundColor: '#fff', boxShadow: '0 0 8px #fff' }}
        initial={{ rotate: -90 }}
        animate={{ rotate: needleRotation }}
        transition={raceMode ? { type: "spring", stiffness: 300, damping: 20 } : { type: "spring", stiffness: 100, damping: 15 }}
      />
      {/* Needle Center Pivot */}
      <div className="absolute w-6 h-6 bg-gray-900 rounded-full border-2 border-white z-30 shadow-[0_0_10px_#fff]" />
      
      {/* Speed Text */}
      <div className="absolute top-[65%] text-center flex flex-col items-center z-20">
        <motion.span
          key={isInsaneSpeed ? 'insane' : displaySpeed} // Remount occasionally
          initial={{ scale: 0.95 }}
          animate={{ scale: isInsaneSpeed ? [1, 1.1, 1] : 1 }}
          transition={isInsaneSpeed ? { repeat: Infinity, duration: 0.5 } : {}}
          className="text-6xl font-black font-mono tracking-tighter"
          style={{ color: '#fff', textShadow: `0 0 ${isInsaneSpeed ? '25px' : '15px'} ${currentColor}` }}
        >
          {displaySpeed}
        </motion.span>
        <span className="text-gray-400 text-xs font-bold tracking-[0.3em] mt-1 lg:mt-0 opacity-80 uppercase">km/h</span>
      </div>
      
      {/* Danger Overlay */}
      {isInsaneSpeed && (
        <div className="absolute inset-0 rounded-full border-2 border-f1red opacity-50 animate-ping z-0" />
      )}
    </div>
  );
}
