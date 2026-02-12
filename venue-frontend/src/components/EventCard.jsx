import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';

const EventCard = ({ event, type = 'event' }) => {
  const { _id, title, description, startDate, endDate, location, price, category, image } = event;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const startDateObj = formatDate(startDate);
  const startTime = formatTime(startDate);

  return (
    <Link to={type === 'movie' ? `/movies/${_id}` : `/event/${_id}`} className="block h-full group">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-gradient-to-br from-bgCard to-bgCard/80 rounded-2xl overflow-hidden border border-borderSubtle h-full flex flex-col hover:border-accentOrange/40 hover:shadow-2xl hover:shadow-accentOrange/10 transition-all duration-500 backdrop-blur-sm"
      >
        {/* Image Container with Overlay */}
        <div className="relative overflow-hidden">
          <motion.img 
            src={image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'} 
            alt={title} 
            className="w-full h-auto object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Category Badge */}
          {category && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 px-3 py-1.5 bg-accentOrange/90 backdrop-blur-md rounded-full"
            >
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {category}
              </span>
            </motion.div>
          )}

          {/* Date Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg text-center min-w-[60px]">
            <div className="text-2xl font-bold text-gray-900 leading-none">
              {startDateObj.day}
            </div>
            <div className="text-xs font-semibold text-accentOrange uppercase tracking-wide mt-0.5">
              {startDateObj.month}
            </div>
          </div>

          {/* Price Tag */}
          <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/10">
            <span className="text-lg font-bold text-white">
              {price ? `₹${price}` : 'FREE'}
            </span>
          </div>
        </div>
        
        {/* Content Container */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-2xl font-bold text-textPrimary mb-3 line-clamp-2 leading-tight group-hover:text-accentOrange transition-colors duration-300">
            {title}
          </h3>
          
          {/* Event Details */}
          <div className="space-y-2.5 mb-4">
            {/* Date & Time */}
            <div className="flex items-center gap-2 text-textMuted">
              <Calendar className="w-4 h-4 text-accentOrange flex-shrink-0" />
              <span className="text-sm font-medium">
                {startDateObj.fullDate} {type !== 'movie' && `• ${startTime}`}
              </span>
            </div>
            
            {/* Location or Runtime */}
            {(location || (type === 'movie' && event.runtime)) && (
              <div className="flex items-center gap-2 text-textMuted">
                {type === 'movie' ? (
                   <Clock className="w-4 h-4 text-accentOrange flex-shrink-0" />
                ) : (
                   <MapPin className="w-4 h-4 text-accentOrange flex-shrink-0" />
                )}
                <span className="text-sm font-medium line-clamp-1">
                  {type === 'movie' ? event.runtime : location}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-textMuted text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
            {description || 'Join us for an amazing event experience!'}
          </p>
          
          {/* CTA Button */}
          <motion.div 
            className="mt-auto pt-5 border-t border-borderSubtle group-hover:border-accentOrange/30 transition-colors duration-300"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-textPrimary uppercase tracking-wide">
                Get Tickets
              </span>
              <motion.div
                className="w-10 h-10 rounded-full bg-accentOrange/10 group-hover:bg-accentOrange flex items-center justify-center transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight className="w-5 h-5 text-accentOrange group-hover:text-white transition-colors duration-300" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-accentOrange/5 via-transparent to-transparent rounded-2xl" />
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;
