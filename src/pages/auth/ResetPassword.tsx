import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<{
    password: string;
    confirmPassword: string;
  }>();

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (!token) { toast.error('Invalid reset token'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, data.password, data.confirmPassword);
      toast.success('Password reset successfully!');
      navigate('/auth/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-600">Invalid reset link. <Link to="/auth/forgot-password" className="text-primary-600">Request a new one</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center mb-6">
            <Lock size={22} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50">Set new password</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2">Must be at least 8 characters with uppercase, lowercase, and number.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            required
            error={errors.password?.message}
            {...register('password', {
              required: 'Required',
              minLength: { value: 8, message: 'Min 8 characters' },
              pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase, and number' },
            })}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Required',
              validate: (val) => val === watch('password') || 'Passwords do not match',
            })}
          />
          <Button type="submit" fullWidth loading={loading}>Reset Password</Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
