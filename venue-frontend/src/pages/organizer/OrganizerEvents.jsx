import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, Edit, Trash2, Globe, Lock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/NotificationToast';
import { Skeleton } from '../../components/ui/Skeleton';

const OrganizerEvents = () => {
  const queryClient = useQueryClient();

  // Fetch events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: organizerApi.getMyEvents
  });

  const events = eventsData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: organizerApi.deleteEvent,
    onSuccess: () => {
      showToast('Event deleted successfully', 'success');
      queryClient.invalidateQueries(['organizer-events']);
      queryClient.invalidateQueries(['organizer-stats']);
    },
    onError: (err) => showToast(err.response?.data?.message || 'Delete failed', 'error')
  });

  // Publish toggle mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, publish }) => organizerApi.toggleEventPublish(id, publish),
    onSuccess: (data, variables) => {
      showToast(`Event ${variables.publish ? 'published' : 'unpublished'}`, 'success');
      queryClient.invalidateQueries(['organizer-events']);
    },
    onError: (err) => showToast(err.response?.data?.message || 'Action failed', 'error')
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure? This will delete all associated slots.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (event) => {
    publishMutation.mutate({ id: event._id, publish: !event.isPublished });
  };

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">My Events</h1>
            <p className="text-textMuted">Manage your events and slots</p>
          </div>
          <Link to="/organizer/events/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-bgCard border-white/10 p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-bgCard border-white/10 p-12 text-center">
            <Calendar className="w-16 h-16 text-textMuted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Events Yet</h3>
            <p className="text-textMuted mb-6">Create your first event to get started</p>
            <Link to="/organizer/events/new">
              <Button variant="primary">Create Event</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-bgCard border-white/10 hover:border-accentOrange/30 transition-all group overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-accentOrange/20 to-purple-500/20 overflow-hidden">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        event.isPublished 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                      <p className="text-sm text-textMuted line-clamp-2">{event.description || 'No description'}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textMuted">Price:</span>
                      <span className="text-accentOrange font-bold">₹{event.price || 0}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <Link to={`/organizer/events/${event._id}/edit`} className="flex-1">
                        <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-xs">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${event._id}/slots`} className="flex-1">
                        <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-xs">
                          <Calendar className="w-3 h-3" />
                          Slots
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(event)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title={event.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {event.isPublished ? <Lock className="w-4 h-4 text-yellow-400" /> : <Globe className="w-4 h-4 text-green-400" />}
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEvents;
