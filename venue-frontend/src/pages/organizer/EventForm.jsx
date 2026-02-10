import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod'; // We'll define schema here or import
import { ArrowLeft } from 'lucide-react';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/NotificationToast';
import { Controller } from 'react-hook-form';
import ImageUpload from '../../components/ui/ImageUpload';

// Schema
const createEventSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(10, 'Description is too short'),
  startDate: z.string().refine(val => new Date(val) > new Date(), 'Start date must be in the future'),
  endDate: z.string(),
  location: z.string().min(3, 'Location is required'),
  image: z.string().url('Invalid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val))
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

const updateEventSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(10, 'Description is too short'),
  startDate: z.string(), // No future check for updates
  endDate: z.string(),
  location: z.string().min(3, 'Location is required'),
  image: z.string().url('Invalid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val))
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

const EventForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, control } = useForm({
    resolver: zodResolver(isEdit ? updateEventSchema : createEventSchema),
    defaultValues: {
      price: 0,
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'
    }
  });

  // Fetch data if edit
  const { data: eventData } = useQuery({
    queryKey: ['organizer-event', id],
    queryFn: async () => {
        const res = await organizerApi.getMyEvents(); // Inefficient, but API doesn't have getById for organizer yet? 
        // Actually public API has getById, but organizer might want to see draft.
        // Let's rely on dashboard cache or filter locally for now, 
        // Or better: Use the public API getById but that filters isPublished.
        // I need an organizer-specific getById or just find it in the list.
        // For now, let's just find it in the list to save time, or fetch all.
        return res.data.find(e => e._id === id); // Simple hack for now
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (eventData) {
      setValue('title', eventData.title);
      setValue('description', eventData.description);
      setValue('startDate', new Date(eventData.startDate).toISOString().slice(0, 16));
      setValue('endDate', new Date(eventData.endDate).toISOString().slice(0, 16));
      setValue('location', eventData.location);
      setValue('image', eventData.image);
      setValue('category', eventData.category);
      setValue('price', eventData.price);
    }
  }, [eventData, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit 
      ? organizerApi.updateEvent(id, data)
      : organizerApi.createEvent(data),
    onSuccess: () => {
      showToast(`Event ${isEdit ? 'updated' : 'created'} successfully`, 'success');
      queryClient.invalidateQueries(['organizer-events']);
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
          <h1 className="text-3xl font-bold text-white mb-8">{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input type="datetime-local" label="Start Date" error={errors.startDate?.message} {...register('startDate')} />
               <Input type="datetime-local" label="End Date" error={errors.endDate?.message} {...register('endDate')} />
            </div>

            <Input label="Location" error={errors.location?.message} {...register('location')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Price (₹)" type="number" error={errors.price?.message} {...register('price')} />
               <Input label="Category" placeholder="Music, Comedy..." {...register('category')} />
            </div>

            <Controller
                name="image"
                control={control}
                render={({ field }) => (
                    <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        label="Event Image" 
                    />
                )}
            />
            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>}

            <div>
               <label className="block text-sm font-medium text-textMuted mb-2">Description</label>
               <textarea 
                 {...register('description')}
                 className="w-full bg-bgPrimary border border-white/10 rounded-lg p-3 text-white focus:border-accentOrange outline-none min-h-[150px]"
               />
               {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting || mutation.isPending}>
              {isEdit ? 'Update Event' : 'Create Event'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EventForm;
