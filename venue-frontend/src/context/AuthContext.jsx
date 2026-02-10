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
    


    if (storedUser && storedUser !== "undefined" && token) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from local storage", error);
        localStorage.removeItem('venue_user');
      }
    } else {

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

      // Handle connection errors silently
      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error.message);
        // Don't show toast to user, just log it
      });

      return () => {
        socket.off('waitlist:added');
        socket.off('waitlist:promoted');
        socket.off('connect_error');
        socket.disconnect();
      };
    }
  }, [user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data?.data || response.data || {};
    const { user, token } = data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('venue_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password, role = 'USER') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const data = response.data?.data || response.data || {};
    const { user, token } = data;
    
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

  const toggleFavorite = async (itemId, itemType) => {
    if (!user) return; // Should handle auth check in UI
    try {
        const response = await api.post('/users/favorites', { itemId, itemType });
        const data = response.data?.data || response.data || {};
        const updatedFavorites = data.favorites || [];
        
        const updatedUser = { ...user, favorites: updatedFavorites };
        setUser(updatedUser);
        localStorage.setItem('venue_user', JSON.stringify(updatedUser)); // Persist
        
        const action = data.action;
        showToast(action === 'added' ? 'Added to favorites' : 'Removed from favorites', 'success');
        return true;
    } catch (error) {
        console.error("Favorite toggle failed", error);
        showToast(error.response?.data?.message || 'Failed to update favorites', 'error');
        return false;
    }
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('venue_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, toggleFavorite, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
