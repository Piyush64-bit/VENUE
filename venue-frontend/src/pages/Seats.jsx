import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { showToast } from '../components/NotificationToast';
import { ChevronLeft } from 'lucide-react';

const Seats = ({ type = 'event' }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const slot = location.state?.slot;

  const isMovie = type === 'movie';
  const slotsRoute = isMovie ? `/movies/${id}/slots` : `/event/${id}/slots`;
  const checkoutRoute = isMovie ? `/movies/${id}/checkout` : `/event/${id}/checkout`;

  useEffect(() => {
    if (!slot) {
      navigate(slotsRoute);
      return;
    }

    const fetchSeats = async () => {
      // Immediate check for mock slots
      if (slot.isMock) {
          console.warn("Generating Mock Seats for Demo Slot");
          showToast("Demo Mode: Showing example seat layout", "info");
          generateMockSeats();
          setLoading(false);
          return;
      }

      try {
        const response = await api.get(`/slots/${slot._id}/seats`);
        if (response.data && response.data.length > 0) {
            setSeats(response.data);
        } else {
            throw new Error("No seats found");
        }
      } catch (error) {
        console.error("Failed to load seats", error);
        showToast("Failed to load seats. Please try again.", "error");
        setSeats([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [slot, id, navigate, slotsRoute]);

  const generateMockSeats = () => {
        const mockSeats = [];
        const rows = 6;
        const cols = 8;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isBooked = Math.random() < 0.3;
                const rowLabel = String.fromCharCode(65 + r); // A, B, C...
                mockSeats.push({
                    _id: `${rowLabel}${c+1}`,
                    label: `${rowLabel}${c+1}`,
                    status: isBooked ? 'booked' : 'available',
                    row: rowLabel,
                    number: c + 1
                });
            }
        }
        setSeats(mockSeats);
  };

  const toggleSeat = (seat) => {
    if (seat.status === 'booked' || seat.status === 'disabled') return;

    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s._id === seat._id);
      if (isSelected) {
        return prev.filter(s => s._id !== seat._id);
      } else {
        if (prev.length >= 5) {
          showToast("Maximum 5 seats allowed", "error");
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const handleCheckout = () => {
    navigate(checkoutRoute, { 
      state: { 
        slot, 
        selectedSeats 
      } 
    });
  };

  if (loading) return <div className="min-h-screen bg-bgPrimary flex items-center justify-center"><div className="w-8 h-8 border-2 border-accentOrange rounded-full animate-spin border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-bgPrimary text-white pb-32">
       {/* Top Bar */}
       <div className="fixed top-0 left-0 right-0 p-6 z-40 bg-gradient-to-b from-bgPrimary to-transparent pointer-events-none">
          <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
             <button 
                onClick={() => navigate(slotsRoute)}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/5 hover:border-white/20"
             >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-wider">Back</span>
             </button>
             <div className="text-right">
                <p className="text-xs font-bold text-accentOrange uppercase tracking-widest">Selected Time</p>
                <p className="font-mono text-lg">{slot?.startTime && new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
             </div>
          </div>
       </div>

       <div className="pt-32 px-4 max-w-4xl mx-auto text-center">
          
          {/* Cinema Screen Effect */}
          <div className="relative mb-20 perspective-1000">
             <div className="w-3/4 mx-auto h-2 bg-white rounded-full shadow-[0_20px_100px_rgba(255,255,255,0.3)] mb-12 opacity-80" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-white/10 to-transparent blur-3xl pointer-events-none" />
             <p className="text-xs font-bold text-white/20 uppercase tracking-[0.5em]">Screen This Way</p>
          </div>

          {/* Seats Grid */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
             className="grid grid-cols-10 gap-3 md:gap-4 justify-center mx-auto max-w-2xl px-4"
          >
             {seats.length > 0 ? seats.map((seat, i) => {
                const isSelected = selectedSeats.find(s => s._id === seat._id);
                const isBooked = seat.status === 'booked';
                
                return (
                   <motion.button
                      key={seat._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.01 }}
                      onClick={() => toggleSeat(seat)}
                      disabled={isBooked}
                      whileHover={!isBooked ? { scale: 1.2, zIndex: 10 } : {}}
                      whileTap={!isBooked ? { scale: 0.9 } : {}}
                      className={`
                         relative aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all duration-300
                         ${isSelected 
                           ? 'bg-accentOrange text-white shadow-[0_0_15px_rgba(242,140,40,0.6)] z-10 scale-110' 
                           : isBooked 
                             ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                             : 'bg-transparent border border-white/20 text-white/40 hover:border-white hover:text-white hover:bg-white/5'}
                      `}
                   >
                      {seat.label}
                   </motion.button>
                );
             }) : (
                 <div className="col-span-10 text-center py-20 text-white/30">Select a slot to load seats</div>
             )}
          </motion.div>

          {/* Legend */}
          <div className="mt-16 flex justify-center gap-8 text-xs font-medium text-white/50 uppercase tracking-widest">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full border border-white/30" /> 
                <span>Available</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-accentOrange shadow-[0_0_10px_rgba(242,140,40,0.5)]" /> 
                <span className="text-white">Selected</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/10" /> 
                <span>Booked</span>
             </div>
          </div>

       </div>

       {/* Floating Checkout Bar */}
       <div className="fixed bottom-4 left-0 right-0 px-4 z-50 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
             <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: selectedSeats.length > 0 ? 0 : 100, opacity: selectedSeats.length > 0 ? 1 : 0 }}
               className="bg-bgCard/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between"
             >
                <div className="flex flex-col">
                   <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-white">${selectedSeats.length * 25}</span>
                       <span className="text-white/40 text-xs font-medium uppercase tracking-wider">for {selectedSeats.length} seats</span>
                   </div>
                </div>

                <div className="flex gap-4">
                    <Button 
                       size="md" 
                       className="px-8 rounded-xl shadow-[0_0_20px_rgba(242,140,40,0.3)] hover:shadow-[0_0_30px_rgba(242,140,40,0.5)] transition-shadow py-2"
                       onClick={handleCheckout}
                    >
                       Checkout
                    </Button>
                </div>
             </motion.div>
          </div>
       </div>

    </div>
  );
};

export default Seats;
