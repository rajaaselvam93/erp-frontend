import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginForm {
  email: string;
  password: string;
}

const FEATURES = [
  { label: 'HRMS & Payroll',     desc: 'Full employee lifecycle management' },
  { label: 'Finance & Accounting', desc: 'Real-time P&L, journal entries' },
  { label: 'CRM & Sales',        desc: 'Pipeline tracking, invoicing' },
  { label: 'Inventory & WMS',    desc: 'Multi-warehouse stock control' },
];

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { email: 'admin@evvoerp.com', password: 'Admin@123' },
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0d0d0f]">

      {/* ── Left hero ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dots opacity-[0.07]" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-violet-500/20 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-white font-bold text-lg">Evvo ERP</span>
          </div>

          {/* Hero text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-primary-200 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Enterprise-grade ERP Platform
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Power your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-violet-300">
                enterprise operations
              </span>
            </h1>
            <p className="text-primary-200/80 text-base leading-relaxed mb-10">
              A fully-integrated ERP platform built for modern businesses. Streamline every workflow in one place.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-300 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{f.label}</p>
                    <p className="text-primary-300/70 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-primary-400/60 text-xs">
            © {new Date().getFullYear()} Evvo Labs. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-[#0d0d0f]">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-50">Evvo ERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">Welcome back</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1.5">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={<Mail size={15} />}
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<Lock size={15} />}
              iconRight={showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
              onIconRightClick={() => setShowPassword((v) => !v)}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-4 h-4 rounded border border-surface-300 dark:border-surface-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors" />
                </div>
                <span className="text-xs text-surface-600 dark:text-surface-400">Remember me</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
              className="mt-2"
              iconRight={!isLoading ? <ArrowRight size={15} /> : undefined}
            >
              Sign in
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-xl border border-surface-100 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-900/80 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-800">
              <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Demo credentials</p>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {[
                { role: 'Admin',   email: 'admin@evvoerp.com',   pass: 'Admin@123' },
                { role: 'Manager', email: 'manager@evvoerp.com', pass: 'Manager@123' },
              ].map((cred) => (
                <div key={cred.role} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs font-semibold text-surface-500">{cred.role}</span>
                  <span className="text-[11px] text-surface-400 font-mono">{cred.email}</span>
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
