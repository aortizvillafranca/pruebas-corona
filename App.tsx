
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, subscribeToCollection, updateDocument, addDocument, deleteDocument } from './services/firebase';
import { Icons } from './constants';
import { Brother, EventData, Turn, Reservation } from './types';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import RankingView from './components/RankingView';
import TurnosView from './components/TurnosView';
import AdminView from './components/AdminView';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<'dashboard' | 'calendar' | 'ranking' | 'turnos' | 'profile'>(() =>
    (localStorage.getItem('appView') as any) || 'dashboard'
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(localStorage.getItem('savedBrotherId'));
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Derivamos el usuario actual de la lista de hermanos para que esté siempre actualizado (puntos, etc)
  const currentUser = useMemo(() => brothers.find(b => b.id === currentUserId) || null, [brothers, currentUserId]);

  // Persistence
  useEffect(() => { localStorage.setItem('appView', view); }, [view]);

  // Auth & Subscriptions
  useEffect(() => {
    signInAnonymously(auth);
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) setIsLoggedIn(false);
    });

    const unsubB = subscribeToCollection('brothers', setBrothers);
    const unsubE = subscribeToCollection('events', (data) => setEvents(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())));
    const unsubT = subscribeToCollection('turns', setTurns);
    const unsubR = subscribeToCollection('reservations', setReservations);

    return () => {
      unsubAuth(); unsubB(); unsubE(); unsubT(); unsubR();
    };
  }, []);

  // Auto-login logic check
  useEffect(() => {
    if (currentUserId && currentUser && !isLoggedIn) {
      setIsLoggedIn(true);
    }
  }, [currentUser, isLoggedIn, currentUserId]);

  const showNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleLogin = (id: string) => {
    setCurrentUserId(id);
    setIsLoggedIn(true);
    localStorage.setItem('savedBrotherId', id);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    localStorage.removeItem('savedBrotherId');
    setView('dashboard');
  };

  // Rendering
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-fade-in border-4 border-amber-400">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-blue-900 mb-2">LA CORONA</h1>
            <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-bold">Mitigadores de Jesús</p>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
            {brothers.map(b => (
              <button
                key={b.id}
                onClick={() => handleLogin(b.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-amber-400 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-blue-900 font-bold group-hover:bg-amber-200">
                  {b.nickname.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="block font-bold text-slate-800">{b.nickname}</span>
                  <span className="text-xs text-slate-400">{b.name}</span>
                </div>
                <Icons.ChevronRight className="ml-auto text-slate-300" size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto shadow-2xl relative flex flex-col">
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-2 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
          {notification.type === 'success' ? <Icons.Check size={18} /> : <Icons.X size={18} />}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <Dashboard brothers={brothers} events={events} turns={turns} currentUser={currentUser} onNotify={showNotification} onLogout={handleLogout} />
            </motion.div>
          )}
          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <CalendarView brothers={brothers} events={events} reservations={reservations} currentUser={currentUser} onNotify={showNotification} />
            </motion.div>
          )}
          {view === 'ranking' && (
            <motion.div key="ranking" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <RankingView brothers={brothers} currentUser={currentUser} />
            </motion.div>
          )}
          {view === 'turnos' && (
            <motion.div key="turnos" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <TurnosView brothers={brothers} turns={turns} currentUser={currentUser} />
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <AdminView brothers={brothers} events={events} turns={turns} onNotify={showNotification} onLogout={handleLogout} setEvents={setEvents} setTurns={setTurns} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-slate-200 px-1 py-3 z-50 flex justify-between items-center rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <NavButton icon={<Icons.Home size={20} />} label="Inicio" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavButton icon={<Icons.Calendar size={20} />} label="Agenda" active={view === 'calendar'} onClick={() => setView('calendar')} />
        <div className="relative -top-6">
          <button
            onClick={() => setView('ranking')}
            className={`p-4 rounded-full shadow-2xl transition-all border-4 border-white ${view === 'ranking' ? 'bg-amber-400 text-blue-950 scale-110' : 'bg-blue-900 text-white'}`}
          >
            <Icons.Trophy size={26} />
          </button>
        </div>
        <NavButton icon={<Icons.ChefHat size={20} />} label="Turnos" active={view === 'turnos'} onClick={() => setView('turnos')} />

        <div className="flex items-center">
          {currentUser?.role === 'junta' && (
            <NavButton icon={<Icons.Settings size={20} />} label="Admin" active={view === 'profile'} onClick={() => setView('profile')} />
          )}
          {currentUser?.role !== 'junta' && (
            <button onClick={handleLogout} className="flex flex-col items-center justify-center p-2 w-14 text-slate-400 hover:text-rose-500 transition-colors">
              <Icons.LogOut size={20} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Salir</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 w-14 transition-all ${active ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-blue-400'}`}>
    {icon}
    <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
