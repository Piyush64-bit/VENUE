import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Ticket, Heart, Settings, CreditCard, RotateCw, Sparkles, MapPin, QrCode, ArrowUpRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useLocation, Link } from 'react-router-dom';

// Mock Data
const TICKETS = [
    { id: 1, title: "Neon Nights", date: "FEB 28", location: "District 9", seats: "A1, A2", image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=500" },
    { id: 2, title: "Interstellar", date: "MAR 05", location: "Galaxy IMAX", seats: "F12", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500" },
    { id: 3, title: "Tech Summit", date: "MAR 15", location: "Convention Ctr", seats: "GEN", image: "https://images.unsplash.com/photo-1505373877741-29a4efa39778?auto=format&fit=crop&q=80&w=500" },
];

const STATS = [
    { label: "XP Points", value: "850", icon: Sparkles, color: "text-yellow-400" },
    { label: "Events", value: "12", icon: Ticket, color: "text-blue-400" },
    { label: "Saved", value: "$120", icon: CreditCard, color: "text-green-400" },
];

const BentoBlock = ({ className, children, onClick, layoutId }) => (
    <motion.div 
        layoutId={layoutId}
        onClick={onClick}
        className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer relative group ${className}`}
    >
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        {children}
    </motion.div>
);



const Profile = () => {
  const { user: authUser } = useAuth();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(null);
  
  const user = authUser || { name: "Alex Carter", email: "alex@example.com", memberSince: "2024" };

  useEffect(() => {
    if (location.state?.focus) {
        setSelectedId(location.state.focus);
        // Clear state to prevent reopening on generic refresh? 
        // Window.history.replaceState({}, document.title) is too aggressive but fine for now.
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-bgPrimary text-white pt-24 pb-12 px-4 md:px-8">
       
       <div className="max-w-7xl mx-auto h-full">
           <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 h-[85vh]">
               
               {/* 1. Identity Block (Top Left - 2x1) */}
               <BentoBlock className="md:col-span-2 md:row-span-1 flex items-center justify-between p-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 cursor-default" layoutId="identity">
                   <div>
                       <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">{user.name}</h2>
                       <div className="flex items-center gap-3">
                           <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-accentOrange border border-accentOrange/20">Pro Member</span>
                           <span className="text-white/40 text-xs font-mono">SINCE {user.memberSince}</span>
                       </div>
                   </div>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accentOrange to-purple-600 p-0.5">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {user.profilePicture ? (
                                <img 
                                    src={user.profilePicture} 
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-black text-white/20">
                                    {user.name.charAt(0)}
                                </span>
                            )}
                        </div>
                    </div>
               </BentoBlock>

                {/* 2. Stats Block (Top Right - 1x1) */}
                <BentoBlock className="md:col-span-1 md:row-span-1 flex flex-col justify-between p-6 bg-black/20" layoutId="stats">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/5 rounded-xl">
                            <Ticket className="w-5 h-5 text-accentOrange" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-white/20" />
                    </div>
                    <div>
                        <span className="text-4xl font-bold text-white block mb-1">{TICKETS.length}</span>
                        <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Total Bookings</span>
                    </div>
                </BentoBlock>

                {/* 3. Settings/Action Block (Top Right - 1x1) */}
               <Link to="/settings" className="contents">
                   <BentoBlock className="md:col-span-1 md:row-span-1 flex flex-col justify-center items-center gap-4 p-6 hover:bg-white/5 group" layoutId="settings">
                       <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                           <Settings className="w-6 h-6 text-white/50 group-hover:text-white" />
                       </div>
                       <span className="text-sm font-bold uppercase tracking-widest text-white/50 group-hover:text-white">Settings</span>
                   </BentoBlock>
               </Link>

               {/* 4. Wallet / Tickets Block (Middle Left - 2x2) */}
               <Link to="/bookings" className="contents">
                    <BentoBlock className="md:col-span-2 md:row-span-2 relative group overflow-hidden" layoutId="wallet">
                        <div className="absolute inset-0">
                            <img src={TICKETS[0].image} alt="" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Ticket className="w-5 h-5 text-accentOrange" />
                                <span className="text-sm font-bold uppercase tracking-widest text-white/80">My Bookings</span>
                            </div>
                            <h3 className="text-3xl font-black text-white leading-none mb-2">{TICKETS[0].title}</h3>
                            <div className="flex items-center gap-4 text-sm font-mono text-white/60">
                                <span>{TICKETS[0].date}</span>
                                <span>•</span>
                                <span>{TICKETS[0].location}</span>
                            </div>
                        </div>

                        {/* Stack effect hints */}
                        <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                            <div className="w-12 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg transform rotate-6" />
                            <div className="w-12 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg transform rotate-12 -mt-12 mr-2" />
                        </div>
                    </BentoBlock>
               </Link>
               
               {/* 5. Favorites (Middle Right - 2x1) */}
               <Link to="/favorites" className="contents">
                   <BentoBlock className="md:col-span-2 md:row-span-1 p-8 flex items-center justify-between" layoutId="favorites">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Favorites</span>
                            </div>
                            <h3 className="text-2xl font-bold">Saved Events</h3>
                        </div>
                        <div className="flex -space-x-4">
                            {TICKETS.map(t => (
                                <div key={t.id} className="w-12 h-12 rounded-full border-2 border-[#0a0a0a] overflow-hidden">
                                    <img src={t.image} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-12 h-12 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-xs font-bold">+5</div>
                        </div>
                   </BentoBlock>
               </Link>

                {/* 6. Quick Action (Bottom Right - 2x1) */}
               <Link to="/events" className="contents">
                   <BentoBlock className="md:col-span-2 md:row-span-1 flex items-center justify-center bg-accentOrange/10 border-accentOrange/20 group hover:bg-accentOrange hover:border-accentOrange" layoutId="explore">
                       <div className="flex items-center gap-4">
                           <span className="text-xl font-black uppercase text-accentOrange group-hover:text-black transition-colors">Explore New Events</span>
                           <ArrowUpRight className="w-6 h-6 text-accentOrange group-hover:text-black transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                       </div>
                   </BentoBlock>
               </Link>

           </div>
       </div>

    </div>
  );
};

export default Profile;
