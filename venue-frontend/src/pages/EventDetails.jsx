import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import SEO from '../components/ui/SEO';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Failed to fetch event", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-2 border-accentOrange rounded-full animate-spin border-t-transparent" /></div>;
  if (!event) return <div className="text-center pt-20">Event not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <SEO 
        title={event.title} 
        description={event.description.substring(0, 150)} 
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="relative h-[400px] rounded-2xl overflow-hidden group">
          <img 
            src={event.image || 'https://via.placeholder.com/1200x600'} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bgPrimary via-transparent to-transparent opacity-90" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-4">
                 <span className="px-3 py-1 bg-accentOrange text-white text-xs font-bold uppercase tracking-wider rounded-full">
                   Event
                 </span>
                 <span className="text-textMuted font-medium">
                   {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                 </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>
            </motion.div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-2xl font-bold text-white mb-4">About the Event</h3>
              <p className="text-textMuted text-lg leading-relaxed">{event.description}</p>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-bgCard border border-borderSubtle rounded-xl p-6 sticky top-24 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Ready to join?</h4>
                <p className="text-sm text-textMuted">Book your slot now to secure your entry.</p>
              </div>
              
              <Link to={`/event/${id}/slots`} className="block">
                <Button variant="primary" className="w-full">
                  View Available Slots
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventDetails;
