import { motion } from 'framer-motion';

export default function SectorTiming() {
  const sectors = [
    { label: "S1", status: "purple", time: "26.8" }, // purple = fastest overall
    { label: "S2", status: "green", time: "27.4" },  // green = personal best
    { label: "S3", status: "yellow", time: "28.1" }  // yellow = no improvement
  ];

  const getColor = (status) => {
    switch (status) {
      case 'purple': return 'bg-purple-600 shadow-[0_0_15px_#9333ea] border-purple-400';
      case 'green': return 'bg-green-600 shadow-[0_0_15px_#16a34a] border-green-400';
      default: return 'bg-yellow-500 shadow-[0_0_10px_#eab308] border-yellow-300 text-black';
    }
  };

  return (
    <div className="glass p-4 rounded-xl flex items-center justify-between gap-4">
      <div className="flex flex-col mr-2">
        <span className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-1">Sector Timing</span>
        <span className="text-sm font-bold text-white">Best Sector & PB</span>
      </div>

      <div className="flex gap-3">
        {sectors.map((sector, i) => (
          <motion.div 
            key={sector.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border w-16 h-16 ${getColor(sector.status)}`}
          >
            <span className="text-[10px] font-black tracking-widest uppercase opacity-80">{sector.label}</span>
            <span className="font-mono font-bold text-sm mt-0.5">{sector.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
