import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Film, Edit, Trash2, Globe, Lock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/NotificationToast';
import { Skeleton } from '../../components/ui/Skeleton';

const OrganizerMovies = () => {
  const queryClient = useQueryClient();

  // Fetch movies
  const { data: moviesData, isLoading } = useQuery({
    queryKey: ['organizer-movies'],
    queryFn: organizerApi.getMyMovies
  });

  const movies = moviesData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: organizerApi.deleteMovie,
    onSuccess: () => {
      showToast('Movie deleted successfully', 'success');
      queryClient.invalidateQueries(['organizer-movies']);
      queryClient.invalidateQueries(['organizer-stats']);
    },
    onError: (err) => showToast(err.response?.data?.message || 'Delete failed', 'error')
  });

  // Publish toggle mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, publish }) => organizerApi.toggleMoviePublish(id, publish),
    onSuccess: (data, variables) => {
      showToast(`Movie ${variables.publish ? 'published' : 'unpublished'}`, 'success');
      queryClient.invalidateQueries(['organizer-movies']);
    },
    onError: (err) => showToast(err.response?.data?.message || 'Action failed', 'error')
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure? This will delete all associated slots.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (movie) => {
    publishMutation.mutate({ id: movie._id, publish: !movie.isPublished });
  };

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">My Movies</h1>
            <p className="text-textMuted">Manage your movies and showtimes</p>
          </div>
          <Link to="/organizer/movies/new">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Movie
            </Button>
          </Link>
        </div>

        {/* Movies Grid */}
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
        ) : movies.length === 0 ? (
          <Card className="bg-bgCard border-white/10 p-12 text-center">
            <Film className="w-16 h-16 text-textMuted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Movies Yet</h3>
            <p className="text-textMuted mb-6">Add your first movie to get started</p>
            <Link to="/organizer/movies/new">
              <Button variant="primary">Add Movie</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <motion.div
                key={movie._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-bgCard border-white/10 hover:border-accentOrange/30 transition-all group overflow-hidden">
                  {/* Poster */}
                  <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-accentOrange/20 overflow-hidden">
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        movie.isPublished 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {movie.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{movie.title}</h3>
                      <p className="text-sm text-textMuted line-clamp-2">{movie.description || 'No description'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-textMuted block">Genre:</span>
                        <span className="text-white font-medium">{movie.genre || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block">Duration:</span>
                        <span className="text-white font-medium">{movie.duration || 'N/A'} min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textMuted">Price:</span>
                      <span className="text-accentOrange font-bold">₹{movie.price || 0}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                      <Link to={`/organizer/movies/${movie._id}/edit`} className="flex-1">
                        <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-xs">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/organizer/movies/${movie._id}/slots`} className="flex-1">
                        <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-xs">
                          <Calendar className="w-3 h-3" />
                          Slots
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(movie)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title={movie.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {movie.isPublished ? <Lock className="w-4 h-4 text-yellow-400" /> : <Globe className="w-4 h-4 text-green-400" />}
                      </button>
                      <button
                        onClick={() => handleDelete(movie._id)}
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

export default OrganizerMovies;
