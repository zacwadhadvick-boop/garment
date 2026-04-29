import React, { useState, useEffect } from 'react';
import { storage, seedInitialData } from '../db';
import { LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    seedInitialData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const staffMembers = storage.getStaff();
    const user = staffMembers.find(s => s.empId === empId && s.password === password);

    if (user) {
      if (!user.active) {
        setError('Your account is deactivated. Contact Admin.');
        return;
      }
      storage.setSession(user);
      onLogin();
    } else {
      setError('Invalid Employee ID or Password');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1920&auto=format&fit=crop")',
        }}
      />
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative z-10 border border-white/20"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-primary/40 rotate-3 hover:rotate-0 transition-transform duration-500">
            <LogIn size={40} />
          </div>
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none mb-2">StitchFlow POS</h1>
          <div className="h-1 w-12 bg-primary rounded-full mb-3" />
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Garment Industry Billing</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Employee ID</label>
            <input 
              type="text"
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary/30 font-bold text-sm"
              placeholder="e.g. admin"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Password</label>
            <input 
              type="password"
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary/30 font-bold text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
            Protected by StitchFlow Security Standard
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
