import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function LiveSpeedGraph({ telemetryData, driverColor = "#E10600" }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (telemetryData && telemetryData.distance && telemetryData.speed) {
      // Downsample for performance if needed, or format for Recharts
      const formatted = telemetryData.distance.map((dist, idx) => ({
        distance: Math.round(dist),
        speed: telemetryData.speed[idx],
        rpm: telemetryData.rpm ? telemetryData.rpm[idx] : 0
      }));
      setData(formatted);
    }
  }, [telemetryData]);

  if (!data.length) return (
    <div className="glass h-64 w-full rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1red"></div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass p-4 rounded-xl w-full h-80 flex flex-col relative"
    >
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-lg font-bold tracking-wider text-gray-200 uppercase">Speed Trace</h3>
        <p className="text-xs text-f1red animate-pulse">● LIVE TELEMETRY</p>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis 
            dataKey="distance" 
            stroke="#666" 
            tickFormatter={(tick) => `${tick}m`}
            tick={{ fill: '#888', fontSize: 12 }} 
          />
          <YAxis 
            dataKey="speed" 
            stroke="#666"
            domain={[0, 360]}
            tick={{ fill: '#888', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(11,11,11,0.9)', borderColor: driverColor, borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: driverColor, fontWeight: 'bold' }}
            labelFormatter={(label) => `Distance: ${label}m`}
          />
          <Line 
            type="monotone" 
            dataKey="speed" 
            stroke={driverColor} 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: driverColor, stroke: '#fff' }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
