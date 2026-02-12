import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useEffect, useState } from 'react';
import { getBookingById } from '../api/user';
import { showToast } from '../components/NotificationToast';
import { Download, Share2, Calendar, MapPin, Clock } from 'lucide-react';

const Confirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(location.state?.bookingData || null);
  const [loading, setLoading] = useState(!location.state?.bookingData);

  useEffect(() => {
    if (!booking && id) {
        const fetchBooking = async () => {
            try {
                const res = await getBookingById(id);
                setBooking(res.data);
            } catch (error) {
                console.error("Failed to fetch booking", error);
                showToast("Failed to load booking details", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }
  }, [id, booking]);

  if (loading) {
      return (
          <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-accentOrange border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!booking) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
           <h2 className="text-2xl font-bold mb-4">No Booking Found</h2>
           <Link to="/events"><Button>Browse Events</Button></Link>
        </div>
      );
  }

  // Calculate total if not available (fallback)
  const totalAmount = location.state?.totalAmount || (booking.quantity * (booking.slotId?.price || booking.slotId?.parentId?.price || 0));
  const eventTitle = booking.slotId?.parentId?.title || "Event";
  const eventImage = booking.slotId?.parentId?.poster || booking.slotId?.parentId?.image;
  const eventLocation = booking.slotId?.parentId?.location || "VENUE Cinemas, Jaipur";
  const bookingDate = new Date(booking.slotId?.date || booking.slotId?.startTime).toDateString();
  const bookingTime = new Date(booking.slotId?.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center pb-20 pt-10">
       <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ type: "spring", duration: 0.6 }}
         className="w-full max-w-4xl grid md:grid-cols-3 gap-8"
       >
          {/* Ticket Section */}
          <div className="col-span-2 space-y-6">
              <Card className="p-0 overflow-hidden border-accentOrange/30 shadow-[0_0_50px_rgba(242,140,40,0.1)] relative">
                 <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-accentOrange to-accentPink" />
                 
                 <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{eventTitle}</h1>
                            <div className="flex items-center gap-2 text-textMuted text-sm">
                                <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Confirmed</span>
                                <span>•</span>
                                <span className="font-mono text-accentOrange">{booking.seats?.join(', ')}</span>
                            </div>
                        </div>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VENUE_BOOKING_${booking._id}" alt="QR Code" className="w-24 h-24 rounded-lg bg-white p-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="space-y-1">
                            <p className="text-xs text-textMuted uppercase tracking-wider">Date</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Calendar className="w-4 h-4 text-accentOrange" />
                                {bookingDate}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-textMuted uppercase tracking-wider">Time</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Clock className="w-4 h-4 text-accentOrange" />
                                {bookingTime}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <p className="text-xs text-textMuted uppercase tracking-wider">Location</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <MapPin className="w-4 h-4 text-accentOrange" />
                                {eventLocation}
                            </div>
                        </div>
                    </div>

                     <div className="bg-bgSecondary rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accentOrange" />
                        
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                           <div className="space-y-0.5">
                               <p className="text-textMuted text-xs">Booking ID</p>
                               <p className="text-white font-mono tracking-wider">#{booking._id?.slice(-8).toUpperCase()}</p>
                           </div>
                           <div className="space-y-0.5 text-right">
                               <p className="text-textMuted text-xs">Total Amount</p>
                               <p className="text-white font-bold text-lg">₹{totalAmount?.toFixed(2) || booking.price || '0.00'}</p>
                           </div>
                           {booking.transactionId && (
                               <div className="col-span-2 pt-2 border-t border-white/5 mt-2 flex justify-between items-center">
                                   <p className="text-textMuted text-xs">Transaction ID</p>
                                   <p className="font-mono text-xs text-white/70">{booking.transactionId}</p>
                               </div>
                           )}
                        </div>
                     </div>
                 </div>
              </Card>

              <div className="flex gap-4">
                  <Button className="flex-1 gap-2" variant="outline" onClick={() => window.print()}>
                      <Download className="w-4 h-4" /> Download Ticket
                  </Button>
                  <Button className="flex-1 gap-2" variant="outline">
                      <Share2 className="w-4 h-4" /> Share
                  </Button>
              </div>
          </div>

          {/* Side Actions / Summary */}
          <div className="space-y-6">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                  <img src={eventImage} alt={eventTitle} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bgPrimary via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-sm font-medium text-white/80 line-clamp-2">{booking.slotId?.parentId?.description || "Enjoy the show!"}</p>
                  </div>
              </div>

              <Button className="w-full py-6 text-lg" onClick={() => navigate('/bookings')}>
                   View My Bookings
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
                   Back to Home
              </Button>
          </div>
       </motion.div>
    </div>
  );
};

export default Confirmation;
