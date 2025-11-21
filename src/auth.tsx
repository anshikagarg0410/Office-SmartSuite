import * as React from 'react';
import { api, TOKEN_KEY } from './api'; // Import the new API client
import { useNavigate } from 'react-router-dom';

// Define the structure of the user data returned by the backend
interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to decode JWT (simplified, basic data extraction)
function decodeJwt(token: string): User | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return { id: decoded.id, email: decoded.email };
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  // 1. Check for token on mount and set user state
  React.useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        localStorage.removeItem(TOKEN_KEY); // Remove invalid token
        navigate('/login');
      }
    }
    setLoading(false);
  }, [navigate]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password });
    
    const { token, user: userData } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const signup = async (email: string, password: string) => {
    const response = await api.post('/auth/signup', { email, password });
    
    const { token, user: userData } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const logout = async () => {
    // Send request to clear server session/acknowledge logout
    await api.post('/auth/signout'); 
    // Clear local storage and state
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}