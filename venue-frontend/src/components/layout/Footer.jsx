import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../../assets/venue-logo.png';

const Footer = () => {
  return (
    <footer className="relative bg-black text-white pt-12 md:pt-24 pb-8 md:pb-12 border-t border-white/5 font-sans overflow-hidden">
      
      {/* Dynamic Background Text (Hidden on mobile to save performance/distraction) */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center overflow-hidden pointer-events-none opacity-[0.03] select-none">
        <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="whitespace-nowrap flex"
        >
             <span className="text-[12vw] font-black uppercase tracking-tighter mx-8">Venue</span>
             <span className="text-[12vw] font-black uppercase tracking-tighter mx-8">Experience</span>
             <span className="text-[12vw] font-black uppercase tracking-tighter mx-8">Venue</span>
             <span className="text-[12vw] font-black uppercase tracking-tighter mx-8">Experience</span>
        </motion.div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-12 md:mb-24">
            
            {/* Column 1: Brand (Full width on mobile) */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-start gap-4 md:gap-6">
                <Link to="/" className="flex items-center gap-2 group">
                     <img src={logo} alt="Venue Logo" className="h-8 md:h-12 w-auto " /> 
                    <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">VENUE</span>
                </Link>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-[240px]">
                    Discover and book real-world experiences.
                </p>
                <div className="flex gap-4 mt-2">
                    <a href="#" className="text-zinc-500 hover:text-accentOrange transition-colors">
                        <Github className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-accentOrange transition-colors">
                        <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-accentOrange transition-colors">
                        <Linkedin className="w-5 h-5" />
                    </a>
                </div>
            </div>

            {/* Column 2: Explore */}
            <div className="mt-4 md:mt-0">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 md:mb-6">Explore</h4>
                <ul className="space-y-2 md:space-y-4 text-sm text-zinc-400">
                    <li><Link to="/events" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Events</Link></li>
                    <li><Link to="/events" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Workshops</Link></li>
                    <li><Link to="/events" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Comedy</Link></li>
                    <li><Link to="/events" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Music</Link></li>
                    <li><Link to="/events" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Sports</Link></li>
                </ul>
            </div>

            {/* Column 3: Product */}
            <div className="mt-4 md:mt-0">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 md:mb-6">Product</h4>
                <ul className="space-y-2 md:space-y-4 text-sm text-zinc-400">
                    <li><Link to="/bookings" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">My Bookings</Link></li>
                    <li><Link to="/favorites" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Favorites</Link></li>
                    <li><Link to="/create-event" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Create Event</Link></li>
                    <li><Link to="/help" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Help Center</Link></li>
                </ul>
            </div>

            {/* Column 4: Company */}
            <div className="mt-4 md:mt-0">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 md:mb-6">Company</h4>
                 <ul className="space-y-2 md:space-y-4 text-sm text-zinc-400">
                    <li><Link to="/about" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">About</Link></li>
                    <li><Link to="/careers" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Careers</Link></li>
                    <li><Link to="/contact" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Contact</Link></li>
                    <li><Link to="/privacy" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="hover:text-accentOrange hover:underline underline-offset-4 decoration-accentOrange/30 transition-all">Terms</Link></li>
                </ul>
            </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
            <p>© 2026 VENUE</p>
            <p>Built by Piyush</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
