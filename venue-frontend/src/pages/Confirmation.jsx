import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // In a real app, retrieve booking details from ID, here we use state passed from checkout
  const { bookingData, totalAmount } = location.state || {};

  if (!bookingData) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
           <h2 className="text-2xl font-bold mb-4">No Booking Found</h2>
           <Link to="/events"><Button>Browse Events</Button></Link>
        </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center pb-20">
       <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ type: "spring", duration: 0.6 }}
         className="w-full max-w-lg"
       >
          <Card className="text-center p-12 border-accentOrange/30 shadow-[0_0_50px_rgba(242,140,40,0.1)]">
             <div className="w-20 h-20 bg-accentOrange/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accentOrange">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
             </div>
             
             <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h1>
             <p className="text-textMuted mb-8">Your tickets have been sent to your email.</p>
             
             <div className="bg-bgSecondary rounded-xl p-6 mb-8 text-left space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accentOrange" />
                <div className="flex justify-between text-sm">
                   <span className="text-textMuted">Amount Paid</span>
                   <span className="text-white font-bold">${totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-textMuted">Booking ID</span>
                   <span className="text-white font-mono">#VN-{Math.floor(Math.random()*10000)}</span>
                </div>
             </div>
             
             <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/bookings')}>
                   My Bookings
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>
                   Back to Home
                </Button>
             </div>
          </Card>
       </motion.div>
    </div>
  );
};

export default Confirmation;
