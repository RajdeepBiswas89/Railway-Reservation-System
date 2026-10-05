import React, { useState } from 'react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import { Lock, Mail, User, Phone, Check } from 'lucide-react';

interface RegisterPageProps {
  onSuccess: (user: UserProfile) => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all mandatory fields', { type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', { type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.register(name, email, phone, password);
      showToast(`Welcome to Railnex, ${user.fullName}!`);
      onSuccess(user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to register', { type: 'error' });
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
            Create Passenger Account
          </h2>
          <p className="text-xs text-neutral-500">
            Experience real-time seat reservation and unified ticket management.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Legal Name"
            placeholder="e.g. Rajdeep Biswas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Mobile Phone"
            type="tel"
            placeholder="+91 98300 00000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
            <Input
              label="Confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="mt-3"
          >
            Complete Registration
          </Button>
        </form>

        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-600">
          <span>Already registered? </span>
          <button
            onClick={onNavigateLogin}
            className="font-bold text-neutral-900 hover:underline cursor-pointer"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
