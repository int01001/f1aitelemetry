import { motion } from 'framer-motion';

export default function Leaderboard({ drivers, fastestLapDriverCode }) {
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="glass rounded-xl overflow-hidden w-full max-w-md">
      <div className="bg-f1red text-white p-4 font-bold tracking-widest text-lg uppercase flex justify-between items-center">
        <span>Session Standings</span>
        <span className="text-xs bg-black/30 px-2 py-1 rounded text-white/80">LIVETIMING</span>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col"
      >
        {drivers.map((driver, idx) => {
          const isFastest = driver.driver_code === fastestLapDriverCode;
          
          return (
            <motion.div 
              key={driver.driver_code}
              variants={item}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              className={`flex items-center p-3 border-b border-white/5 transition-colors relative ${isFastest ? 'bg-purple-900/20' : ''}`}
            >
              <div className="w-8 font-mono font-bold text-gray-500">{idx + 1}</div>
              
              <div 
                className="w-1 h-6 mr-3 rounded-full" 
                style={{ backgroundColor: driver.color || '#ccc' }} 
              />
              
              <div className="flex-1">
                <div className="font-bold flex items-center gap-2">
                  <span>{driver.driver_code}</span>
                  {isFastest && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase label-fastest animate-pulse">Fastest Lap</span>}
                </div>
                <div className="text-xs text-gray-400 truncate w-32">{driver.team}</div>
              </div>
              
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
