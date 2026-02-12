import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/NotificationToast';
import { Skeleton } from '../../components/ui/Skeleton';

const SlotManager = ({ type }) => { // type: 'event' | 'movie'
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Queries
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['organizer-slots', id],
    queryFn: () => organizerApi.getSlots(id, type)
  });

  const slots = slotsData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => organizerApi.createSlot(id, type, data),
    onSuccess: () => {
      showToast('Slot added successfully', 'success');
      queryClient.invalidateQueries(['organizer-slots', id]);
      setIsAdding(false);
      reset();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to add slot', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId) => organizerApi.deleteSlot(slotId),
    onSuccess: () => {
      showToast('Slot deleted successfully', 'success');
      queryClient.invalidateQueries(['organizer-slots', id]);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Delete failed (bookings exist?)', 'error');
    }
  });

  // Auto-generate mutation (Demo/Portfolio feature)
  const autoGenerateMutation = useMutation({
    mutationFn: () => organizerApi.autoGenerateSlots(id, type),
    onSuccess: (response) => {
      const count = response.data?.count || 0;
      showToast(`🎉 Generated ${count} slots successfully!`, 'success');
      queryClient.invalidateQueries(['organizer-slots', id]);
      setShowAutoModal(false);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Auto-generation failed', 'error');
    }
  });

  // Modal state
  const [showAutoModal, setShowAutoModal] = useState(false);

  // Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {

    // Combine date + time if needed, or backend handles it.
    // Backend expects: date (ISO), startTime (string), endTime (string), capacity (number)
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-accentOrange" onClick={() => navigate('/organizer/dashboard')}>
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-8">
            <div>
                 <h1 className="text-3xl font-bold text-white mb-2">Manage Slots</h1>
                 <p className="text-textMuted">Add or remove showtimes/sessions for this {type}.</p>
            </div>
            <div className="flex gap-3">
                <Button 
                    variant="secondary" 
                    onClick={() => setShowAutoModal(true)}
                    className="border-accentOrange text-accentOrange hover:bg-accentOrange/10"
                >
                    ⚡ Auto Generate (Demo)
                </Button>
                <Button variant="primary" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : 'Add Slot'}
                </Button>
            </div>
        </div>

        {/* Auto-Generate Confirmation Modal */}
        {showAutoModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
                <Card className="bg-bgCard border-white/10 p-6 max-w-md mx-4 animate-in zoom-in-95">
                    <h3 className="text-xl font-bold text-white mb-4">🎬 Auto-Generate Slots?</h3>
                    <p className="text-textMuted mb-2">
                        This will automatically create <span className="text-white font-bold">3 slots per day</span> for this {type}:
                    </p>
                    <ul className="text-sm text-textMuted mb-6 space-y-1 ml-4">
                        {type === 'movie' ? (
                            <>
                                <li>• Morning: 10:00-13:00</li>
                                <li>• Matinee: 14:00-17:00</li>
                                <li>• Evening: 18:00-21:00</li>
                                <li className="text-accentOrange mt-2">• 90 days of slots (270 total)</li>
                            </>
                        ) : (
                            <>
                                <li>• Morning: 09:00-12:00</li>
                                <li>• Afternoon: 14:00-17:00</li>
                                <li>• Evening: 19:00-22:00</li>
                                <li className="text-accentOrange mt-2">• Based on event date range</li>
                            </>
                        )}
                    </ul>
                    <p className="text-xs text-textMuted/70 mb-6">
                        Days with existing slots will be skipped.
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowAutoModal(false)}
                            disabled={autoGenerateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => autoGenerateMutation.mutate()}
                            isLoading={autoGenerateMutation.isPending}
                        >
                            Generate Slots
                        </Button>
                    </div>
                </Card>
            </div>
        )}


        {/* Add Slot Form */}
        {isAdding && (
            <Card className="bg-bgCard border-white/10 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-xl font-bold text-white mb-4">New Slot</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Date" {...register('date', { required: 'Date is required' })} error={errors.date?.message} />
                        <Input type="number" label="Capacity" {...register('capacity', { required: 'Capacity is required', min: 1 })} error={errors.capacity?.message} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="time" label="Start Time" {...register('startTime', { required: 'Start time is required' })} error={errors.startTime?.message} />
                        <Input type="time" label="End Time" {...register('endTime', { required: 'End time is required' })} error={errors.endTime?.message} />
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save Slot</Button>
                    </div>
                </form>
            </Card>
        )}

        {/* Slots List */}
        {loadingSlots ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
        ) : slots.length === 0 ? (
             <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                 <p className="text-textMuted">No slots found. Add one above.</p>
             </div>
        ) : (
            <div className="space-y-4">
                {slots.map(slot => (
                    <div key={slot._id} className="bg-bgCard border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-6">
                            <div className="bg-white/5 p-3 rounded-lg text-center min-w-[80px]">
                                <div className="text-xs text-accentOrange font-bold uppercase">{new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                                <div className="text-xl font-bold text-white">{new Date(slot.date).getDate()}</div>
                            </div>
                            <div>
                                <div className="text-white font-bold text-lg">{slot.startTime} - {slot.endTime}</div>
                                <div className="text-textMuted text-sm flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    {slot.availableSeats} / {slot.capacity} seats available
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                                if(window.confirm('Delete this slot?')) deleteMutation.mutate(slot._id);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default SlotManager;
