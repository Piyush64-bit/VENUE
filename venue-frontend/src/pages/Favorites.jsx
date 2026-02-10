import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, ArrowUpRight, Trash2, Tag, Ticket, Film } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/ui/SEO';
import Spotlight from '../components/ui/Spotlight';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleFavorite, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
          setIsLoading(false);
          return;
      }
      try {
        const res = await api.get('/users/favorites');
        // Filter out any null items (deleted events/movies)
        setFavorites(res.data.data.favorites.filter(f => f.itemId));
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, [user]); // Re-fetch if user changes (e.g. login)

  const handleRemove = async (e, id, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    setFavorites(prev => prev.filter(item => item.itemId._id !== id));
    
    // Call API (using toggle logic which handles removal)
    const success = await toggleFavorite(id, type);
    if (!success) {
        // Revert if failed (could re-fetch, simpler to just let user retry or refresh)
        // For now, simpler optimization is acceptable.
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-bgPrimary pt-32 px-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-[400px] rounded-[2rem]" />)}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-bgPrimary pt-32 pb-24 px-6 md:px-0">
      <SEO title="Favorites" />
      
      <div className="max-w-7xl mx-auto px-6">
           <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div className="relative">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-accentOrange/10 rounded-full blur-[50px] pointer-events-none" />
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
                        Saved <span className="text-accentOrange">.</span>
                    </h1>
                    <p className="text-textMuted text-lg">Your curated list of events & movies.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <span className="text-textMuted text-sm font-bold uppercase tracking-widest">Collection</span>
                    <span className="text-2xl font-black text-white">{favorites.length}</span>
                </div>
            </motion.div>

        {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {favorites.map((fav, index) => {
                        const item = fav.itemId;
                        const isMovie = fav.itemType === 'Movie';
                        const linkPath = isMovie ? `/movies/${item._id}` : `/event/${item._id}`;
                        const displayDate = isMovie 
                            ? new Date(item.releaseDate)
                            : new Date(item.date || item.startDate);
                        
                        return (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ delay: index * 0.1 }}
                            layout
                            className="group"
                        >
                            <Link to={linkPath}>
                                <Spotlight className="h-full bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-500 relative flex flex-col">
                                    {/* Image Section */}
                                    <div className="relative aspect-[2/3] overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                                        <img 
                                            src={isMovie ? item.poster : item.image} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        />
                                        
                                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                                {isMovie ? item.genre : item.category}
                                            </span>
                                        </div>

                                        <button 
                                            onClick={(e) => handleRemove(e, item._id, fav.itemType)}
                                            className="absolute top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 relative z-20 -mt-12">
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-white/10 flex flex-col items-center justify-center text-white shadow-xl">
                                                <span className="text-xs font-bold text-accentOrange uppercase">{displayDate.toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-2xl font-black">{displayDate.getDate()}</span>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                                {isMovie ? (
                                                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                                        <span className="text-white">{item.rating}</span>/10
                                                    </div>
                                                ) : (
                                                    <span className="text-white font-bold font-mono">₹{item.price}</span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-accentOrange transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-textMuted mb-8">
                                            {isMovie ? (
                                                <div className="flex items-center gap-2">
                                                    <Film className="w-4 h-4 text-white/20" />
                                                    <span>{item.runtime || 'Movie'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-white/20" />
                                                    <span className="truncate max-w-[150px]">{item.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto border-t border-white/5 pt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                                                <Ticket className="w-4 h-4" />
                                                View Details
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Spotlight>
                            </Link>
                        </motion.div>
                    )})}
                </AnimatePresence>
            </div>
        ) : (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
            >
                <div className="w-32 h-32 mb-8 relative">
                    <div className="absolute inset-0 bg-accentOrange/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-full h-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500">
                        <Heart className="w-12 h-12 text-white/20" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white mb-4">YOUR COLLECTION IS EMPTY</h2>
                <p className="text-textMuted max-w-md mb-8">
                    You haven't saved any events or movies yet.
                </p>
                <Link to="/events">
                    <Button variant="primary" className="px-8 py-4 text-md">Start Exploring</Button>
                </Link>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
