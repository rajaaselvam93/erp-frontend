import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      email: 'admin@evvoerp.com',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
  };

  return (
    <div className="min-h-screen flex dark:bg-surface-950">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0)`,
            backgroundSize: '50px 50px',
          }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Evvo ERP</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Power your<br />
              <span className="text-primary-200">enterprise</span><br />
              operations
            </h1>
            <p className="text-primary-200 text-lg leading-relaxed mb-12">
              A fully dynamic ERP platform built for modern enterprises. Manage all your operations in one place.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Modules', value: '10+' },
                { label: 'Dynamic Fields', value: '∞' },
                { label: 'Companies', value: 'Multi' },
                { label: 'Users', value: 'Unlimited' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-primary-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-primary-300 text-sm">
            © {new Date().getFullYear()} Evvo ERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-surface-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-surface-900 dark:text-surface-50">Evvo ERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-50">Welcome back</h2>
            <p className="text-surface-500 dark:text-surface-400 mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              icon={<Mail size={16} />}
              placeholder="admin@evvoerp.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<Lock size={16} />}
              iconRight={showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              onIconRightClick={() => setShowPassword((v) => !v)}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-surface-300 text-primary-500" />
                <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-8 p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800">
            <p className="text-xs font-semibold text-surface-500 uppercase mb-2">Demo Credentials</p>
            <div className="space-y-1">
              {[
                { role: 'Admin', email: 'admin@evvoerp.com', pass: 'Admin@123' },
                { role: 'Manager', email: 'manager@evvoerp.com', pass: 'Manager@123' },
              ].map((cred) => (
                <div key={cred.role} className="flex items-center justify-between text-xs text-surface-500">
                  <span className="font-medium">{cred.role}:</span>
                  <span>{cred.email} / {cred.pass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
