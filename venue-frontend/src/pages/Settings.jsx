import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Mail, Smartphone, Shield, LogOut, ChevronRight, Speaker } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import SEO from '../components/ui/SEO';

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

const InputField = ({ label, defaultValue, type="text" }) => (
    <div className="group">
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 block group-focus-within:text-accentOrange transition-colors">{label}</label>
        <input 
            type={type} 
            defaultValue={defaultValue}
            className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-accentOrange transition-colors placeholder:text-white/20"
        />
    </div>
);

const Settings = () => {
    const { user, logout } = useAuth();

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
                         <div className="relative w-32 h-32 mb-6 group cursor-pointer">
                             <div className="absolute inset-0 bg-gradient-to-tr from-accentOrange to-purple-600 rounded-full animate-spin-slow opacity-70 blur-md" />
                             <div className="relative w-full h-full rounded-full bg-black border-2 border-white/10 overflow-hidden">
                                 <div className="w-full h-full flex items-center justify-center bg-white/5 text-4xl font-black text-white/50">
                                     {user?.name?.charAt(0)}
                                 </div>
                             </div>
                             <div className="absolute bottom-0 right-0 p-2 bg-accentOrange rounded-full text-white shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                 <User className="w-4 h-4" />
                             </div>
                         </div>
                         
                         <h3 className="text-2xl font-bold text-white mb-1">{user?.name}</h3>
                         <p className="text-accentOrange text-xs font-bold uppercase tracking-widest mb-8">Pro Member</p>

                         <div className="w-full space-y-6 text-left">
                             <InputField label="Full Name" defaultValue={user?.name} />
                             <InputField label="Email Address" defaultValue={user?.email} />
                             <InputField label="Username" defaultValue="@alexcarter" />
                         </div>

                         <div className="mt-auto pt-12 w-full">
                             <Button variant="outline" className="w-full border-white/10 hover:border-white/30 text-white/60 hover:text-white">
                                 Upload New Avatar
                             </Button>
                         </div>
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
                            <h3 className="text-xl font-bold text-white">Security</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-white text-sm">Change Password</p>
                                    <p className="text-textMuted text-xs">Last update: 3mo ago</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-white text-sm">2FA Auth</p>
                                    <p className="text-green-400 text-xs">Enabled</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </div>
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
