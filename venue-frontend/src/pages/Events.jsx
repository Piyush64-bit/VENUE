import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Grid, List, MapPin, ArrowUpRight } from 'lucide-react';


import api from '../api/axios';
import { Skeleton } from '../components/ui/Skeleton';
import SEO from '../components/ui/SEO';
import NoiseOverlay from '../components/visuals/NoiseOverlay';

import VelocityText from '../components/visuals/VelocityText';
import TextReveal from '../components/visuals/TextReveal';
import EventDetailsModal from '../components/ui/EventDetailsModal';

const CATEGORIES = ['All', 'Music', 'Comedy', 'Workshops', 'Theatre', 'Meetups'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Mouse position for floating reveal
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



  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events?limit=100');
      return response.data?.data?.events || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const processedEvents = useMemo(() => {
    let result = [...events];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(lowerTerm) || 
        e.description.toLowerCase().includes(lowerTerm) ||
        e.location?.toLowerCase().includes(lowerTerm)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'date_desc') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    return result.slice(0, 11);
  }, [events, searchTerm, selectedCategory, sortBy]);

  const { scrollY } = useScroll();
  const titleScale = useTransform(scrollY, [0, 200], [1, 0.9]);
  const titleOpacity = useTransform(scrollY, [0, 200], [1, 0.5]);
  const searchWidth = useTransform(scrollY, [0, 200], ["100%", "120%"]);

  return (
    <div className="min-h-screen bg-bgPrimary pb-32 text-textPrimary selection:bg-accentOrange selection:text-white relative cursor-default overflow-x-hidden">
      <SEO title="Explore Events" description="Find your next experience in Jaipur." />
      <NoiseOverlay />


      <AnimatePresence>
        {viewMode === 'list' && hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ x: mouseX, y: mouseY, top: -150, left: 20 }}
            className="fixed z-50 pointer-events-none w-[300px] h-[200px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl hidden md:block"
          >
            <img src={hoveredEvent.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
               {new Date(hoveredEvent.date).toLocaleDateString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-32 px-6 max-w-[1400px] mx-auto z-20 relative mb-16">
        <motion.div style={{ scale: titleScale, opacity: titleOpacity }} className="origin-left">
          <div className="text-[11vw] md:text-[7vw] leading-[0.85] font-black tracking-tighter text-white uppercase mb-8 flex flex-col items-start">
             <TextReveal delay={0.1}>The</TextReveal>
             <TextReveal delay={0.3} className="text-accentOrange">Collection</TextReveal>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-end gap-6 border-t border-white/10 pt-8">
             <motion.div style={{ width: searchWidth }} className="w-full md:w-auto flex-grow max-w-2xl relative group origin-left">
                 <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 w-6 h-6 group-focus-within:text-accentOrange transition-colors" />
                 <input 
                   type="text" 
                   placeholder="SEARCH THE ARCHIVE..." 
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
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-4xl font-black uppercase transition-colors px-4 ${
                      selectedCategory === cat 
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
               {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[400px] rounded-sm" />)}
            </div>
         ) : (
            <AnimatePresence mode="popLayout">
               {processedEvents.length > 0 ? (
                 <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-0'}>
                    {processedEvents.map((event, index) => {
                        const isHero = viewMode === 'grid' && index === 0;
                        const colSpanClass = isHero ? 'md:col-span-2 lg:col-span-2' : 'col-span-1';

                        if (viewMode === 'list') {
                            return (
                                <motion.div 
                                    key={event._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative border-b border-white/10 py-8 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors px-4"
                                    onMouseEnter={() => setHoveredEvent(event)}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                    onClick={() => setSelectedEvent(event)}
                                >
                                    <div className="flex items-center gap-8 md:w-1/2">
                                        <span className="text-textMuted font-mono text-sm">{(index + 1).toString().padStart(2, '0')}</span>
                                        <div>
                                            <h3 className="text-3xl font-bold text-white group-hover:text-accentOrange transition-colors uppercase tracking-tight">{event.title}</h3>
                                            <p className="text-textMuted hidden md:block">{event.category} • {event.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <span className="text-white font-bold text-xl">₹{event.price}</span>
                                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }

                        // Hero Card with 3D Tilt
                        if (isHero) {
                            return (
                                <motion.div
                                    key={event._id}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                    className={`group relative bg-bgCard overflow-hidden rounded-3xl ${colSpanClass} aspect-[16/9] md:aspect-[2/1] cursor-pointer`}
                                    onClick={() => setSelectedEvent(event)}
                                >
                                    <div className="w-full h-full">
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute inset-0 p-12 flex flex-col justify-end">
                                        <div className="mb-auto">
                                            <span className="px-4 py-2 bg-accentOrange text-white text-sm font-bold uppercase rounded-full tracking-wider">Featured Event</span>
                                        </div>
                                         <h3 className="text-6xl font-black text-white uppercase leading-none mb-4 tracking-tight drop-shadow-xl">{event.title}</h3>
                                         <p className="text-white/90 text-xl max-w-2xl font-medium">{event.description}</p>
                                    </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div 
                                key={event._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className={`group relative bg-bgCard overflow-hidden rounded-3xl ${colSpanClass} aspect-[4/5] cursor-pointer`}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                
                                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase rounded-full border border-white/10">{event.category}</span>
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-accentOrange font-medium mb-1 tracking-wider uppercase text-sm">
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white uppercase leading-none mb-3">{event.title}</h3>
                                        <p className="text-white/60 text-sm line-clamp-1">{event.location}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                 </div>
               ) : (
                 <div className="text-center py-40">
                    <h3 className="text-4xl font-black text-white uppercase opacity-20">No Results</h3>
                 </div>
               )}
            </AnimatePresence>
         )}
      </div>
      <EventDetailsModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        item={selectedEvent} 
        type="event" 
      />
    </div>
  );
};

export default Events;
