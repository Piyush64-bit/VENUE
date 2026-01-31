import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Slots = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, slotsRes] = await Promise.all([
          api.get(`/events/${id}`).catch(() => ({ data: { 
            title: "Mock Event Title", 
            image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000",
            location: "Venue Main Hall",
            duration: "2h 30m"
          }})), 
          api.get(`/events/${id}/slots`).catch(() => ({ data: [] }))
        ]);
        
        setEvent(eventRes.data.data.event);
        
        // Mock Data Fallback
        const fetchedSlots = slotsRes.data.data.slots || [];
        
        if (fetchedSlots.length === 0) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const mockSlots = [
                { _id: '1', startTime: new Date(today.setHours(10,0,0)).toISOString(), endTime: new Date(today.setHours(12,0,0)).toISOString(), capacity: 100, booked: 20 },
                { _id: '2', startTime: new Date(today.setHours(14,0,0)).toISOString(), endTime: new Date(today.setHours(16,0,0)).toISOString(), capacity: 100, booked: 80 },
                { _id: '3', startTime: new Date(today.setHours(18,0,0)).toISOString(), endTime: new Date(today.setHours(20,0,0)).toISOString(), capacity: 100, booked: 100 }, // Full
                { _id: '4', startTime: new Date(tomorrow.setHours(10,0,0)).toISOString(), endTime: new Date(tomorrow.setHours(12,0,0)).toISOString(), capacity: 100, booked: 0 },
                { _id: '5', startTime: new Date(tomorrow.setHours(14,0,0)).toISOString(), endTime: new Date(tomorrow.setHours(16,0,0)).toISOString(), capacity: 100, booked: 45 },
            ];
            setSlots(mockSlots);
            
            // Set default date
            const dates = [...new Set(mockSlots.map(s => new Date(s.startTime).toDateString()))];
            setSelectedDate(dates[0]);
        } else {
            setSlots(fetchedSlots);
            if (fetchedSlots.length > 0) {
               const dates = [...new Set(fetchedSlots.map(s => new Date(s.startTime).toDateString()))];
               setSelectedDate(dates[0]);
            }
        }

      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
     const groups = {};
     slots.forEach(slot => {
        const dateKey = new Date(slot.startTime).toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(slot);
     });
     return groups;
  }, [slots]);

  const availableDates = Object.keys(slotsByDate);

  const handleContinue = () => {
    if (selectedSlot) {
        navigate(`/event/${id}/seats`, { state: { slot: selectedSlot } });
    }
  };

  if (loading) return <div className="min-h-screen bg-bgPrimary flex items-center justify-center"><div className="w-8 h-8 border-2 border-accentOrange rounded-full animate-spin border-t-transparent" /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-white">Event not found</div>;

  return (
    <div className="min-h-screen bg-bgPrimary pb-24 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <img src={event.image} alt="" className="w-full h-[60vh] object-cover opacity-20 blur-3xl" />
         <div className="absolute inset-0 bg-gradient-to-b from-bgPrimary/80 via-bgPrimary to-bgPrimary" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28">
        {/* Header */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-12"
        >
           <button 
             onClick={() => navigate(`/event/${id}`)}
             className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 group"
           >
              <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                 <ChevronLeft className="w-4 h-4" />
              </div>
              <span className="uppercase text-xs font-bold tracking-widest">Back</span>
           </button>

           <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4">{event.title}</h1>
           <div className="flex items-center gap-6 text-textMuted text-sm font-medium">
              <div className="flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-accentOrange" />
                 <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4 text-accentOrange" />
                 <span>{event.duration || '2h 15m'}</span>
              </div>
           </div>
        </motion.div>

        {/* Date Selection - Cinema Style Carousel */}
        <div className="mb-12">
           <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Select Date</h3>
           <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {availableDates.map((date, idx) => {
                 const dateObj = new Date(date);
                 const isSelected = selectedDate === date;
                 
                 return (
                    <motion.button
                       key={date}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       onClick={() => {
                           setSelectedDate(date);
                           setSelectedSlot(null);
                       }}
                       className={`
                          flex flex-col items-center justify-center min-w-[5rem] h-20 rounded-2xl border transition-all duration-300
                          ${isSelected 
                            ? 'bg-accentOrange text-white border-accentOrange shadow-[0_0_20px_rgba(242,140,40,0.4)] scale-105' 
                            : 'bg-white/5 text-textMuted border-white/10 hover:bg-white/10 hover:border-white/20'}
                       `}
                    >
                       <span className="text-xs font-bold uppercase">{dateObj.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                       <span className="text-2xl font-black">{dateObj.getDate()}</span>
                    </motion.button>
                 );
              })}
           </div>
        </div>

        {/* Time Slots Grid */}
        <AnimatePresence mode="wait">
           <motion.div
             key={selectedDate}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.3 }}
           >
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Select Time</h3>
              
              {slotsByDate[selectedDate]?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {slotsByDate[selectedDate].map((slot) => {
                        const isSelected = selectedSlot?._id === slot._id;
                        const timeString = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                           <button
                              key={slot._id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`
                                 relative p-4 rounded-xl border text-center transition-all duration-300 group overflow-hidden
                                 ${isSelected 
                                   ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                   : 'bg-bgCard border-white/10 hover:border-accentOrange/50 text-white'}
                              `}
                           >
                              <span className={`text-lg font-bold ${isSelected ? 'text-black' : 'text-white group-hover:text-accentOrange'}`}>
                                 {timeString}
                              </span>
                              {isSelected && <motion.div layoutId="glow" className="absolute inset-0 bg-white/20 blur-xl" />}
                           </button>
                        );
                     })}
                  </div>
              ) : (
                  <div className="py-12 text-center text-textMuted border border-dashed border-white/10 rounded-2xl">
                     No slots available for this date.
                  </div>
              )}
           </motion.div>
        </AnimatePresence>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-bgPrimary/80 backdrop-blur-xl border-t border-white/10 z-50">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                 <p className="text-textMuted text-sm mb-1">Total</p>
                 <p className="text-2xl font-bold text-white gap-2 flex items-baseline">
                    {selectedSlot ? (
                        <>
                           <span className="text-accentOrange">$25.00</span>
                           <span className="text-sm font-normal text-white/40">/ person</span>
                        </>
                    ) : (
                        <span className="text-white/20">--</span>
                    )}
                 </p>
              </div>
              
              <Button 
                size="lg" 
                className="px-12 rounded-full"
                disabled={!selectedSlot}
                onClick={handleContinue}
              >
                 Select Seats
              </Button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Slots;
