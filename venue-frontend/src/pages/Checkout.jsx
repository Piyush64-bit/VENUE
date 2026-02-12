import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import api from '../api/axios';
import { showToast } from '../components/NotificationToast';
import { Calendar, Clock, MapPin, ChevronLeft, Ticket, ShieldCheck, ArrowRight } from 'lucide-react';

const Checkout = ({ type = 'event' }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { slot, selectedSeats } = location.state || {}; 
  
  const isMovie = type === 'movie';
  const endpoint = isMovie ? `/movies/${id}` : `/events/${id}`;

  useEffect(() => {
    if (!slot || !selectedSeats) {
        showToast("Session expired. Please select seats again.", "warning");
        // Use a safe redirect if endpoint is somehow problematic, but it should be fine now
        navigate(endpoint); 
    }
  }, [slot, selectedSeats, navigate, endpoint]); 

  const [isProcessing, setIsProcessing] = useState(false);
  const [eventData, setEventData] = useState(null);
  useEffect(() => {
    const fetchEvent = async () => {
        try {
            const res = await api.get(endpoint);
            const data = res.data?.data || res.data || {};
            setEventData(isMovie ? (data.movie || data) : (data.event || data));
        } catch (e) {
            console.error(e);
            showToast("Failed to load event details", "error");
        }
    };
    fetchEvent();
  }, [id, endpoint, isMovie]);

  // Pricing Logic
  const seatCount = selectedSeats?.length || 0;
  // Use event price if available, else default to 25. 
  // Note: Movies might not have price in model yet, so default works.
  const basePrice = eventData?.price !== undefined ? eventData.price : 25;
  const subtotal = seatCount * basePrice;
  const bookingFee = subtotal * 0.10; // 10% mock fee
  const tax = (subtotal + bookingFee) * 0.18; // 18% tax
  const totalAmount = subtotal + bookingFee + tax;

  const handlePayment = async () => {
    if (slot?.isMock) {
        showToast("Demo Mode: Cannot process payment", "warning");
        return;
    }
    
    setIsProcessing(true);
    
    // Simulate Razorpay opening
    showToast("Redirecting to Razorpay...", "info");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate gateway delay

      const bookingData = {
        slotId: slot?._id,
        quantity: Number(selectedSeats?.length || 1),
        seats: selectedSeats?.map(s => s.label) || [], // Ensure array of strings
      };

      // Only add eventId if it's not a movie, to avoid schema warnings if strict
      if (!isMovie && id) {
          bookingData.eventId = id;
      }

      const response = await api.post('/bookings', bookingData);
      
      const newBooking = response.data.data || response.data.booking || response.data;
      const bookingId = newBooking._id || newBooking[0]?._id;

      showToast("Payment Successful!", "success");
      // Navigate to booking-specific confirmation page
      navigate(`/bookings/${bookingId}/confirmation`, { 
        state: { bookingData: newBooking, totalAmount } 
      });

    } catch (error) {
      console.error("Booking failed", error);
      if (error.response?.status === 409) {
          showToast("Booking conflict: These seats may have just been taken.", "error");
      } else if (error.response?.status === 404) {
          showToast("Event or Slot not found (it may have been unpublished).", "error");
      } else {
          showToast(error.response?.data?.message || "Booking failed. Please try again.", "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!eventData || !slot) return <div className="min-h-screen bg-bgPrimary flex items-center justify-center"><div className="w-8 h-8 border-2 border-accentOrange rounded-full animate-spin border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-bgPrimary text-white relative flex justify-center">
       {/* Background Ambience */}
       <div className="fixed inset-0 z-0">
          <img src={isMovie ? eventData.poster : eventData.image} alt="" className="w-full h-full object-cover opacity-[0.15] blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-bgPrimary via-bgPrimary/95 to-bgPrimary/80" />
       </div>

       <div className="relative z-10 w-full max-w-5xl p-6 md:p-12 flex flex-col md:flex-row gap-12 items-start mt-12 md:mt-20">
           
           {/* Left: Event Summary Card */}
           <div className="w-full md:w-5/12">
               <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group mb-8"
               >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-bold uppercase tracking-widest">Back</span>
               </button>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl"
               >
                  <div className="aspect-video relative">
                      <img src={isMovie ? eventData.poster : eventData.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-6 left-6">
                          <h2 className="text-2xl font-black uppercase leading-none drop-shadow-md">{eventData.title}</h2>
                      </div>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                          <div className="p-2 bg-white/5 rounded-lg">
                              <Calendar className="w-4 h-4 text-accentOrange" />
                          </div>
                          <span>
                            {(() => {
                                const dateStr = slot.date || slot.startTime;
                                if (!dateStr) return 'Date N/A';
                                const dateObj = new Date(dateStr);
                                return isNaN(dateObj.getTime()) ? 'Date N/A' : dateObj.toDateString();
                            })()}
                          </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                          <div className="p-2 bg-white/5 rounded-lg">
                              <Clock className="w-4 h-4 text-accentOrange" />
                          </div>
                          <span>
                            {(() => {
                                let timeStr = slot.startTime;
                                if (!timeStr) return '--:--';
                                if (timeStr.includes('T') || timeStr.includes('Z')) {
                                    timeStr = new Date(timeStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                }
                                return timeStr;
                            })()}
                          </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                          <div className="p-2 bg-white/5 rounded-lg">
                              <MapPin className="w-4 h-4 text-accentOrange" />
                          </div>
                          <span>{isMovie ? 'VENUE Cinemas, Jaipur' : eventData.location}</span>
                      </div>
                  </div>
               </motion.div>
           </div>

           {/* Right: Order Details */}
           <div className="w-full md:w-7/12">
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-bgCard border border-white/10 rounded-3xl p-8 shadow-2xl"
               >
                   <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                       <div className="w-12 h-12 rounded-full bg-accentOrange/10 flex items-center justify-center text-accentOrange">
                           <Ticket className="w-6 h-6" />
                       </div>
                       <div>
                           <h1 className="text-2xl font-bold">Order Summary</h1>
                           <p className="text-textMuted text-sm">Review your booking details</p>
                       </div>
                   </div>

                   {/* Seats List */}
                   <div className="mb-8">
                       <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Selected Seats ({seatCount})</h3>
                       <div className="flex flex-wrap gap-2">
                           {selectedSeats?.map(seat => (
                               <span key={seat._id} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white">
                                   {seat.label}
                               </span>
                           ))}
                       </div>
                   </div>

                   {/* Pricing Breakdown */}
                   <div className="space-y-3 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5">
                       <div className="flex justify-between text-sm">
                           <span className="text-textMuted">{seatCount} x Tickets (@ ₹{basePrice})</span>
                           <span className="text-white font-mono">₹{subtotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-textMuted">Convenience Fee</span>
                           <span className="text-white font-mono">₹{bookingFee.toFixed(2)}</span>
                       </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-textMuted">Taxes & Charges</span>
                           <span className="text-white font-mono">₹{tax.toFixed(2)}</span>
                       </div>
                       <div className="h-px bg-white/10 my-2" />
                       <div className="flex justify-between items-center">
                           <span className="text-lg font-bold text-white">Total Payable</span>
                           <span className="text-2xl font-black text-accentOrange">₹{totalAmount.toFixed(2)}</span>
                       </div>
                   </div>

                   {/* Action */}
                   <Button 
                       variant={slot?.isMock ? "secondary" : "primary"}
                       size="lg" 
                       className="w-full h-14 text-lg font-bold flex items-center justify-center gap-2 group"
                       onClick={handlePayment}
                       isLoading={isProcessing}
                       disabled={slot?.isMock || isProcessing}
                   >
                       {!isProcessing && !slot?.isMock && (
                           <>
                             <span>Proceed to Payment</span>
                             <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                           </>
                       )}
                       {!isProcessing && slot?.isMock && (
                           <span>Demo Mode - Checkout Disabled</span>
                       )}
                       {isProcessing && 'Contacting Gateway...'}
                   </Button>

                   {slot?.isMock && (
                       <div className="mt-4 p-3 bg-accentOrange/10 border border-accentOrange/20 rounded-xl text-center">
                           <p className="text-accentOrange text-sm font-bold">This is a demo slot. Payment is disabled.</p>
                       </div>
                   )}

                   <div className="mt-6 flex items-center justify-center gap-2 text-white/30 text-xs">
                       <ShieldCheck className="w-3 h-3" />
                       <span>Payments are processed securely via Razorpay</span>
                   </div>

               </motion.div>
           </div>
       </div>
    </div>
  );
};

export default Checkout;
