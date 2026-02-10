import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Mail, Smartphone, Shield, LogOut, ChevronRight, Speaker, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { getProfile, updateProfile, changePassword, uploadProfilePicture } from '../api/user';
import { toast } from 'react-hot-toast';

const BentoSection = ({ className, children, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden group ${className}`}
    >
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        
        {/* Hover Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accentOrange/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
            {children}
        </div>
    </motion.div>
);

const ToggleItem = ({ label, description, defaultChecked = false, icon: Icon }) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className="flex items-center justify-between py-3 group/toggle cursor-pointer" onClick={() => setChecked(!checked)}>
            <div className="flex items-center gap-4">
                {Icon && <div className={`p-2 rounded-lg transition-colors ${checked ? 'bg-accentOrange/20 text-accentOrange' : 'bg-white/5 text-white/40 group-hover/toggle:text-white'}`}><Icon className="w-5 h-5" /></div>}
                <div>
                    <p className="text-white font-medium group-hover/toggle:text-accentOrange transition-colors">{label}</p>
                    {description && <p className="text-xs text-textMuted">{description}</p>}
                </div>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-accentOrange' : 'bg-white/10'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    );
};

const Settings = () => {
    const { user: authUser, logout, updateUser } = useAuth();
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await getProfile();
            const userData = response.data.user;
            setProfileData({ name: userData.name, email: userData.email });
            setProfilePicture(userData.profilePicture);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load profile');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoadingProfile(true);
        try {
            const response = await updateProfile(profileData);
            updateUser(response.data.user);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setIsLoadingPassword(true);
        try {
            await changePassword(passwordData);
            toast.success('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoadingPassword(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setIsUploadingImage(true);
        try {
            const response = await uploadProfilePicture(file);
            setProfilePicture(response.data.user.profilePicture);
            updateUser(response.data.user);
            toast.success('Profile picture updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    return (
        <div className="min-h-screen bg-bgPrimary pt-32 pb-24 px-6">
            <SEO title="Settings" />
            
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div>
                         <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 uppercase tracking-tighter mb-2">
                             Settings
                         </h1>
                         <p className="text-textMuted text-lg">Manage your account and preferences.</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Account Profile Card - Large Vertical */}
                    <BentoSection className="md:col-span-1 md:row-span-2 flex flex-col items-center text-center pt-12">
                         <div className="relative w-32 h-32 mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                             <div className="absolute inset-0 bg-gradient-to-tr from-accentOrange to-purple-600 rounded-full animate-spin-slow opacity-70 blur-md" />
                             <div className="relative w-full h-full rounded-full bg-black border-2 border-white/10 overflow-hidden">
                                 {profilePicture ? (
                                     <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-white/5 text-4xl font-black text-white/50">
                                         {authUser?.name?.charAt(0)}
                                     </div>
                                 )}
                                 {isUploadingImage && (
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                         <Loader2 className="w-8 h-8 text-white animate-spin" />
                                     </div>
                                 )}
                             </div>
                             <div className="absolute bottom-0 right-0 p-2 bg-accentOrange rounded-full text-white shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                 <Camera className="w-4 h-4" />
                             </div>
                         </div>
                         
                         <input
                             ref={fileInputRef}
                             type="file"
                             accept="image/*"
                             onChange={handleImageUpload}
                             className="hidden"
                         />
                         
                         <h3 className="text-2xl font-bold text-white mb-1">{authUser?.name}</h3>
                         <p className="text-accentOrange text-xs font-bold uppercase tracking-widest mb-8">{authUser?.role || 'User'}</p>

                         <form onSubmit={handleProfileUpdate} className="w-full space-y-6 text-left">
                             <div className="group">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block group-focus-within:text-accentOrange transition-colors">Full Name</label>
                                 <input 
                                     type="text" 
                                     value={profileData.name}
                                     onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                     className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors placeholder:text-white/20"
                                     required
                                 />
                             </div>
                             <div className="group">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block group-focus-within:text-accentOrange transition-colors">Email Address</label>
                                 <input 
                                     type="email" 
                                     value={profileData.email}
                                     onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                     className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors placeholder:text-white/20"
                                     required
                                 />
                             </div>

                             <div className="mt-auto pt-6 w-full">
                                 <Button 
                                     type="submit" 
                                     disabled={isLoadingProfile}
                                     className="w-full bg-accentOrange hover:bg-accentHover text-white"
                                 >
                                     {isLoadingProfile ? (
                                         <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                                     ) : (
                                         'Update Profile'
                                     )}
                                 </Button>
                             </div>
                         </form>
                    </BentoSection>

                    {/* 2. Notifications - Wide */}
                    <BentoSection className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <Bell className="w-6 h-6 text-accentOrange" />
                            <h3 className="text-xl font-bold text-white">Notifications</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <ToggleItem icon={Smartphone} label="Push Notifications" description="Bookings & Reminders" defaultChecked={true} />
                            <ToggleItem icon={Mail} label="Email Digests" description="Weekly lineup summary" defaultChecked={false} />
                            <ToggleItem icon={Speaker} label="Sound Effects" description="In-app interaction sounds" defaultChecked={true} />
                            <ToggleItem icon={Shield} label="Security Alerts" description="Login attempts" defaultChecked={true} />
                        </div>
                    </BentoSection>

                    {/* 3. Security & Privacy - Square */}
                    <BentoSection className="md:col-span-1">
                         <div className="flex items-center gap-3 mb-6">
                            <Lock className="w-6 h-6 text-accentOrange" />
                            <h3 className="text-xl font-bold text-white">Change Password</h3>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block">Current Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors"
                                    required
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block">New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block">Confirm Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isLoadingPassword}
                                className="w-full bg-accentOrange hover:bg-accentHover text-white mt-4"
                            >
                                {isLoadingPassword ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</>
                                ) : (
                                    'Change Password'
                                )}
                            </Button>
                        </form>
                    </BentoSection>

                    {/* 4. Danger Zone - Square */}
                    <BentoSection className="md:col-span-1 border-red-500/20 bg-red-500/5">
                        <div className="flex items-center gap-3 mb-6">
                            <LogOut className="w-6 h-6 text-red-500" />
                            <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
                        </div>
                        <p className="text-xs text-red-400/60 mb-6 leading-relaxed">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <div className="space-y-3">
                             <Button onClick={logout} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-auto py-3">
                                 Sign Out
                             </Button>
                             <Button variant="ghost" className="w-full justify-start text-white/20 hover:text-white hover:bg-white/5 h-auto py-3">
                                 Delete Account
                             </Button>
                        </div>
                    </BentoSection>

                </div>
            </div>
        </div>
    );
};

export default Settings;
