import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from '../socket/socket';

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleWaitlistAdded = (data) => {
      addToast(`Added to waitlist for ${data.eventName || 'event'}`, 'info');
    };

    const handleWaitlistPromoted = (data) => {
      addToast(`Promoted! You can now book ${data.eventName || 'event'}`, 'success');
    };

    socket.on('waitlist:added', handleWaitlistAdded);
    socket.on('waitlist:promoted', handleWaitlistPromoted);

    // Also allow local events to trigger toasts (helpers)
    const handleLocalToast = (e) => {
      addToast(e.detail.message, e.detail.type);
    };
    window.addEventListener('venue-toast', handleLocalToast);

    return () => {
      socket.off('waitlist:added', handleWaitlistAdded);
      socket.off('waitlist:promoted', handleWaitlistPromoted);
      window.removeEventListener('venue-toast', handleLocalToast);
    };
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto pl-4 pr-6 py-4 bg-bgCard border border-borderSubtle rounded-lg shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-accentOrange'}`} />
            <p className="text-sm font-medium text-textPrimary leading-tight">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper to trigger toast locally
export const showToast = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('venue-toast', { detail: { message, type } }));
};

export default NotificationToast;
