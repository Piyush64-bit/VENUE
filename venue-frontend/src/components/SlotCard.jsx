import { motion } from 'framer-motion';

const SlotCard = ({ slot, onBook, isProcessing }) => {
  const { startTime, endTime, capacity, booked, waitlist } = slot;
  
  // Logic to determine status
  const isFull = booked >= capacity;
  const available = capacity - booked;
  
  // Format time
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      whileHover={!isFull ? { scale: 1.02, borderColor: '#F28C28' } : {}}
      className={`
        relative p-6 rounded-xl border transition-all duration-300 flex items-center justify-between
        ${isFull 
          ? 'bg-bgCard/50 border-borderSubtle opacity-60 grayscale-[0.8] cursor-not-allowed' 
          : 'bg-bgCard border-accentOrange shadow-lg shadow-orange-900/5 hover:shadow-orange-900/10 cursor-pointer'}
      `}
    >
      <div>
        <h4 className={`text-lg font-bold mb-1 ${isFull ? 'text-textMuted' : 'text-textPrimary'}`}>
          {formatTime(startTime)} - {formatTime(endTime)}
        </h4>
        <div className="flex items-center gap-2 text-sm">
          {isFull ? (
            <span className="flex items-center gap-2 text-accentOrange font-medium">
              <span className="w-2 h-2 rounded-full border border-accentOrange" />
              Waitlist Only
            </span>
          ) : (
            <span className="text-green-500 font-medium">
              {available} spots available
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onBook(slot)}
        disabled={isProcessing}
        className={`
          px-5 py-2 rounded-lg text-sm font-semibold transition-all transform active:scale-95
          ${isFull
            ? 'border border-accentOrange text-accentOrange hover:bg-accentOrange/10'
            : 'bg-accentOrange text-white hover:bg-accentHover shadow-md'}
          disabled:opacity-50 disabled:cursor-wait
        `}
      >
        {isFull ? 'Join Waitlist' : 'Book'}
      </button>
    </motion.div>
  );
};

export default SlotCard;
