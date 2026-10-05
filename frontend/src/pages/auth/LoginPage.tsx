import React, { useState } from 'react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: UserProfile) => void;
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateRegister,
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      showToast(`Welcome back, ${user.fullName}!`);
      onSuccess(user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to sign in', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200/90 shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <button onClick={onNavigateHome} className="focus:outline-none">
              <Logo size="lg" showTagline />
            </button>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Sign In to Passenger Portal
          </h2>
          <p className="text-xs text-neutral-500">
            Access your bookings, digital boarding passes, and saved travelers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto p-1 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
          >
            Sign In
          </Button>

        </form>

        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-600">
          <span>New to Railnex? </span>
          <button
            onClick={onNavigateRegister}
            className="font-bold text-neutral-900 hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
