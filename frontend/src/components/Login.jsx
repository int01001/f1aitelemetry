import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network authentication delay
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-f1dark flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px', backgroundPosition: 'center center' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-f1red/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="scan-overlay z-0" />

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
        className="glass p-10 rounded-2xl w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(225,6,0,0.15)] overflow-hidden"
      >
        {/* Red accent bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-f1red box-shadow-[0_0_15px_#E10600]" />

        <div className="flex flex-col items-center mb-10 mt-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-f1red rounded flex items-center justify-center neon-glow mb-4"
          >
            <span className="font-black text-3xl text-white italic tracking-tighter">F1</span>
          </motion.div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center">Pit Wall Access</h2>
          <p className="text-gray-400 font-mono text-xs tracking-[0.2em] mt-2">SECURE TELEMETRY LINK</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-mono text-gray-500 tracking-widest uppercase mb-2">Team Code</label>
            <input 
              type="text" 
              required
              placeholder="e.g. RBR-01"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-f1red focus:ring-1 focus:ring-f1red transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-mono text-gray-500 tracking-widest uppercase mb-2">Access Key</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-f1red focus:ring-1 focus:ring-f1red transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#ff0f0f' }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-f1red text-white font-bold uppercase tracking-widest py-4 rounded-lg mt-4 shadow-[0_0_20px_rgba(225,6,0,0.4)] transition-all flex items-center justify-center overflow-hidden relative group"
            type="submit"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                <span className="animate-pulse">Authenticating...</span>
              </div>
            ) : (
              <>
                <span className="relative z-10">Initialize Connection</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </>
            )}
          </motion.button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-mono tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            SYSTEM ONLINE
          </div>
        </div>
      </motion.div>
    </div>
  );
}
