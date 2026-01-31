import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { socket } from '../socket/socket';
import { showToast } from '../components/NotificationToast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistence
    const storedUser = localStorage.getItem('venue_user');
    const token = localStorage.getItem('token');
    
    console.log('AuthContext: Restoring state...', { storedUser, token });

    if (storedUser && storedUser !== "undefined" && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthContext: User parsed successfully', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from local storage", error);
        localStorage.removeItem('venue_user');
      }
    } else {
        console.log('AuthContext: No valid session found');
    }
    setIsLoading(false);
  }, []);

  // Socket management
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user.id); // Assuming user object has id

      socket.on('waitlist:added', (data) => {
        showToast(`Added to waitlist for ${data.slotTime}`, 'info');
      });

      socket.on('waitlist:promoted', (data) => {
         showToast(`Good news! You've been promoted off the waitlist!`, 'success');
      });

      return () => {
        socket.off('waitlist:added');
        socket.off('waitlist:promoted');
        socket.disconnect();
      };
    }
  }, [user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('venue_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('venue_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('venue_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
