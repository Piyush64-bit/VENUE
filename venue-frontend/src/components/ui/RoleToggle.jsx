import { Link, useLocation } from 'react-router-dom';
import { User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RoleToggle = () => {
  const location = useLocation();
  const isOrganizer = location.pathname.startsWith('/organizer');
  
  // Determine the target path based on current page
  const getTargetPath = () => {
    if (location.pathname.includes('register')) {
      return isOrganizer ? '/register' : '/organizer/register';
    }
    return isOrganizer ? '/login' : '/organizer/login';
  };

  return (
    <div className="inline-flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/10">
      <Link
        to="/login"
        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          !isOrganizer
            ? 'text-white'
            : 'text-textMuted hover:text-white'
        }`}
      >
        {!isOrganizer && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-white/10 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <User className="w-4 h-4" />
          User
        </span>
      </Link>

      <Link
        to="/organizer/login"
        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          isOrganizer
            ? 'text-white'
            : 'text-textMuted hover:text-white'
        }`}
      >
        {isOrganizer && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-accentOrange/20 rounded-full border border-accentOrange/30"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Organizer
        </span>
      </Link>
    </div>
  );
};

export default RoleToggle;
