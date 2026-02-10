import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Calendar, MapPin, Clock, Share2, ArrowLeft, Ticket, ShieldCheck, Star, Zap, Info, Play, Film, Drama, Heart } from 'lucide-react';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { Skeleton } from '../components/ui/Skeleton';
import NoiseOverlay from '../components/visuals/NoiseOverlay';

import { useAuth } from '../context/AuthContext';

const EventDetails = ({ type = 'event' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toggleFavorite } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  
  const isMovie = type === 'movie';
  const endpoint = isMovie ? `/movies/${id}` : `/events/${id}`;

  const isFavorited = user?.favorites?.some(fav => fav.itemId === id || fav.itemId?._id === id);

  const handleFavorite = async (e) => {
      e.stopPropagation();
      if (!user) {
          navigate('/login');
          return;
      }
      await toggleFavorite(id, isMovie ? 'Movie' : 'Event');
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(endpoint);
        const data = response.data?.data || response.data || {}; 
        setEvent(isMovie ? (data.movie || data) : (data.event || data));
      } catch (error) {
        console.error("Failed to fetch details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, endpoint, isMovie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-accentOrange border-t-transparent rounded-full animate-spin" />
         </div>
      </div>
    );
  }

  if (!event) return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
          <h1 className="text-4xl font-black text-white mb-4">404</h1>
          <p className="text-white/60 mb-8">Event not found.</p>
          <Link to="/">
              <Button>Return Home</Button>
          </Link>
      </div>
  );

  // Format dates/times
  const eventDate = new Date(isMovie ? event.releaseDate : event.date || event.startDate);
  const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = eventDate.getDate();
  const monthName = eventDate.toLocaleDateString('en-US', { month: 'long' });
  const year = eventDate.getFullYear();
  const time = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const posterImage = isMovie ? event.poster : event.image;
  // Use a fallback gradient if no image to avoid white flash
  const bgImage = posterImage || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2000';

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-accentOrange selection:text-white font-sans">
      <SEO 
        title={event.title} 
        description={event.description.substring(0, 150)} 
      />
      
      {/* GLOBAL BACKDROP */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Main Blur - Dark & Moody */}
          <div className="absolute inset-0 bg-[#020202]"></div>
          
          <img 
              src={bgImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-[0.15] blur-[80px] scale-110"
          />
          
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-[#020202]" />
          
          {/* Texture */}
          <NoiseOverlay opacity={0.04} />
      </div>

      {/* NAVIGATION - Minimalist & Floating */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
         <Link to={isMovie ? "/movies" : "/events"} className="pointer-events-auto group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300">
                <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                <span className="text-sm font-medium text-white/70 group-hover:text-white">Back</span>
            </div>
         </Link>
         
         <div className="flex gap-3 pointer-events-auto">
             <button 
                onClick={handleFavorite}
                className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${isFavorited ? 'bg-accentOrange text-white border-accentOrange' : 'bg-white/5 border-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
             >
                 <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
             </button>
             <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
                 <Share2 className="w-4 h-4" />
             </button>
         </div>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-24">
         
         {/* INTRO SECTION: POSTER + SYNOPSIS */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
             
             {/* LEFT COLUMN: THE POSTER (Sticky on Desktop) */}
             <div className="lg:col-span-4 lg:sticky lg:top-32 self-start flex flex-col gap-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative aspect-[2/3] w-full max-w-[400px] mx-auto lg:max-w-none rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 group"
                >
                    <img 
                        src={posterImage} 
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
                             <Play className="w-6 h-6 fill-white ml-1" />
                        </button>
                    </div>
                </motion.div>

                {/* Mobile-Only Actions (Below poster on small screens) */}
                <div className="lg:hidden flex flex-col gap-3">
                    <Button 
                        onClick={() => navigate(isMovie ? `/movies/${id}/slots` : `/event/${id}/slots`)}
                        className="w-full h-14 rounded-xl text-lg font-bold bg-white text-black hover:bg-white/90"
                    >
                        Book Tickets
                    </Button>
                </div>
             </div>

             {/* RIGHT COLUMN: DETAILS & STORY */}
             <div className="lg:col-span-8 flex flex-col justify-center min-h-[60vh]">
                 <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                 >
                     {/* BREADCRUMB / TAGS */}
                     <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-bold uppercase tracking-widest border border-white/5">
                            {isMovie ? 'Movie' : 'Event'}
                        </span>
                        {(isMovie ? event.genre : event.category) && (
                            <span className="px-3 py-1 rounded-md bg-transparent text-white/60 border border-white/10 text-xs font-bold uppercase tracking-widest">
                                {isMovie ? event.genre : event.category}
                            </span>
                        )}
                        {isMovie && (
                            <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold ml-2">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{event.rating}/10</span>
                            </div>
                        )}
                     </div>

                     {/* TITLE */}
                     <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-8">
                         {event.title}
                     </h1>

                     {/* META DATA ROW */}
                     <div className="flex flex-wrap items-center gap-6 md:gap-10 text-white/60 text-lg md:text-xl font-medium mb-10 border-b border-white/5 pb-10">
                         <div className="flex items-center gap-3">
                             <Calendar className="w-5 h-5 text-accentOrange" />
                             <span>{year} • {monthName} {dayNumber}</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <Clock className="w-5 h-5 text-accentOrange" />
                             <span>{time} ({isMovie ? event.runtime : event.duration})</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <MapPin className="w-5 h-5 text-accentOrange" />
                             <span className="truncate max-w-[200px]">{event.location}</span>
                         </div>
                     </div>

                     {/* SYNOPSIS */}
                     <div className="mb-12 max-w-3xl">
                         <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                             Overview
                         </h3>
                         <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light font-sans">
                             {event.description}
                         </p>
                     </div>

                     {/* CAST / FEATURES (Placeholder for now) */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                         <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-center">
                             <Ticket className="w-6 h-6 text-white/40 mx-auto mb-2" />
                             <p className="text-xs font-bold text-white/40 uppercase">Ticket Type</p>
                             <p className="text-white font-bold">Standard</p>
                         </div>
                         <div className="bg-[#111] p-4 rounded-xl border border-white/5 text-center">
                             <Zap className="w-6 h-6 text-white/40 mx-auto mb-2" />
                             <p className="text-xs font-bold text-white/40 uppercase">Experience</p>
                             <p className="text-white font-bold">Digital</p>
                         </div>
                         {/* Add more as needed */}
                     </div>

                     {/* DESKTOP ACTIONS */}
                     <div className="hidden lg:flex items-center gap-6">
                         <Button 
                             onClick={() => navigate(isMovie ? `/movies/${id}/slots` : `/event/${id}/slots`)}
                             className="h-16 px-10 rounded-2xl text-lg font-bold bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all transform hover:-translate-y-1"
                         >
                             Book Tickets
                         </Button>
                         <button className="h-16 px-8 rounded-2xl text-lg font-bold text-white border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-3">
                             <Play className="w-5 h-5 fill-current" />
                             Trailer
                         </button>
                     </div>

                 </motion.div>
             </div>

         </div>

      </div>
    </div>
  );
};

export default EventDetails;
