import { motion } from 'framer-motion';
import Border2 from '../../assets/border-2 move.jpg';
import KaranAujla from '../../assets/p-pop(karan aujla concert).jpg';
import JLF from '../../assets/JLF.webp';

const Categories = () => {
  const categories = [
    {
      id: 'cinema',
      title: 'Cinema',
      image: Border2,
      desc: 'Premiere screenings & festivals'
    },
    {
      id: 'live',
      title: 'Live',
      image: KaranAujla,
      desc: 'Concerts & performances'
    },
    {
      id: 'culture',
      title: 'Culture',
      image: JLF,
      desc: 'Art, literature & heritage'
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-bgPrimary relative z-10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
             Curated <span className="text-accentOrange">Collections</span>
          </h2>
          <p className="text-textMuted text-lg max-w-xl">
             Explore our hand-picked selections across Jaipur's most vibrant entertainment sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, i) => (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-video md:aspect-[3/4] overflow-hidden rounded-2xl mb-6 relative">
                 <img 
                   src={cat.image} 
                   alt={cat.title} 
                   loading="lazy"
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                 
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-bold tracking-wider uppercase text-sm">
                       Explore {cat.title}
                    </div>
                 </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-2">{cat.title}</h3>
              <p className="text-textMuted">{cat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
