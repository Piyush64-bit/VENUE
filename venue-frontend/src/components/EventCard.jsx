import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const { _id, title, description, date, image } = event;
  
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/event/${_id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-bgCard rounded-xl overflow-hidden border border-borderSubtle group h-full flex flex-col hover:border-accentOrange/30 hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
      >
        <div className="h-56 overflow-hidden relative">
          <img 
            src={image || 'https://via.placeholder.com/400x200?text=Event'} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bgCard to-transparent opacity-60" />
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <p className="text-accentOrange text-xs font-bold uppercase tracking-wider mb-2">{formattedDate}</p>
          <h3 className="text-xl font-bold text-textPrimary mb-3 line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-textMuted text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
            {description}
          </p>
          
          <div className="mt-auto pt-4 border-t border-borderSubtle flex justify-between items-center group-hover:border-accentOrange/20 transition-colors">
             <span className="text-sm font-semibold text-textPrimary">
                View Details
             </span>
             <motion.span 
               className="text-accentOrange"
               initial={{ x: 0 }}
               whileHover={{ x: 5 }}
             >
               &rarr;
             </motion.span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;
