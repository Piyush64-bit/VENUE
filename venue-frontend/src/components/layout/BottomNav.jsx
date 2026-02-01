import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Ticket, Film, User, LogIn, LayoutDashboard, Heart, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Close popup on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsProfileOpen(false);
    };

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Events', path: '/events', icon: Ticket },
        { name: 'Movies', path: '/movies', icon: Film },
        // The last item is dynamic based on auth
        user 
            ? { name: 'Profile', path: '#', icon: User, action: () => setIsProfileOpen(!isProfileOpen) }
            : { name: 'Login', path: '/login', icon: LogIn }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            
            {/* Pop-up Menu for Profile (Only auth users) */}
            <AnimatePresence>
                {isProfileOpen && user && (
                    <motion.div
                        ref={profileRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-24 right-4 left-4 bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5 z-50 max-w-sm mx-auto"
                    >
                         {/* Cyber Accent Line */}
                         <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accentOrange to-transparent opacity-50" />

                         {/* Header: User Identity */}
                         <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-12 bg-accentOrange/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Signed in as</p>
                              <p className="text-lg font-black text-white leading-tight truncate">{user.name}</p>
                         </div>
                         
                         {/* Navigation Links */}
                         <div className="p-2 space-y-1">
                             <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                     <User className="w-4 h-4" />
                                 </div>
                                 <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex-1">Profile</span>
                                 <ChevronDown className="w-3 h-3 text-white/20 -rotate-90" />
                             </Link>
                             <Link to="/bookings" onClick={() => setIsProfileOpen(false)} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-accentOrange group-hover:bg-accentOrange/10 transition-colors">
                                     <Ticket className="w-4 h-4" />
                                 </div>
                                 <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex-1">Bookings</span>
                                 <ChevronDown className="w-3 h-3 text-white/20 -rotate-90" />
                             </Link>
                             <Link to="/favorites" onClick={() => setIsProfileOpen(false)} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-red-500 group-hover:bg-red-500/10 transition-colors">
                                     <Heart className="w-4 h-4" />
                                 </div>
                                 <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex-1">Favorites</span>
                                 <ChevronDown className="w-3 h-3 text-white/20 -rotate-90" />
                             </Link>
                             <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                     <Settings className="w-4 h-4" />
                                 </div>
                                 <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors flex-1">Settings</span>
                             </Link>
                         </div>

                         {/* Footer Actions */}
                         <div className="p-2 border-t border-white/5 bg-black/40 backdrop-blur-md">
                             <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors justify-center">
                                 <LogOut className="w-3 h-3" />
                                 Sign Out
                             </button>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Glass Container for Nav Items */}
            <div className="bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-5">
                <div className="flex items-center justify-between max-w-sm mx-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.name === 'Profile' && isProfileOpen);
                        const Icon = item.icon;

                        return (
                            <div key={item.name} className="relative">
                                {item.action ? (
                                    <button 
                                        onClick={item.action} 
                                        className="relative flex flex-col items-center gap-1 p-2 group w-full"
                                    >
                                        {/* Logic for active/inactive state similar to Links */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottomNavIndicator"
                                                className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <div className={`relative p-1 transition-all duration-300 ${isActive ? 'text-accentOrange -translate-y-1' : 'text-white/40 group-hover:text-white'}`}>
                                            <Icon strokeWidth={isActive ? 2.5 : 2} className="w-6 h-6" />
                                            {isActive && (
                                                <div className="absolute inset-0 bg-accentOrange/20 blur-lg rounded-full" />
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                                            {item.name}
                                        </span>
                                    </button>
                                ) : (
                                    <Link to={item.path} className="relative flex flex-col items-center gap-1 p-2 group">
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottomNavIndicator"
                                                className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <div className={`relative p-1 transition-all duration-300 ${isActive ? 'text-accentOrange -translate-y-1' : 'text-white/40 group-hover:text-white'}`}>
                                            <Icon strokeWidth={isActive ? 2.5 : 2} className="w-6 h-6" />
                                            {isActive && (
                                                <div className="absolute inset-0 bg-accentOrange/20 blur-lg rounded-full" />
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                                            {item.name}
                                        </span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
