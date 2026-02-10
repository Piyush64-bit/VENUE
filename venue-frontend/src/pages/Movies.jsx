import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Grid, List, Play, Star, ArrowUpRight } from 'lucide-react';


import api from '../api/axios';
import { Skeleton } from '../components/ui/Skeleton';
import SEO from '../components/ui/SEO';
import NoiseOverlay from '../components/visuals/NoiseOverlay';

import VelocityText from '../components/visuals/VelocityText';
import TextReveal from '../components/visuals/TextReveal';
import EventDetailsModal from '../components/ui/EventDetailsModal';
import EventCard from '../components/EventCard';

const GENRES = ['All', 'Sci-Fi', 'Biography', 'Action', 'Drama', 'Horror', 'Romance'];
const SORT_OPTIONS = [
  { label: 'Newest Releases', value: 'date_desc' },
  { label: 'Highest Rated', value: 'rating_desc' },
];

const Movies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);



  const { data: movies = [], isLoading, isError } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const response = await api.get('/movies');
      return response.data?.data?.movies || response.data?.movies || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const processedMovies = useMemo(() => {
    let result = [...movies];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(lowerTerm) || 
        m.description.toLowerCase().includes(lowerTerm)
      );
    }
    if (selectedGenre !== 'All') {
      result = result.filter(m => m.genre?.toLowerCase() === selectedGenre.toLowerCase());
    }
    if (sortBy === 'rating_desc') result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'date_desc') result.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    return result.slice(0, 11);
  }, [movies, searchTerm, selectedGenre, sortBy]);

  const { scrollY } = useScroll();
  const titleScale = useTransform(scrollY, [0, 200], [1, 0.9]);
  const titleOpacity = useTransform(scrollY, [0, 200], [1, 0.5]);
  const searchWidth = useTransform(scrollY, [0, 200], ["100%", "120%"]);

  return (
    <div className="min-h-screen bg-bgPrimary pb-32 text-textPrimary selection:bg-accentOrange selection:text-white relative cursor-default overflow-x-hidden">
      <SEO title="Now Showing" description="Discover the latest movies." />
      <NoiseOverlay />


      <AnimatePresence>
        {viewMode === 'list' && hoveredMovie && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ x: mouseX, y: mouseY, top: -150, left: 20, willChange: "transform" }}
            className="fixed z-50 pointer-events-none w-[200px] h-[300px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl hidden md:block"
          >
            <img src={hoveredMovie.poster} alt="" width="200" height="300" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
               {hoveredMovie.rating} / 5
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20 px-6 max-w-[1400px] mx-auto z-20 relative mb-16">
        <motion.div style={{ scale: titleScale, opacity: titleOpacity }} className="origin-left">
           <div className="text-[8vw] md:text-[5vw] leading-[0.85] font-black tracking-tighter text-white uppercase mb-8 flex flex-col items-start">
             <TextReveal delay={0.1}>Now</TextReveal>
             <TextReveal delay={0.3} className="text-accentOrange">Showing</TextReveal>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-end gap-6 border-t border-white/10 pt-8">
             <motion.div style={{ width: searchWidth }} className="w-full md:w-auto flex-grow max-w-2xl relative group origin-left">
                 <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 w-6 h-6 group-focus-within:text-accentOrange transition-colors" />
                 <input 
                   type="text" 
                   placeholder="FIND YOUR FILM..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full bg-transparent border-b border-white/20 py-4 pl-10 pr-4 text-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-accentOrange transition-all font-bold uppercase tracking-wide"
                 />
             </motion.div>

             <div className="flex items-center gap-4">
                 <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                    <button onClick={() => setViewMode('grid')} className={`p-3 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                      <Grid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-3 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                      <List className="w-5 h-5" />
                    </button>
                 </div>
             </div>
        </div>

        <div className="mt-12 overflow-hidden border-y border-white/5 py-4">
             <VelocityText baseVelocity={5} className="gap-8">
                {GENRES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedGenre(cat)}
                    className={`text-4xl font-black uppercase transition-colors px-4 ${
                      selectedGenre === cat 
                        ? 'text-accentOrange' 
                        : 'text-white/20 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
            </VelocityText>
        </div>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto min-h-[50vh]">
         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-sm" />)}
            </div>
         ) : (
            <AnimatePresence mode="popLayout">
               {processedMovies.length > 0 ? (
                 <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-0'}>
                    {processedMovies.map((movie, index) => {
                        const isHero = viewMode === 'grid' && index === 0;
                        const colSpanClass = isHero ? 'md:col-span-2 lg:col-span-2' : 'col-span-1';

                        // Normalize movie data for EventCard
                        const normalizedMovie = {
                            ...movie,
                            image: movie.poster,
                            category: movie.genre,
                            startDate: movie.releaseDate,
                            location: null // Movies don't have location, we show runtime
                        };

                        if (viewMode === 'list') {
                            return (
                                <motion.div 
                                    key={movie._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative border-b border-white/10 py-8 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors px-4"
                                    onMouseEnter={() => setHoveredMovie(movie)}
                                    onMouseLeave={() => setHoveredMovie(null)}
                                    onClick={() => setSelectedMovie(movie)}
                                >
                                    <div className="flex items-center gap-8 md:w-1/2">
                                        <span className="text-textMuted font-mono text-sm">{(index + 1).toString().padStart(2, '0')}</span>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white group-hover:text-accentOrange transition-colors uppercase tracking-tight">{movie.title}</h3>
                                            <p className="text-textMuted hidden md:block">{movie.genre} • {movie.runtime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-1 text-accentOrange">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold text-xl">{movie.rating}</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }

                        // Hero Card with Premium Design (Matching Events.jsx)
                        if (isHero) {
                            return (
                                <motion.div
                                    key={movie._id}
                                    whileHover={{ y: -8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={`group relative bg-bgCard overflow-hidden rounded-3xl ${colSpanClass} aspect-[16/9] md:aspect-[2/1] cursor-pointer border border-borderSubtle hover:border-accentOrange/40 hover:shadow-2xl hover:shadow-accentOrange/10 transition-all duration-500`}
                                    onClick={() => setSelectedMovie(movie)}
                                >
                                    <div className="w-full h-full flex flex-col md:flex-row">
                                        {/* Image Section (60%) */}
                                        <div className="md:w-3/5 h-2/3 md:h-full relative overflow-hidden">
                                            <motion.img 
                                                src={movie.poster} 
                                                alt={movie.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 object-top"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                                            
                                            <div className="absolute top-4 left-4">
                                                <span className="px-4 py-1.5 bg-accentOrange text-white text-xs font-bold uppercase rounded-full tracking-wider shadow-lg">Now Showing</span>
                                            </div>
                                        </div>

                                        {/* Content Section (40%) */}
                                        <div className="md:w-2/5 p-6 flex flex-col justify-center bg-bgCard border-l border-white/5 relative overflow-hidden">
                                            {/* Glow Effect */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-accentOrange/5 rounded-full blur-3xl pointer-events-none" />

                                            <div className="mb-3 flex items-center gap-2">
                                                 <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-accentOrange uppercase tracking-wide">
                                                    {movie.genre}
                                                 </span>
                                                 <div className="flex items-center gap-1 text-accentOrange text-xs font-bold">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{movie.rating}</span>
                                                 </div>
                                            </div>

                                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase leading-none mb-3 group-hover:text-accentOrange transition-colors line-clamp-2">
                                                {movie.title}
                                            </h3>
                                            
                                            <p className="text-textMuted text-sm line-clamp-2 mb-4 leading-relaxed">
                                                {movie.description}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-textMuted uppercase tracking-wider">Tickets from</span>
                                                    <span className="text-xl font-bold text-white">₹{movie.price || 250}</span>
                                                </div>
                                                
                                                <motion.div 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="w-10 h-10 rounded-full bg-accentOrange flex items-center justify-center text-white shadow-lg shadow-accentOrange/20"
                                                >
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <div key={movie._id} className={`${colSpanClass} h-full`}>
                                <EventCard event={normalizedMovie} type="movie" />
                            </div>
                        );
                    })}
                 </div>
               ) : (
                 <div className="text-center py-40">
                    <h3 className="text-4xl font-black text-white uppercase opacity-20">No Films Found</h3>
                 </div>
               )}
            </AnimatePresence>
         )}
      </div>
      <EventDetailsModal 
        isOpen={!!selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        item={selectedMovie} 
        type="movie" 
      />
    </div>
  );
};

export default Movies;
