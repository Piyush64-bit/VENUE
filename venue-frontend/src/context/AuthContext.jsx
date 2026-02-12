import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { socket } from '../socket/socket';
import { showToast } from '../components/NotificationToast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      } catch (error) {
        // If 401 or other error, user is not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Socket management
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user.id);

      socket.on('waitlist:added', (data) => {
        showToast(`Added to waitlist for ${data.slotTime}`, 'info');
      });

      socket.on('waitlist:promoted', (data) => {
         showToast(`Good news! You've been promoted off the waitlist!`, 'success');
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error.message);
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
    const { user } = data;
    
    setUser(user);
    return user;
  };

  const register = async (name, email, password, role = 'USER') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const data = response.data?.data || response.data || {};
    const { user } = data;
    
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      // socket.disconnect() is handled by the useEffect cleanup when user becomes null
    }
  };

  const toggleFavorite = async (itemId, itemType) => {
    if (!user) return; 
    try {
        const response = await api.post('/users/favorites', { itemId, itemType });
        const data = response.data?.data || response.data || {};
        const updatedFavorites = data.favorites || [];
        
        const updatedUser = { ...user, favorites: updatedFavorites };
        setUser(updatedUser);
        
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
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, toggleFavorite, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
