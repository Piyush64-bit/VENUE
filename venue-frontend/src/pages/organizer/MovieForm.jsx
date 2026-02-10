import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/NotificationToast';
import { Controller } from 'react-hook-form';
import ImageUpload from '../../components/ui/ImageUpload';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description is too short'),
  releaseDate: z.string(),
  runtime: z.string().min(1, 'Runtime is required (e.g., 2h 30m)'),
  poster: z.string().url('Invalid URL').optional().or(z.literal('')),
  genre: z.string().optional(),
  rating: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().min(0).max(10)),
  price: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().min(0))
});

const MovieForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, control } = useForm({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      rating: 0,
      price: 250,
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800'
    }
  });

  // Fetch data if edit
  const { data: movieData } = useQuery({
    queryKey: ['organizer-movie', id],
    queryFn: async () => {
        const res = await organizerApi.getMyMovies();
        return res.data.find(m => m._id === id);
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (movieData) {
      setValue('title', movieData.title);
      setValue('description', movieData.description);
      setValue('releaseDate', new Date(movieData.releaseDate).toISOString().slice(0, 10)); // Date only
      setValue('runtime', movieData.runtime);
      setValue('poster', movieData.poster);
      setValue('genre', movieData.genre);
      setValue('rating', movieData.rating);
      setValue('price', movieData.price);
    }
  }, [movieData, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit 
      ? organizerApi.updateMovie(id, data)
      : organizerApi.createMovie(data),
    onSuccess: () => {
      showToast(`Movie ${isEdit ? 'updated' : 'created'} successfully`, 'success');
      queryClient.invalidateQueries(['organizer-movies']);
      navigate('/organizer/dashboard');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-accentOrange" onClick={() => navigate('/organizer/dashboard')}>
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <Card className="bg-bgCard border-white/10 p-8">
          <h1 className="text-3xl font-bold text-white mb-8">{isEdit ? 'Edit Movie' : 'Create New Movie'}</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input type="date" label="Release Date" error={errors.releaseDate?.message} {...register('releaseDate')} />
               <Input label="Runtime" placeholder="e.g. 2h 30m" error={errors.runtime?.message} {...register('runtime')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Rating (0-10)" type="number" step="0.1" error={errors.rating?.message} {...register('rating')} />
               <Input label="Genre" placeholder="Drama, Sci-Fi..." {...register('genre')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label="Price (₹)" type="number" error={errors.price?.message} {...register('price')} />
            </div>

            <Controller
                name="poster"
                control={control}
                render={({ field }) => (
                    <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        label="Movie Poster" 
                    />
                )}
            />
            {errors.poster && <p className="text-red-500 text-xs mt-1">{errors.poster.message}</p>}

            <div>
               <label className="block text-sm font-medium text-textMuted mb-2">Description</label>
               <textarea 
                 {...register('description')}
                 className="w-full bg-bgPrimary border border-white/10 rounded-lg p-3 text-white focus:border-accentOrange outline-none min-h-[150px]"
               />
               {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting || mutation.isPending}>
              {isEdit ? 'Update Movie' : 'Create Movie'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default MovieForm;
