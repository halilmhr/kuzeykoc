
import React, { useState, createContext, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CoachDashboard from './pages/CoachDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentDetailPage from './pages/StudentDetailPage';
import { User, UserRole } from './types';
import supabaseApi from './services/supabaseApi';
import { ThemeProvider } from './contexts/ThemeContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<User | null> => {
    try {
      const foundUser = await supabaseApi.authenticateUser(email, password, role);
      if (foundUser) {
        setUser(foundUser);
        return foundUser;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const authContextValue = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return (
      <AuthContext.Provider value={authContextValue}>
        <div className="min-h-screen">
          <HashRouter>
            <Routes>
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === UserRole.COACH ? '/coach' : '/student'} />} />
              
              <Route path="/coach" element={user?.role === UserRole.COACH ? <CoachDashboard /> : <Navigate to="/login" />} />
              <Route path="/coach/student/:studentId" element={user?.role === UserRole.COACH ? <StudentDetailPage /> : <Navigate to="/login" />} />
              
              <Route path="/student" element={user?.role === UserRole.STUDENT ? <StudentDashboard /> : <Navigate to="/login" />} />
              
              <Route path="*" element={<Navigate to={user ? (user.role === UserRole.COACH ? '/coach' : '/student') : '/login'} />} />
            </Routes>
          </HashRouter>
        </div>
      </AuthContext.Provider>
  );
};

export default App;
