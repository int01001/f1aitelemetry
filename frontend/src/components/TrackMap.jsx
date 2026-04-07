import { motion } from 'framer-motion';

export default function TrackMap({
  progressPercent = 0,
  color = '#E10600',
  title = 'Track Progress',
  subtitle = 'Stylized circuit replay',
}) {
  // Generic stylized track representation used for playback progress.
  const trackPath = "M20 180 C30 150, 60 110, 80 80 C90 60, 110 50, 150 50 L250 50 C280 50, 310 60, 310 90 L310 120 C310 140, 300 160, 270 170 C250 175, 230 180, 200 180 Z";

  // Framer Motion provides a way to draw along SVG paths, but to get a dot moving,
  // we animate the strokeDasharray directly or use pathLength. But actually getting a dot's x,y 
  // from a path in React without extra libs is tricky. 
  // An easier way is to just have a secondary path acting as the "progress" trace that grows.
  
  return (
    <div className="glass p-6 rounded-xl flex flex-col items-center justify-center relative w-full h-full min-h-[250px] overflow-hidden group">
      <div className="absolute top-4 left-6 z-10 w-full">
        <h3 className="text-lg font-bold tracking-wider text-gray-200 uppercase">{title}</h3>
        <p className="text-xs text-gray-400 font-mono tracking-widest mt-0.5">{subtitle}</p>
      </div>

      <div className="relative w-full h-[200px] mt-6 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 350 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {/* Base Track */}
          <path 
            d={trackPath} 
            fill="none" 
            stroke="#333" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Progress Overlay (simulating car position by tracing the path) */}
          <motion.path 
            d={trackPath} 
            fill="none" 
            stroke={color}
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            pathLength="100"
            strokeDasharray="100"
            animate={{ 
              strokeDashoffset: 100 - progressPercent,
            }}
            transition={{ type: "tween", duration: 0.2 }}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />

          {/* Start/Finish Line */}
          <line x1="18" y1="170" x2="30" y2="190" stroke="#fff" strokeWidth="4" />
        </svg>
      </div>
      
      {/* Location label */}
      <div className="absolute bottom-4 right-6 bg-black/50 px-3 py-1 rounded font-mono text-xs tracking-widest text-[#E10600]">
        LIVE POS
      </div>
    </div>
  );
}
