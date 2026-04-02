import { motion } from 'framer-motion';

export default function DRSIndicator({ drsEnabled = false, ersDepleted = false }) {
  return (
    <div className="flex gap-4">
      <div className={`px-4 py-2 rounded font-black tracking-widest text-xl flex items-center justify-center transition-all duration-300 ${drsEnabled ? 'bg-green-500 text-black shadow-[0_0_20px_#22c55e]' : 'bg-black/60 text-gray-600 border border-white/10'}`}>
        DRS
      </div>
      
      <div className="flex flex-col justify-center flex-1 max-w-[120px]">
        <span className="text-[10px] text-gray-400 font-mono tracking-widest mb-1">ERS DEPLOYMENT</span>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${ersDepleted ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-yellow-400 shadow-[0_0_10px_#facc15]'}`}
            initial={{ width: "100%" }}
            animate={{ width: ersDepleted ? "10%" : "65%" }}
            transition={{ type: "tween", duration: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
