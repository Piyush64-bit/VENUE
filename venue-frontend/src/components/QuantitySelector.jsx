import { motion } from 'framer-motion';

const QuantitySelector = ({ quantity, setQuantity, max = 5 }) => {
  const decrease = () => setQuantity(q => Math.max(1, q - 1));
  const increase = () => setQuantity(q => Math.min(max, q + 1));

  return (
    <div className="flex items-center space-x-3 bg-bgSecondary p-1 rounded-lg border border-borderSubtle w-fit">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={decrease}
        disabled={quantity <= 1}
        className="w-8 h-8 flex items-center justify-center bg-bgCard text-textPrimary rounded hover:bg-borderSubtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &minus;
      </motion.button>
      
      <span className="text-textPrimary font-semibold w-8 text-center text-sm">{quantity}</span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={increase}
        disabled={quantity >= max}
        className="w-8 h-8 flex items-center justify-center bg-bgCard text-textPrimary rounded hover:bg-borderSubtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </motion.button>
    </div>
  );
};

export default QuantitySelector;
