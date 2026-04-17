import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, Info, Zap } from 'lucide-react';

const getInsightIcon = (type) => {
  if (type === 'critical') return <Zap size={16} />;
  if (type === 'warning') return <AlertTriangle size={16} />;
  return <Info size={16} />;
};

export default function AIInsights({ speed, gear, throttle, isPitting, aiInsights }) {
  const generateDynamicInsights = () => {
    if (aiInsights?.available && aiInsights.insights?.length) {
      return aiInsights.insights.map((insight) => ({
        ...insight,
        icon: getInsightIcon(insight.type),
      }));
    }

    const insights = [];

    if (speed > 300) {
      insights.push({ text: 'Driver pushing at maximum speed.', type: 'critical', icon: <Zap size={16} /> });
    } else if (speed > 250) {
      insights.push({ text: 'Hard acceleration detected in current sector.', type: 'info', icon: <Cpu size={16} /> });
    }

    if (throttle > 95 && gear < 6) {
      insights.push({ text: 'Heavy traction zone exit. Rear tyre slip likely.', type: 'warning', icon: <AlertTriangle size={16} /> });
    }

    if (isPitting) {
      insights.push({ text: 'Vehicle in pit lane. Box Box Box.', type: 'critical', icon: <Info size={16} /> });
    } else {
      insights.push({ text: 'Tyre degradation increasing front-left (Softs).', type: 'warning', icon: <AlertTriangle size={16} /> });
      insights.push({ text: 'Optimal race pace maintained against targets.', type: 'info', icon: <Info size={16} /> });
    }

    return insights.slice(0, 3);
  };

  const insightsList = generateDynamicInsights();

  return (
    <motion.div className="glass p-5 rounded-xl border border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="text-blue-400 animate-pulse" size={20} />
        <h3 className="text-lg font-bold tracking-wider text-blue-400 uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">AI Insights</h3>
        <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
          {aiInsights?.available ? 'ML MODEL' : 'HEURISTIC'}
        </span>
      </div>

      {aiInsights?.available && aiInsights.model && (
        <div className="mb-4 p-2.5 rounded bg-black/30 border border-blue-500/20">
          <p className="text-xs text-blue-300 font-mono uppercase tracking-wider">{aiInsights.model.name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Target: {aiInsights.model.target || 'next_lap_time'} | Trained on {aiInsights.model.training_rows} laps
          </p>
          <p className="text-xs text-gray-400 mt-1">
            MAE {aiInsights.model.mae_seconds}s
            {typeof aiInsights.model.r2_score === 'number' ? ` | R2 ${aiInsights.model.r2_score}` : ''}
          </p>
        </div>
      )}

      {aiInsights?.available && typeof aiInsights.predicted_next_lap_time === 'number' && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded bg-black/30 border border-blue-500/20 p-2.5">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Current</p>
            <p className="text-sm text-white font-semibold mt-1">{aiInsights.current_lap_time.toFixed(3)}s</p>
          </div>
          <div className="rounded bg-black/30 border border-emerald-500/20 p-2.5">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Predicted</p>
            <p className="text-sm text-emerald-300 font-semibold mt-1">{aiInsights.predicted_next_lap_time.toFixed(3)}s</p>
          </div>
          <div className="rounded bg-black/30 border border-amber-500/20 p-2.5">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Delta</p>
            <p className="text-sm text-amber-300 font-semibold mt-1">
              {aiInsights.lap_delta > 0 ? '+' : ''}{aiInsights.lap_delta.toFixed(3)}s
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {insightsList.map((insight) => {
          let borderColor = 'border-blue-500';
          let textColor = 'text-blue-500';
          if (insight.type === 'warning') { borderColor = 'border-amber-500'; textColor = 'text-amber-500'; }
          if (insight.type === 'critical') { borderColor = 'border-red-500'; textColor = 'text-red-500'; }

          return (
            <motion.div
              key={`${insight.title || 'insight'}-${insight.text}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 p-2.5 rounded bg-black/40 border-l-2 ${borderColor}`}
            >
              <div className={`mt-0.5 ${textColor}`}>
                {insight.icon}
              </div>
              <div>
                {insight.title && <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">{insight.title}</p>}
                <p className="text-sm text-gray-300 leading-snug font-medium">{insight.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
