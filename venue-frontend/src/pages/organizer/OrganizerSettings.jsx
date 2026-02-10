import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Mail, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { organizerApi } from '../../api/organizer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { showToast } from '../../components/NotificationToast';

// Validation Schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address')
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const OrganizerSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('profile');

  // Fetch profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['organizer-profile'],
    queryFn: organizerApi.getProfile
  });

  const profile = profileData?.data || {};

  // Profile form
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile.name || '',
      email: profile.email || ''
    }
  });

  // Password form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: organizerApi.updateProfile,
    onSuccess: () => {
      showToast('Profile updated successfully', 'success');
      queryClient.invalidateQueries(['organizer-profile']);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: organizerApi.changePassword,
    onSuccess: () => {
      showToast('Password changed successfully', 'success');
      resetPassword();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    }
  });

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimary">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center gap-2 text-sm text-textMuted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-light text-white tracking-tight">Settings</h1>
          <p className="text-textMuted mt-2">Manage your account preferences</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <nav className="space-y-1 sticky top-8">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeSection === 'profile'
                    ? 'text-white bg-white/5 border-l-2 border-accentOrange'
                    : 'text-textMuted hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveSection('password')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeSection === 'password'
                    ? 'text-white bg-white/5 border-l-2 border-accentOrange'
                    : 'text-textMuted hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Lock className="w-4 h-4" />
                Password
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-9">
            {activeSection === 'profile' && (
              <div className="border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-light text-white mb-2">Profile Information</h2>
                  <p className="text-sm text-textMuted">Update your account details</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <Input
                    label="Name"
                    placeholder="Your name"
                    error={profileErrors.name?.message}
                    {...registerProfile('name')}
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    error={profileErrors.email?.message}
                    {...registerProfile('email')}
                  />

                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={updateProfileMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetProfile()}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-light text-white mb-2">Change Password</h2>
                  <p className="text-sm text-textMuted">Update your password to keep your account secure</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    error={passwordErrors.currentPassword?.message}
                    {...registerPassword('currentPassword')}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword')}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword')}
                  />

                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={changePasswordMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => resetPassword()}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerSettings;
