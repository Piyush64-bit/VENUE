import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Star } from 'lucide-react';

const MovieCard = ({ movie }) => {
  const { _id, title, description, releaseDate, runtime, price, genre, poster, rating } = movie;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear()
    };
  };

  const releaseDateObj = formatDate(releaseDate);

  return (
    <Link to={`/movies/${_id}`} className="block h-full group">
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-bgCard rounded-2xl overflow-hidden border border-white/10 h-full flex flex-col hover:border-accentOrange/40 hover:shadow-2xl hover:shadow-accentOrange/10 transition-all duration-500"
      >
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <motion.img 
            src={poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800'} 
            alt={title} 
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          
          {/* Genre Badge */}
          {genre && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {genre}
              </span>
            </div>
          )}

          {/* Rating Badge */}
          {rating > 0 && (
             <div className="absolute top-4 right-4 flex items-center gap-1 bg-yellow-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-black font-bold text-xs shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                <span>{rating}</span>
             </div>
          )}
        </div>
        
        {/* Content Container */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-accentOrange transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-textMuted mb-3">
             <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accentOrange" />
                <span>{releaseDateObj.month} {releaseDateObj.year}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accentOrange" />
                <span>{runtime}</span>
             </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-lg font-bold text-white">
              {price ? `₹${price}` : 'TBA'}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-accentOrange uppercase tracking-wide group-hover:gap-3 transition-all">
               Book Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;
