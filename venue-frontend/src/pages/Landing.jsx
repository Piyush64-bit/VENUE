import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import SEO from '../components/ui/SEO';

import Hero3D from '../components/visuals/Hero3D';
import Marquee from '../components/visuals/Marquee';
import NoiseOverlay from '../components/visuals/NoiseOverlay';
import MagneticButton from '../components/visuals/MagneticButton';
import Categories from '../components/visuals/Categories';

import api from '../api/axios';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, moviesRes] = await Promise.all([
             api.get('/events'),
             api.get('/movies')
        ]);

        let combined = [];

        if (eventsRes.data?.data?.events) {
           const mappedEvents = eventsRes.data.data.events.map(event => ({
             id: event._id,
             title: event.title,
             subtitle: event.description,
             date: new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
             image: event.image,
             category: event.category
           }));
           combined = [...combined, ...mappedEvents];
        }

        if (Array.isArray(moviesRes.data)) {
           const mappedMovies = moviesRes.data.map(movie => ({
             id: movie._id,
             title: movie.title,
             subtitle: movie.description,
             date: new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
             image: movie.poster,
             category: movie.genre
           }));
           combined = [...combined, ...mappedMovies];
        }

        setEvents(combined.sort(() => 0.1 - Math.random()));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);





  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden bg-bgPrimary text-textPrimary selection:bg-accentOrange selection:text-white">
      <SEO 
        title="Experience Jaipur Live" 
        description="Discover curated events, movies, and exclusive experiences in Jaipur." 
        keywords="jaipur events, concerts, movies, booking, venue"
      />
      <NoiseOverlay />
      <Hero3D />

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-end md:justify-center items-center overflow-hidden bg-gradient-to-b from-bgPrimary via-[#0F0F16] to-[#000000]">
        
        {/* Mobile Aurora Glow (Animated) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3], 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accentOrange/20 blur-[100px] rounded-full pointer-events-none md:hidden" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2], 
            x: [-20, 20, -20]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none md:hidden" 
        />

        <div className="hidden md:block absolute top-1/2 left-0 w-full -translate-y-1/2 z-10 md:mix-blend-difference pointer-events-none">
           <Marquee baseVelocity={-2}>
             <span className="text-[12vw] md:text-[15vw] font-black tracking-tighter uppercase text-white/90 px-4 md:px-8">
               LIVE
             </span>
             <span className="text-[12vw] md:text-[15vw] font-black tracking-tighter uppercase text-accentOrange px-4 md:px-8">
               IT.
             </span>
           </Marquee>
        </div>

        {/* Mobile Static Headline & Status */}
        <div className="md:hidden z-20 mb-auto mt-32 text-center flex flex-col items-center">
             {/* Glass Status Pill */}
             <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2"
             >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Jaipur • Now Live
                </span>
             </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-[18vw] font-black leading-[0.8] tracking-tighter text-white drop-shadow-2xl"
              >
                  LIVE <br />
                  <span className="text-accentOrange relative">
                    IT
                    <span className="text-white">.</span>
                  </span>
              </motion.h1>
            </motion.div>
        </div>

        {/* Bottom Weighted Action Area */}
        <div className="z-20 w-full px-6 pb-12 md:pb-0 md:w-auto md:bg-black/40 md:backdrop-blur-sm md:p-8 md:rounded-3xl md:border md:border-white/10 mx-auto mt-8 md:mt-64">
           
           <div className="flex flex-col md:flex-row gap-3 justify-center items-stretch md:items-center">
             
             {/* Primary Action - Full Width & Bold on Mobile */}
             <button 
               onClick={() => navigate('/events')}
               className="group relative bg-accentOrange text-white h-14 md:h-auto md:px-8 md:py-4 rounded-2xl md:rounded-full font-bold text-lg hover:bg-accentHover transition-all shadow-[0_4px_20px_rgba(242,140,40,0.3)] hover:shadow-[0_4px_25px_rgba(242,140,40,0.5)] active:scale-95 flex items-center justify-center gap-2"
             >
               <span>Explore Events</span>
             </button>

             {/* Secondary Action */}
             <button 
               onClick={() => navigate('/movies')}
               className="group bg-white/5 border border-white/10 text-white h-14 md:h-auto md:px-8 md:py-4 rounded-2xl md:rounded-full font-bold text-lg hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm"
             >
               Movies
             </button>
             
             {/* Tertiary Login Link */}
             {!user && (
                <button 
                  onClick={() => navigate('/login')}
                  className="mt-2 md:mt-0 md:hidden text-xs text-textMuted uppercase tracking-widest font-bold py-3 active:text-white transition-colors"
                >
                  Log In to Account
                </button>
             )}
           </div>
        </div>
      </section>

      {/* Trending / Cover Flow Section */}
      <section className="relative py-32 z-10 bg-bgPrimary">
        <div className="max-w-[1400px] mx-auto px-6 mb-16 flex items-end justify-between">
           <div>
             <motion.h2 
               initial="hidden"
               whileInView="visible"
               viewport={{ amount: 0.3, once: true }}
               variants={{
                 hidden: {},
                 visible: { 
                   transition: { staggerChildren: 0.15 } 
                 }
               }}
               className="text-5xl md:text-7xl font-bold tracking-tighter mb-4"
             >
               <motion.span className="inline-block" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>Trending</motion.span> <br /> 
               <motion.span className="inline-block" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>In</motion.span>{' '}
               <motion.span className="text-textMuted inline-block" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>The</motion.span>{' '}
               <motion.span className="text-textMuted inline-block" variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>City</motion.span>
             </motion.h2>
           </div>
           <div className="hidden md:block text-right">
              <p className="text-textMuted text-lg">Curated for Jaipur's finest.</p>
           </div>
        </div>

        {/* Horizontal Scroll Area */}
        <div className="pb-20">
           <Marquee baseVelocity={0.1} pauseOnHover>
             {events.map((event) => (
                <motion.div 
                  key={event.id}
                  className="w-[280px] md:w-[320px] group cursor-pointer relative mx-4"
                  whileHover={{ scale: 1.0 }}
                  onClick={() => navigate('/events')}
                >
                   <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-6">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" // Zoom effect
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      
                      <div className="absolute top-4 right-4 bg-black/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                         {event.category}
                      </div>
                   </div>
                   
                   <div className="space-y-2 mt-4">
                      <p className="text-accentOrange text-sm font-bold uppercase tracking-wider">{event.date}</p>
                      <h3 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-accentOrange transition-colors line-clamp-2">{event.title}</h3>
                      <p className="text-textMuted text-sm line-clamp-1">{event.subtitle}</p>
                   </div>
                </motion.div>
             ))}
           </Marquee>
        </div>
      </section>

      <Categories />


    </div>
  );
};

export default Landing;
