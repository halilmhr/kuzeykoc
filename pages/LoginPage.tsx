
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import { UserRole, Coach } from '../types';
import CoachRegistration from '../components/common/CoachRegistration';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [error, setError] = useState('');
  const [showCoachRegistration, setShowCoachRegistration] = useState(false);
  const auth = useContext(AuthContext);

  useEffect(() => {
    // Clear email when role changes
    setEmail('');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('E-posta alanı zorunludur.');
      return;
    }
    if (!password) {
      setError('Şifre alanı zorunludur.');
      return;
    }
    setError('');
    
    try {
      const user = await auth?.login(email, password, role);
      
      if (!user) {
        setError('E-posta, şifre veya rol hatalı. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleCoachCreated = (coach: Coach) => {
    setShowCoachRegistration(false);
    setEmail(coach.email);
    setRole(UserRole.COACH);
    setError('Koç başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
  };

  return (
    <>
      {showCoachRegistration && (
        <CoachRegistration
          onCoachCreated={handleCoachCreated}
          onCancel={() => setShowCoachRegistration(false)}
        />
      )}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-700 p-2 sm:p-4">
      <div className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 space-y-6 sm:space-y-8 border border-white/30">
        <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 sm:h-12 w-auto text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 011.085.12L10 11.852l3.665-3.681a.999.999 0 011.085-.12L17.394 6.92a1 1 0 000-1.84l-7-3zM10 15a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" />
            </svg>
          <h2 className="mt-4 sm:mt-6 text-xl sm:text-3xl font-extrabold text-white text-center">
            <span className="hidden sm:inline">HALİL HOCA'NIN ŞAMPİYONLARI</span>
            <span className="sm:hidden">HALİL HOCA</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-violet-200">
            LGS hazırlık yolculuğuna başla!
          </p>
        </div>

        <div className="flex justify-center bg-black/20 rounded-full p-1">
          <button
            onClick={() => setRole(UserRole.STUDENT)}
            className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${role === UserRole.STUDENT ? 'bg-white text-violet-700 shadow-lg' : 'text-white hover:bg-white/20'}`}
          >
            Öğrenci
          </button>
          <button
            onClick={() => setRole(UserRole.COACH)}
            className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${role === UserRole.COACH ? 'bg-white text-violet-700 shadow-lg' : 'text-white hover:bg-white/20'}`}
          >
            Koç
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-4 py-3 border border-slate-300/50 placeholder-slate-500 text-slate-900 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
                placeholder="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-4 py-3 border border-slate-300/50 placeholder-slate-500 text-slate-900 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          
          {error && <p className="text-sm text-amber-300 text-center font-medium">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-transform transform hover:scale-105 shadow-lg"
            >
              Giriş Yap
            </button>
          </div>
        </form>
        
        {role === UserRole.COACH && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowCoachRegistration(true)}
              className="text-violet-200 hover:text-white text-sm underline transition-colors"
            >
              Koç hesabı oluştur
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default LoginPage;