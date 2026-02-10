import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { showToast } from '../components/NotificationToast';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');

      // Handle standardized ApiResponse (data.data.bookings) or legacy (data.bookings)
      const fetchedBookings = response.data?.data?.bookings || response.data?.bookings || [];
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    try {
        await api.delete(`/bookings/${bookingId}`);
        showToast("Booking cancelled", "success");
        fetchBookings(); // Refresh list
    } catch (error) {
        showToast("Failed to cancel booking", "error");
    }
  };

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-2 border-accentOrange rounded-full animate-spin border-t-transparent" /></div>;

  return (
    <div className="pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-textPrimary mb-8">My Bookings</h1>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            // Helper to get title/image from event OR movie
            const getItem = (slot) => slot?.eventId || slot?.movieId || {};
            const item = getItem(booking.slotId);

            return (
 <motion.div 
   key={booking._id}
   initial={{ opacity: 0, y: 10 }}
   animate={{ opacity: 1, y: 0 }}
 >
    <Card className="flex flex-col md:flex-row gap-6 p-6">
       <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={item.image || item.poster || 'https://via.placeholder.com/200'} 
            alt={item.title || 'Event'} 
            className="w-full h-full object-cover"
          />
       </div>
       
       <div className="flex-1 flex flex-col justify-between">
          <div>
             <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white mb-2">{item.title || 'Unknown Event'}</h3>
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wide ${
                                booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' : // backend returns UPPERCASE
                                booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' :
                                'bg-gray-500/20 text-gray-500'
                            }`}>
                               {booking.status}
                            </span>
                         </div>
                         <p className="text-textMuted text-sm mb-4">
                            {/* Fix Date Access */}
                            {new Date(booking.slotId?.startTime).toLocaleString()}
                         </p>
                         <div className="flex flex-wrap gap-2 mb-4">
                            {/* Fix Seat Mapping */}
                            {booking.seats?.map((seat, i) => (
                               <span key={i} className="px-2 py-1 bg-bgSecondary border border-borderSubtle rounded text-xs text-textMuted">
                                  {seat.label}
                               </span>
                            ))}
                         </div>
                      </div>
                      
                      <div className="flex justify-end">
                         {booking.status !== 'CANCELLED' && (
                             <Button variant="danger" className="text-sm px-4 py-2 h-auto" onClick={() => handleCancel(booking._id)}>
                                Cancel Booking
                             </Button>
                         )}
                      </div>
                   </div>
                </Card>
             </motion.div>
          )})}
        </div>
      ) : (
        <div className="text-center py-20 bg-bgCard/30 rounded-xl border border-borderSubtle border-dashed">
           <h3 className="text-xl font-bold text-white mb-2">No active bookings</h3>
           <p className="text-textMuted mb-6">You haven't booked any events yet.</p>
           <Button onClick={() => window.location.href='/events'}>Browse Events</Button>
        </div>
      )}
    </div>
  );
};

export default Bookings;
