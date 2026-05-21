import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ForgotPassword: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6">
      <div className="w-full max-w-md">
        <Link to="/auth/login" className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to login
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">Check your email</h2>
            <p className="text-surface-500 dark:text-surface-400 mb-6">We sent a password reset link to your email address.</p>
            <Link to="/auth/login">
              <Button fullWidth>Back to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50">Forgot password?</h2>
              <p className="text-surface-500 dark:text-surface-400 mt-2">Enter your email and we'll send you a reset link.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                icon={<Mail size={16} />}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <Button type="submit" fullWidth loading={loading}>Send Reset Link</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
