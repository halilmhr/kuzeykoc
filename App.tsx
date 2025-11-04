
import React, { useState, createContext, useMemo, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import CoachDashboard from './pages/CoachDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentDetailPage from './pages/StudentDetailPage';
import { User, UserRole } from './types';
import supabaseApi from './services/supabaseApi';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationService } from './services/notificationService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user session on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        
        // Request notification permission if user is a coach
        if (parsedUser.role === UserRole.COACH) {
          setTimeout(() => {
            NotificationService.requestPermission().then(granted => {
              if (granted) {
                console.log('✅ Bildirim izni verildi');
              } else {
                console.log('❌ Bildirim izni reddedildi');
              }
            });
          }, 2000); // 2 saniye bekle
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<User | null> => {
    try {
      const foundUser = await supabaseApi.authenticateUser(email, password, role);
      if (foundUser) {
        setUser(foundUser);
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        
        // Request notification permission if user is a coach
        if (foundUser.role === UserRole.COACH) {
          setTimeout(() => {
            NotificationService.requestPermission().then(granted => {
              if (granted) {
                console.log('✅ Bildirim izni verildi');
              }
            });
          }, 1000);
        }
        
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
    // Remove user from localStorage
    localStorage.removeItem('currentUser');
  }, []);

  const authContextValue = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  // Show loading spinner while checking for saved session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
