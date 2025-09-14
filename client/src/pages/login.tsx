import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { authHelpers } from '@/lib/supabase';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await authHelpers.signIn(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Login Successful',
        description: 'Welcome back to the Batcave.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await authHelpers.signInWithGoogle();
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
              BATCAVE
            </h1>
            <p className="text-slate-400 font-space-grotesk">
              Authenticate to access your mission control.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/50 px-2 text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 bg-transparent border-slate-700 hover:bg-slate-800/50 hover:text-white"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome className="mr-2" size={20} />
            Sign in with Google
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-cyan-400 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
