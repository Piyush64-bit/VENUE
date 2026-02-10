import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../lib/validation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import RoleToggle from '../../components/ui/RoleToggle';

const OrganizerRegister = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      // Register with ORGANIZER role
      await registerUser(data.name, data.email, data.password, 'ORGANIZER');
      navigate('/organizer/dashboard');
    } catch (error) {
      console.error("Registration failed", error);
      const message = error.response?.data?.message || "Registration failed";
      setError('root', { type: 'server', message });
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Role Toggle */}
        <div className="flex justify-center mb-6">
          <RoleToggle />
        </div>

        <Card className="shadow-2xl border-borderSubtle/50 bg-bgCard/50 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accentOrange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-accentOrange" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Become an Organizer</h1>
            <p className="text-textMuted">Create and manage events & movies</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="organizer@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            
            {errors.root && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {errors.root.message}
              </div>
            )}
            
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full"
              isLoading={isSubmitting}
            >
              Register as Organizer
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-textMuted">
            Already have an organizer account?{' '}
            <Link to="/organizer/login" className="text-accentOrange hover:text-accentHover font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default OrganizerRegister;
