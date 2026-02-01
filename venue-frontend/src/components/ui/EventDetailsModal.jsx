import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Star, Heart, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const EventDetailsModal = ({ isOpen, onClose, item, type = 'event' }) => {
  const navigate = useNavigate();
  const { user, toggleFavorite } = useAuth();
  
  const isFavorited = user?.favorites?.some(fav => fav.itemId === item._id);

  const handleFavorite = (e) => {
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }
      toggleFavorite(item._id, type === 'movie' ? 'Movie' : 'Event');
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!item) return null;

  const handleBook = () => {
    if (type === 'event') {
        navigate(`/event/${item._id}/slots`);
    } else {
        // Assuming movies might share similar structure or have their own flow
        navigate(`/movie/${item._id}`); // Or handle movie booking if different
    }
    // onClose(); // Optional: keep open or close? Usually close if navigating away.
  };

  const isMovie = type === 'movie';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative w-full max-w-5xl bg-bgCard/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
             {/* Close Button */}
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/80 hover:text-white transition-colors backdrop-blur-md border border-white/10"
             >
                <X className="w-5 h-5" />
             </button>

            {/* Left Side: Image */}
            <div className="w-full md:w-5/12 h-64 md:h-auto relative group">
               <img 
                 src={isMovie ? item.poster : item.image} 
                 alt={item.title} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-bgCard via-transparent to-transparent md:bg-gradient-to-r" />
               
               {/* Image Overlay Info (Mobile mostly) */}
               <div className="absolute bottom-4 left-4 md:hidden">
                  <span className="px-3 py-1 bg-accentOrange text-white text-xs font-bold uppercase rounded-full">
                    {isMovie ? item.genre : item.category}
                  </span>
               </div>
            </div>

            {/* Right Side: Content */}
            <div className="w-full md:w-7/12 p-5 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                
                <div className="mb-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="hidden md:inline-block px-3 py-1 bg-white/5 border border-white/10 text-accentOrange text-xs font-bold uppercase rounded-full tracking-wider">
                           {isMovie ? 'Now Showing' : 'Featured Event'}
                        </span>
                        {isMovie && (
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-white font-bold text-sm">{item.rating}/10</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-[0.9] text-balance mb-6 tracking-tight">
                        {item.title}
                    </h2>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-textMuted text-sm mb-8 font-medium">
                        {isMovie ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-accentOrange" />
                                    <span>{item.runtime || '2h 15m'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-accentOrange" />
                                    <span>{new Date(item.releaseDate).getFullYear()}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-accentOrange" />
                                    <span>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-accentOrange" />
                                    <span>{item.location}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <p className="text-white/80 text-lg leading-relaxed mb-8">
                        {item.description}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 border-t border-white/10 mt-8 flex items-center gap-4">
                    <Button 
                        variant="primary" 
                        size="lg" 
                        className="flex-1 text-lg group"
                        onClick={handleBook}
                    >
                        <span>Book Now</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <button 
                        onClick={handleFavorite}
                        className={`p-4 rounded-xl border transition-all group ${isFavorited ? 'bg-accentOrange/10 border-accentOrange text-accentOrange' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-accentOrange/50 hover:text-accentOrange'}`}
                    >
                        <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : 'group-hover:fill-accentOrange/20'}`} />
                    </button>
                </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EventDetailsModal;
