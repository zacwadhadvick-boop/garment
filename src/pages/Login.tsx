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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">StitchFlow POS</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Industrial Billing System</p>
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
