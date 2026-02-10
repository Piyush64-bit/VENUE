import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, MapPin, Clock, Share2, ArrowLeft, Ticket, ShieldCheck, Star } from 'lucide-react';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { Skeleton } from '../components/ui/Skeleton';

const EventDetails = ({ type = 'event' }) => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();

  // Parallax effect for hero image
  const imageY = useTransform(scrollY, [0, 500], [0, 150]);
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const isMovie = type === 'movie';
  const endpoint = isMovie ? `/movies/${id}` : `/events/${id}`;

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
      <div className="min-h-screen bg-bgPrimary px-6 pt-24">
         <div className="max-w-7xl mx-auto space-y-8">
            <Skeleton className="h-[50vh] w-full rounded-3xl" />
            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-40 w-full" />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
         </div>
      </div>
    );
  }

  if (!event) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-white">Item not found</div>;

  // Format dates/times
  const eventDate = new Date(isMovie ? event.releaseDate : event.date || event.startDate);
  const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = eventDate.getDate();
  const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const year = eventDate.getFullYear();
  const time = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-bgPrimary relative overflow-hidden">
      <SEO 
        title={event.title} 
        description={event.description.substring(0, 150)} 
      />

      {/* Back Button */}
      <div className="fixed top-24 left-6 z-50">
        <Link to={isMovie ? "/movies" : "/events"}>
            <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors shadow-xl"
            >
                <ArrowLeft className="w-5 h-5" />
            </motion.div>
        </Link>
      </div>

      {/* Hero Section with Parallax */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-bgPrimary via-bgPrimary/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-black/30 z-0" />
        
        <motion.img 
            style={{ y: imageY, scale: imageScale }}
            src={isMovie ? event.poster : event.image || 'https://via.placeholder.com/1200x600'} 
            alt={event.title}
            className="w-full h-full object-cover"
        />

        {/* Hero Content - Placed at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8">
                <div className="space-y-4 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        {event.category && (
                            <span className="px-4 py-1.5 bg-accentOrange text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-accentOrange/20">
                                {event.category}
                            </span>
                        )}
                        {event.status && (
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                                {event.status}
                            </span>
                        )}
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase leading-none tracking-tight drop-shadow-2xl"
                    >
                        {event.title}
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-6 text-white/80 text-lg font-medium"
                    >
                        <div className="flex items-center gap-2">
                             <MapPin className="w-5 h-5 text-accentOrange" />
                             {event.location || 'Venue to be announced'}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="flex items-center gap-2">
                             <Clock className="w-5 h-5 text-accentOrange" />
                             {event.duration ? `${event.duration} mins` : 'Duration TBD'}
                        </div>
                    </motion.div>
                </div>

                {/* Date Badge (Desktop) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="hidden md:flex flex-col items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-w-[120px]"
                >
                    <span className="text-accentOrange font-bold uppercase tracking-widest text-sm">{monthName}</span>
                    <span className="text-5xl font-black text-white">{dayNumber}</span>
                    <span className="text-white/60 font-medium">{year}</span>
                </motion.div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Left Column: Description & Details */}
            <div className="lg:col-span-2 space-y-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="prose prose-lg prose-invert max-w-none"
                >
                    <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        <Star className="w-6 h-6 text-accentOrange fill-accentOrange" /> 
                        About the Experience
                    </h3>
                    <p className="text-textMuted leading-relaxed text-lg whitespace-pre-wrap">
                        {event.description}
                    </p>
                </motion.div>

                {/* Additional Info Grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-bgCard border border-white/5 p-6 rounded-2xl space-y-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="font-bold text-white">Secure Booking</h4>
                        <p className="text-sm text-textMuted">Your purchase is protected. 100% genuine tickets guaranteed.</p>
                    </div>
                    <div className="bg-bgCard border border-white/5 p-6 rounded-2xl space-y-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-green-500" />
                        </div>
                        <h4 className="font-bold text-white">Instant Confirmation</h4>
                        <p className="text-sm text-textMuted">Receive your e-tickets immediately after payment.</p>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8">
                     <h3 className="text-2xl font-bold text-white mb-6">Location</h3>
                     <div className="aspect-video w-full rounded-2xl bg-bgCard border border-white/5 flex items-center justify-center relative overflow-hidden group">
                         {/* Placeholder Map Pattern */}
                         <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale" />
                         <div className="z-10 text-center">
                             <MapPin className="w-8 h-8 text-accentOrange mx-auto mb-2 animate-bounce" />
                             <p className="text-white font-medium">{event.location}</p>
                             <button className="mt-4 text-xs font-bold uppercase tracking-widest text-white border-b border-accentOrange pb-1 hover:text-accentOrange transition-colors">
                                 Get Directions
                             </button>
                         </div>
                     </div>
                </div>
            </div>

            {/* Right Column: Booking Card (Sticky) */}
            <div className="lg:col-span-1">
                <div className="sticky top-32 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-bgCard/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accentOrange/10 blur-[50px] rounded-full pointer-events-none" />
                        
                        <div className="mb-8">
                            <span className="text-textMuted text-sm font-medium uppercase tracking-wider">Starting from</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black text-white">₹{event.price || 0}</span>
                                <span className="text-sm text-textMuted">/ person</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-white/80">
                                <Calendar className="w-5 h-5 text-accentOrange" />
                                <div>
                                    <p className="font-bold text-white">{dayName}, {monthName} {dayNumber}</p>
                                    <p className="text-xs text-textMuted">{year}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-white/80">
                                <Clock className="w-5 h-5 text-accentOrange" />
                                <div>
                                    <p className="font-bold text-white">{time}</p>
                                    <p className="text-xs text-textMuted">Doors open 1h early</p>
                                </div>
                            </div>
                        </div>

                        <Link to={isMovie ? `/movie/${id}/slots` : `/event/${id}/slots`} className="block group">
                            <Button variant="primary" className="w-full py-6 text-lg rounded-xl shadow-lg shadow-accentOrange/20 group-hover:shadow-accentOrange/40 transition-all transform group-hover:-translate-y-1">
                                Book Tickets Now
                            </Button>
                        </Link>
                        
                        <p className="mt-4 text-center text-xs text-textMuted">
                            Limited seats available. Book soon!
                        </p>
                    </motion.div>

                    <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white hover:text-black transition-all group">
                        <Share2 className="w-4 h-4" />
                        Share Details
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
