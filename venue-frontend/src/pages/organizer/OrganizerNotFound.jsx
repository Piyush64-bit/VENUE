import { Link } from 'react-router-dom';
import { Building2, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

const OrganizerNotFound = () => {
  return (
    <div className="min-h-screen bg-bgPrimary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-2xl bg-accentOrange/10 flex items-center justify-center border border-accentOrange/20">
            <Building2 className="w-12 h-12 text-accentOrange" />
          </div>
        </div>

        {/* 404 Text */}
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-9xl font-black text-white mb-4 tracking-tighter"
        >
          404
        </motion.h1>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-textMuted text-lg mb-8 max-w-md mx-auto">
          The organizer page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/organizer/dashboard">
            <Button variant="primary" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accentOrange/30 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-accentOrange/30 animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-accentOrange/30 animate-pulse delay-150" />
        </div>
      </motion.div>
    </div>
  );
};

export default OrganizerNotFound;
