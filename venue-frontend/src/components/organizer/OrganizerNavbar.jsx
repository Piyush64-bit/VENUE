import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/venue-logo.png';
import { Button } from '../ui/Button';
import { Building2, LogOut, LayoutDashboard, Calendar, Film, Settings, ChevronDown } from 'lucide-react';

const OrganizerNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    const handleClickOutside = (event) => {
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setIsProfileOpen(false);
        }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/organizer/login');
    setIsProfileOpen(false);
  };

  const navLinks = [
    { name: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
    { name: 'My Events', path: '/organizer/events', icon: Calendar },
    { name: 'My Movies', path: '/organizer/movies', icon: Film },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-bgPrimary/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/organizer/dashboard" className="flex items-center gap-3 group">
          <img src={logo} alt="Venue Logo" className="h-8 w-auto group-hover:opacity-90 transition-opacity" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-textPrimary group-hover:opacity-90 transition-opacity">
              VENUE<span className="text-accentOrange">.</span>
            </span>
            <span className="text-xs font-bold text-accentOrange/70 uppercase tracking-wider">Organizer</span>
          </div>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    location.pathname === link.path 
                      ? 'text-white' 
                      : 'text-textMuted hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="w-px h-6 bg-borderSubtle" />

          {user ? (
            <div className="relative" ref={profileRef}>
              <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="group relative flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 backdrop-blur-md"
              >
                  {/* Glowing Ring Container */}
                  <div className="relative w-9 h-9">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accentOrange to-purple-500 animate-spin-slow opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity" />
                      <div className="absolute inset-[1.5px] rounded-full bg-bgPrimary z-10 flex items-center justify-center overflow-hidden border border-white/10">
                         {/* Avatar Content */}
                         <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <span className="text-xs font-black text-white/90 font-mono">{user.name.charAt(0)}</span>
                         </div>
                      </div>
                  </div>
                  
                  {/* Text Label */}
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors uppercase tracking-wider hidden sm:block">
                          Organizer
                      </span>
                      <ChevronDown className={`w-3 h-3 text-white/30 group-hover:text-accentOrange transition-colors duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </div>
              </button>

              {/* Premium Glass Dropdown */}
              <AnimatePresence>
                  {isProfileOpen && (
                      <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95, rotateX: -10 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95, rotateX: -10 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          className="absolute top-14 right-0 w-72 bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5 z-50 origin-top-right"
                      >
                          {/* Cyber Accent Line */}
                          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accentOrange to-transparent opacity-50" />

                          {/* Header: User Identity */}
                          <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-12 bg-accentOrange/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Organizer Account</p>
                              <p className="text-lg font-black text-white leading-tight truncate">{user.name}</p>
                          </div>
                          
                          {/* Navigation Links */}
                          <div className="p-2 space-y-1">
                              {/* 1. Dashboard */}
                              <Link 
                                to="/organizer/dashboard" 
                                onClick={() => setIsProfileOpen(false)} 
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                              >
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-accentOrange group-hover:bg-accentOrange/10 transition-colors">
                                      <LayoutDashboard className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors block">Dashboard</span>
                                      <span className="text-[10px] text-white/30 hidden group-hover:block transition-all">Overview & Stats</span>
                                  </div>
                                  <ChevronDown className="w-3 h-3 text-white/20 -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all" />
                              </Link>

                              {/* 2. Settings */}
                              <Link 
                                to="/organizer/settings"
                                onClick={() => setIsProfileOpen(false)} 
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                              >
                                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                      <Settings className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors block">Settings</span>
                                  </div>
                              </Link>
                          </div>

                          {/* Footer Actions */}
                          <div className="p-2 border-t border-white/5 bg-black/40 backdrop-blur-md">
                              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors group">
                                  <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                  Sign Out
                              </button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/organizer/login">
                <Button variant="ghost" className="px-4 py-2 text-sm h-auto">
                  Login
                </Button>
              </Link>
              <Link to="/organizer/register">
                <Button variant="primary" className="px-5 py-2 text-sm h-auto shadow-none">
                  Register as Organizer
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default OrganizerNavbar;
