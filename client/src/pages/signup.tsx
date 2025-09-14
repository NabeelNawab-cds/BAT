import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { authHelpers } from '@/lib/supabase';

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await authHelpers.signUp(email, password, { username });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Signup Successful',
        description: 'Please check your email to verify your account.',
      });
      navigate('/login');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900/50 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur-lg shadow-2xl shadow-cyan-500/10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 font-orbitron">
              CREATE ACCOUNT
            </h1>
            <p className="text-slate-400 font-space-grotesk">
              Join the Batcave and become a productivity hero.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10 h-12 bg-slate-800/60 border-slate-700 focus:border-cyan-400"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-slate-800/60 border-slate-700 focus:border-cyan-400"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 bg-slate-800/60 border-slate-700 focus:border-cyan-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-bold text-lg bg-cyan-500 hover:bg-cyan-600 text-black"
              disabled={isLoading}
            >
              <LogIn className="mr-2" size={20} />
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-cyan-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
