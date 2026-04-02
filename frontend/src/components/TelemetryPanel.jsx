import { motion } from 'framer-motion';

export default function TelemetryPanel({ rpm = 0, gear = 0, throttle = 0, brake = 0 }) {
  
  const Bar = ({ label, value, max, color, isVertical = false }) => {
    const progress = Math.min(Math.max((value / max) * 100, 0), 100);
    
    return (
      <div className={`flex ${isVertical ? 'flex-col-reverse h-32 w-12 items-center' : 'flex-col w-full'}`}>
        <div className="flex justify-between text-xs text-gray-400 font-mono mb-1 w-full uppercase tracking-wider">
          <span>{label}</span>
          {!isVertical && <span>{Math.round(value)}</span>}
        </div>
        
        <div className={`bg-gray-800 rounded-sm relative overflow-hidden flex ${isVertical ? 'w-4 h-full flex-col-reverse' : 'h-3 w-full'}`}>
          <motion.div
            className="absolute rounded-sm"
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
              width: isVertical ? '100%' : `${progress}%`,
              height: isVertical ? `${progress}%` : '100%',
              bottom: 0,
              left: 0
            }}
            initial={isVertical ? { height: 0 } : { width: 0 }}
            animate={isVertical ? { height: `${progress}%` } : { width: `${progress}%` }}
            transition={{ type: "tween", duration: 0.1, ease: 'linear' }}
          />
        </div>
        {isVertical && <div className="text-sm font-bold font-mono mt-2">{Math.round(value)}</div>}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-lg font-semibold tracking-wide text-gray-200">Live Telemetry</h3>
        <div className="flex items-center justify-center bg-gray-900 rounded-full h-12 w-12 border border-f1red/50 neon-glow">
          <span className="text-2xl font-black font-mono text-white text-shadow-sm">{gear === 0 ? 'N' : gear}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-end gap-6 h-full mt-2">
        <div className="flex gap-4">
          <Bar label="THR" value={throttle} max={100} color="#22c55e" isVertical={true} />
          <Bar label="BRK" value={brake} max={100} color="#E10600" isVertical={true} />
        </div>
        <div className="flex-1 pb-4">
          <Bar label="RPM" value={rpm} max={13000} color="#3b82f6" />
        </div>
      </div>
    </motion.div>
  );
}
