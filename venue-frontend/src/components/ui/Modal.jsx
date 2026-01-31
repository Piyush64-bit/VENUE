import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-bgCard border border-borderSubtle rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="px-6 py-6 border-b border-borderSubtle flex justify-between items-center">
                <h3 className="text-xl font-semibold text-textPrimary">{title}</h3>
                <button 
                  onClick={onClose}
                  className="text-textMuted hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {children}
              </div>

              {footer && (
                <div className="px-6 py-4 bg-bgSecondary border-t border-borderSubtle flex justify-end space-x-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
