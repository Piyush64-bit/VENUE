import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, ArrowUpRight, Trash2, Tag, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/ui/SEO';
import Spotlight from '../components/ui/Spotlight';
import { Button } from '../components/ui/Button';

// Mock Data
const INITIAL_FAVES = [
  { id: 1, title: 'Neon Nights Festival', category: 'Music', date: '2024-03-15', location: 'District 9 Arena', price: '$150', image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=800' },
  { id: 2, title: 'Future Summit 2024', category: 'Tech', date: '2024-04-02', location: 'Convention Ctr', price: '$299', image: 'https://images.unsplash.com/photo-1505373877741-29a4efa39778?auto=format&fit=crop&q=80&w=800' },
  { id: 3, title: 'Abstract Dimensions', category: 'Art', date: '2024-03-20', location: 'Modern Museum', price: '$45', image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=80&w=800' },
  { id: 4, title: 'Underground Comedy', category: 'Comedy', date: '2024-03-10', location: 'The Basement', price: '$25', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=800' },
  { id: 5, title: 'Cosmic Cinema', category: 'Movies', date: '2024-03-12', location: 'Galaxy IMAX', price: '$20', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800' },
];

const Favorites = () => {
  const [favorites, setFavorites] = useState(INITIAL_FAVES);

  const removeFavorite = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

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
                    <p className="text-textMuted text-lg">Your curated list of events.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                    <span className="text-textMuted text-sm font-bold uppercase tracking-widest">Collection</span>
                    <span className="text-2xl font-black text-white">{favorites.length}</span>
                </div>
            </motion.div>

        {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {favorites.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ delay: index * 0.1 }}
                            layout
                            className="group"
                        >
                            <Link to={`/events`}>
                                <Spotlight className="h-full bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-500 relative flex flex-col">
                                    {/* Image Section */}
                                    <div className="relative h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0" />
                                        
                                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                                {item.category}
                                            </span>
                                        </div>

                                        <button 
                                            onClick={(e) => removeFavorite(e, item.id)}
                                            className="absolute top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 relative z-20 -mt-12">
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-white/10 flex flex-col items-center justify-center text-white shadow-xl">
                                                <span className="text-xs font-bold text-accentOrange uppercase">{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-2xl font-black">{new Date(item.date).getDate()}</span>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                                <span className="text-white font-bold font-mono">{item.price}</span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-accentOrange transition-colors">
                                            {item.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-textMuted mb-8">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-white/20" />
                                                <span className="truncate max-w-[150px]">{item.location}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto border-t border-white/5 pt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                                                <Ticket className="w-4 h-4" />
                                                Get Tickets
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Spotlight>
                            </Link>
                        </motion.div>
                    ))}
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
                    You haven't saved any events yet. Explore the lineup and build your personal agenda.
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
