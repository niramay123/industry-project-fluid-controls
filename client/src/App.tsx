import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import SupervisorDashboard from './components/SupervisorDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';
import apiClient from './apiClient';
// --- NEW: Import Socket.IO client, Sonner for toast notifications, and the NotificationBell component ---
import { io, Socket } from "socket.io-client";
import { Toaster, toast } from 'sonner';
import NotificationBell from './components/NotificationBell';

export interface User {
  _id: string;
  name: string;
  email: string;
  role:  'supervisor' | 'operator';
  skills?: string[];
  availability?: 'available' | 'busy' | 'offline';
}

// The main App logic is wrapped in a component to correctly use hooks like useNavigate
function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // This effect runs once on initial load to check for an existing session
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        // Set the token for all subsequent apiClient requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/user/my-profile');
        if (response.data.user) {
          setCurrentUser(response.data.user);
        } else {
          localStorage.clear();
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, []);

  // --- NEW: This effect manages the WebSocket connection ---
  useEffect(() => {
    // Only connect if there is a logged-in user
    if (currentUser) {
      // Establish connection to the backend socket server
      //const socket = io("http://localhost:5000"); // Ensure this matches your backend URL
// client/src/App.tsx
// ...
const socket = io(import.meta.env.VITE_API_URL);
// ...
      socket.on('connect', () => {
        console.log('Socket.IO connected:', socket.id);
        const token = localStorage.getItem('authToken');
        // Authenticate the socket connection by sending the JWT
        if (token) {
          socket.emit('connectUser', token);
        }
      });

      // Set up a listener for the 'notification' event from the server
      socket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        // Show a toast notification to the user
        toast.info(notification.message, {
          description: `Task: ${notification.taskId?.title || ''}`,
          duration: 5000,
        });
      });

      // The cleanup function runs when the user logs out or the app closes
      return () => {
        console.log('Disconnecting Socket.IO...');
        socket.disconnect();
      };
    }
  }, [currentUser]); // This effect re-runs whenever the currentUser changes (login/logout)


  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/user/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed.';
      return { success: false, message: errorMessage };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.clear();
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login'); // Redirect to login page after logout
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* --- NEW: Add the Toaster component to render toast notifications --- */}
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={!currentUser ? <LoginForm onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <RegisterForm /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!currentUser ? <ForgotPasswordForm /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!currentUser ? <ResetPasswordForm /> : <Navigate to="/" />} />
        <Route path="/*" element={currentUser ? <MainLayout user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

function MainLayout({ user, onLogout }: { user: User, onLogout: () => void }) {
  const renderDashboard = () => {
    switch (user.role) {
      case 'supervisor': return <SupervisorDashboard user={user} />;
      case 'operator': return <OperatorDashboard user={user} />;
      default: return <div>Unknown role.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      
      {/* Left Section: Logo + Title */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12  rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            src="/fc-logo.jpg"  // use public folder path
            alt="Fluid Controls Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Effective Information Flow System</h1>
      </div>

      {/* Right Section: User Info */}
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} className="text-slate-600 hover:text-slate-900">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}

// A final wrapper to ensure useNavigate can be used correctly.
export default function App() {
  // Note: Your <BrowserRouter> should be in your `main.tsx` file, wrapping this component.
  return <AppContent />;
}
