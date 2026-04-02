import { motion } from 'framer-motion';
import { Thermometer, CloudRain, Wind } from 'lucide-react';

export default function WeatherPanel() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-4 rounded-xl flex items-center justify-between gap-6 overflow-hidden relative"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded text-orange-400 border border-orange-500/30">
          <Thermometer size={20} />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest leading-tight">TRACK</div>
          <div className="font-bold text-lg">34°C</div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/10" />

      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded text-blue-400 border border-blue-500/30">
          <CloudRain size={20} />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest leading-tight">RAIN PROB</div>
          <div className="font-bold text-lg">15%</div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/10" />

      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-500/20 rounded text-gray-400 border border-gray-500/30">
          <Wind size={20} />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest leading-tight">WIND</div>
          <div className="font-bold text-lg">4 kph</div>
        </div>
      </div>
    </motion.div>
  );
}
