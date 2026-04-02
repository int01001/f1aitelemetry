import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function DriverSelector({ drivers, selectedDriver, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  // Fallback map if needed, otherwise use drivers prop
  const driverList = drivers || [];

  return (
    <div className="relative w-64 z-50">
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass p-3 rounded-lg flex items-center justify-between text-white border border-white/20 hover:border-f1red/50 transition-colors"
      >
        <span className="font-bold tracking-wide">
          {selectedDriver ? selectedDriver.name : 'Select Driver'}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-0 w-full glass rounded-lg overflow-hidden border border-white/10 shadow-2xl max-h-60 overflow-y-auto"
          >
            {driverList.map((driver) => (
              <motion.button
                key={driver.driver_code}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={() => {
                  onSelect(driver);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: driver.color || '#ccc' }} 
                />
                <span className="flex-1 text-left font-medium">{driver.name}</span>
                <span className="text-xs text-gray-400 uppercase font-mono">{driver.driver_code}</span>
                {selectedDriver?.driver_code === driver.driver_code && (
                  <Check size={16} className="text-f1red" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
