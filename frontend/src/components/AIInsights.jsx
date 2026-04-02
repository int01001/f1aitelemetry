import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, Info, Zap } from 'lucide-react';

export default function AIInsights({ speed, gear, throttle, isPitting }) {
  
  const generateDynamicInsights = () => {
    const insights = [];

    // Speed insight
    if (speed > 300) {
      insights.push({ text: "Driver pushing at maximum speed 🚀", type: 'critical', icon: <Zap size={16} /> });
    } else if (speed > 250) {
      insights.push({ text: "Hard acceleration detected in current sector.", type: 'info', icon: <Cpu size={16} /> });
    }

    // Throttle & Gear
    if (throttle > 95 && gear < 6) {
      insights.push({ text: "Heavy traction zone exit. Rear tyre slip likely.", type: 'warning', icon: <AlertTriangle size={16} /> });
    }

    // Pit Stop Warning
    if (isPitting) {
      insights.push({ text: "VEHICLE IN PIT LANE. Box Box Box.", type: 'critical', icon: <Info size={16} /> });
    } else {
      // Background fake data simulation
      insights.push({ text: "Tyre degradation increasing front-left (Softs).", type: 'warning', icon: <AlertTriangle size={16} /> });
      insights.push({ text: "Optimal race pace maintained against targets.", type: 'info', icon: <Info size={16} /> });
    }

    return insights.slice(0, 3); // Max 3 insights
  };

  const insightsList = generateDynamicInsights();

  return (
    <motion.div 
      className="glass p-5 rounded-xl border border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] w-full max-w-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="text-blue-400 animate-pulse" size={20} />
        <h3 className="text-lg font-bold tracking-wider text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">AI Insights</h3>
        <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">DYNAMIC</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {insightsList.map((insight, idx) => {
          let borderColor = 'border-blue-500';
          let textColor = 'text-blue-500';
          if (insight.type === 'warning') { borderColor = 'border-amber-500'; textColor = 'text-amber-500'; }
          if (insight.type === 'critical') { borderColor = 'border-red-500'; textColor = 'text-red-500'; }

          return (
            <motion.div 
              key={insight.text}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 p-2.5 rounded bg-black/40 border-l-2 ${borderColor}`}
            >
              <div className={`mt-0.5 ${textColor}`}>
                {insight.icon}
              </div>
              <p className="text-sm text-gray-300 leading-snug font-medium">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
