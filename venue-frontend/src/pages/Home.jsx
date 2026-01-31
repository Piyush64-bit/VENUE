import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Search, ArrowUpRight, Ticket, User, Sparkles, X } from 'lucide-react';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import { Skeleton } from '../components/ui/Skeleton';
import SEO from '../components/ui/SEO';
import { useAuth } from '../context/AuthContext';
import Spotlight from '../components/ui/Spotlight';

// Visual Categories (No generic icons)
const CATEGORIES = [
  { id: 'music', name: 'Live Music', image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&q=80&w=600', col: 'col-span-2' },
  { id: 'workshops', name: 'Workshops', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600', col: 'col-span-1' },
  { id: 'comedy', name: 'Comedy', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=600', col: 'col-span-1' },
  { id: 'theatre', name: 'Theatre', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?auto=format&fit=crop&q=80&w=600', col: 'col-span-2' },
];

const CURATED_COLLECTIONS = [
  { id: 1, title: 'Weekend Vibes', subtitle: 'Events to unwind this Saturday & Sunday', image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97d848?auto=format&fit=crop&q=80&w=800' },
  { id: 2, title: 'Date Night Ideas', subtitle: 'Romantic spots and acoustic sets', image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&q=80&w=800' },
  { id: 3, title: 'Hidden Gems', subtitle: 'Underground venues you missed', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Staggered Text Animation
const letterContainerVariants = {
  hidden: { transition: { staggerChildren: 0.05 } },
  visible: { transition: { staggerChildren: 0.05 } }
};

const letterVariants = {
  hidden: { y: 100, opacity: 0, rotate: 10 },
  visible: { 
    y: 0, 
    opacity: 1, 
    rotate: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 } 
  }
};

const AnimatedText = ({ text, className }) => {
  return (
    <motion.div 
      variants={letterContainerVariants}
      initial="hidden"
      animate="visible"
      className={`overflow-hidden flex flex-wrap ${className}`}
    >
      {text.split(" ").map((word, i) => (
        <div key={i} className="flex overflow-hidden mr-4 pb-2">
            {word.split("").map((char, j) => (
                <motion.span key={j} variants={letterVariants} className="inline-block origin-bottom-left">
                    <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            repeatType: "loop", 
                            ease: "easeInOut", 
                            delay: (i * 0.2) + (j * 0.05) // Staggered wave based on word/char index
                        }}
                        className="inline-block"
                    >
                        {char}
                    </motion.span>
                </motion.span>
            ))}
        </div>
      ))}
    </motion.div>
  )
}

const Home = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // Filter state
  const { scrollY } = useScroll();


  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data.data.events;
    },
    staleTime: 1000 * 60 * 5, 
  });

  // Dynamic Greeting based on time
  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  };

  // Randomize Featured Events (Memoized to stay stable on re-renders)
  const featuredEvents = useMemo(() => {
     if (events.length === 0) return [];
     // Simple shuffle
     return [...events].sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [events]);

  const upcomingEvents = events.slice(4); // Use rest for grid? or all? Let's use all for grid.
  
  const filteredUpcoming = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    // Lowercase comparison for robust category matching
    const matchesCategory = activeCategory 
        ? event.category?.toLowerCase() === activeCategory.toLowerCase() || event.title.toLowerCase().includes(activeCategory.toLowerCase()) 
        : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-bgPrimary pb-32 selection:bg-accentOrange selection:text-white relative bg-gradient-to-b from-bgPrimary via-[#0F0F16] to-[#000000]">
      <SEO title="Home" description="Discovery" />

      {/* Mobile Animated Aurora Background */}
      <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accentOrange/20 blur-[100px] rounded-full pointer-events-none md:hidden z-0" 
      />
      <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2], x: [-20, 20, -20] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-32 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none md:hidden z-0" 
      />

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
             {/* Glass Status Pill Greeting */}
             <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 inline-flex px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md items-center gap-2"
             >
                <div className="w-1.5 h-1.5 rounded-full bg-accentOrange animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                   {getGreeting()} • {user?.name?.split(' ')[0]}
                </span>
             </motion.div>
             
             <div className="text-[15vw] md:text-[8vw] leading-[0.85] font-black tracking-tighter text-white mb-8 drop-shadow-2xl">
                <AnimatedText text="DISCOVER" />
                <span className="text-white/20 select-none block">THE UNSEEN</span>
             </div>
          </motion.div>

          {/* Search Bar - Floating Glass */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col md:flex-row gap-4 max-w-2xl"
          >
            <div className="relative flex-grow group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accentOrange transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Find your vibe..."
                className="w-full bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-full py-4 pl-14 pr-6 focus:outline-none focus:border-accentOrange/50 focus:bg-white/10 hover:border-accentOrange/30 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(242,140,40,0.1)] transition-all duration-300 placeholder:text-white/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Active Category Indicator */}
            {activeCategory && (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-2 bg-accentOrange/20 border border-accentOrange text-accentOrange px-6 py-2 rounded-full cursor-pointer whitespace-nowrap"
                    onClick={() => setActiveCategory(null)}
                >
                    {activeCategory} <X className="w-4 h-4" />
                </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Categories (Clickable) */}
      <section className="px-6 mb-32">
        <div className="max-w-[1400px] mx-auto">
           <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Curated Collections</h2>
              <span className="text-sm text-textMuted hidden md:inline-block">Handpicked for you</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
              {/* Profile / Stats Block */}
              <div className="col-span-1 md:col-span-1 bg-bgCard border border-white/5 rounded-3xl p-8 flex flex-col justify-between group hover:border-accentOrange/20 transition-colors">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-accentOrange/10 flex items-center justify-center text-accentOrange mb-6">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">My Stats</h3>
                    <p className="text-textMuted">You've attended {Math.floor(Math.random() * 5)} events this month.</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 text-white font-medium hover:text-accentOrange transition-colors">
                    View Profile <ArrowUpRight className="w-4 h-4" />
                  </Link>
              </div>

              {/* Large Feature Category (Clickable) */}
              <motion.div 
                whileHover={{ scale: 0.98 }}
                onClick={() => setActiveCategory('Music')}
                className={`col-span-1 md:col-span-2 relative group overflow-hidden rounded-3xl cursor-pointer ${activeCategory === 'Music' ? 'ring-2 ring-accentOrange' : ''}`}
              >
                  <img src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Nightlife" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-8 left-8">
                     <span className="px-3 py-1 bg-accentOrange text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">Trending</span>
                     <h3 className="text-4xl font-bold text-white">Nightlife & Gigs</h3>
                  </div>
              </motion.div>

              {/* Smaller Categories (Clickable) */}
              {CATEGORIES.map((cat, i) => (
                <motion.div 
                    key={cat.id} 
                    whileHover={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`relative group overflow-hidden rounded-3xl cursor-pointer ${i === 0 || i === 3 ? 'md:col-span-2' : 'md:col-span-1'} h-[200px] ${activeCategory === cat.name ? 'ring-2 ring-accentOrange' : ''}`}
                >
                   <img src={cat.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={cat.name} />
                   <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                   <div className="absolute bottom-6 left-6">
                      <h3 className="text-2xl font-bold text-white">{cat.name}</h3>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Featured Events (Randomized) */}
      <section className="mb-32">
        <div className="max-w-[1400px] mx-auto px-6">
           <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 tracking-tight">
             This Week's <span className="text-textMuted">Headliners</span>
           </h2>
           
           <div className="flex gap-6 overflow-x-auto pb-12 snap-x pr-6 scrollbar-hide">
             {isLoading ? (
               [...Array(3)].map((_, i) => (
                 <Skeleton key={i} className="min-w-[350px] md:min-w-[450px] h-[500px] rounded-3xl" />
               ))
             ) : (
               featuredEvents.map((event) => (
                 <div key={event._id} className="min-w-[350px] md:min-w-[450px] snap-center h-[550px]">
                   <Spotlight className="h-full bg-bgCard border border-white/5 rounded-3xl p-3 hover:border-accentOrange/30 transition-colors group">
                      <div className="relative h-[60%] rounded-2xl overflow-hidden mb-4">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                        {/* Dynamic Selling Fast Badge (Random logic for demo) */}
                        {Math.random() > 0.5 && (
                           <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg animate-pulse">
                              🔥 Selling Fast
                           </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                           {new Date(event.date).getDate()} {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </div>
                      </div>
                      <div className="px-2">
                         <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-accentOrange transition-colors">{event.title}</h3>
                         <p className="text-textMuted line-clamp-2">{event.description}</p>
                         <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                           <span className="text-white font-medium">₹{event.price}</span>
                           <Link to={`/event/${event._id}`} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-accentOrange hover:text-white transition-colors">
                             <ArrowUpRight className="w-5 h-5" />
                           </Link>
                         </div>
                      </div>
                   </Spotlight>
                 </div>
               ))
             )}
           </div>
        </div>
      </section>

      {/* Upcoming Grid (Filtered) */}
      <section className="px-6 mb-24">
         <div className="max-w-[1400px] mx-auto min-h-[400px]">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
               <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 pr-12">
                  {activeCategory ? `${activeCategory} Events` : 'All Upcoming Events'}
               </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    // ... Skeletons
                    [...Array(4)].map((_, i) => (<Skeleton key={i} className="h-[300px] rounded-2xl" />))
                ) : filteredUpcoming.length > 0 ? (
                  filteredUpcoming.map((event) => (
                    <Spotlight key={event._id} className="bg-transparent border-0 group">
                       <Link to={`/event/${event._id}`}>
                           <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                              <img src={event.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={event.title} />
                           </div>
                           <h4 className="text-lg font-bold text-white mb-1 group-hover:text-accentOrange transition-colors">{event.title}</h4>
                           <p className="text-sm text-textMuted">{new Date(event.date).toLocaleDateString()}</p>
                       </Link>
                    </Spotlight>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center text-textMuted">
                     <p className="text-xl">No events found for "{activeCategory || searchTerm}".</p>
                     <button onClick={() => { setActiveCategory(null); setSearchTerm(''); }} className="mt-4 text-accentOrange hover:underline">Clear Filters</button>
                  </div>
                )}
            </div>
         </div>
      </section>

    </div>
  );
};

export default Home;
