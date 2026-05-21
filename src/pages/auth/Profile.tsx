import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Save, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import api from '../../services/api.service';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../store';
import { updateUser } from '../../store/authSlice';

const Profile: React.FC = () => {
  const { user, fullName } = useAuth();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      department: user?.department || '',
      designation: user?.designation || '',
    },
  });

  const { register: registerPass, handleSubmit: handlePassSubmit, formState: { errors: passErrors }, reset: resetPass } = useForm();

  const profileMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put('/users/profile', data),
    onSuccess: (res) => {
      dispatch(updateUser(res.data.data));
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPass();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">My Profile</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage your personal information</p>
      </div>

      {/* Avatar Card */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user?.avatar ? (
              <img src={user.avatar} alt={fullName} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <button className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">{fullName}</h2>
            <p className="text-sm text-surface-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">{user?.role?.name || 'User'}</Badge>
              <Badge variant={user?.status === 'active' ? 'success' : 'default'} dot>{user?.status}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {[
          { label: 'Profile', value: 'profile' },
          { label: 'Security', value: 'security' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as 'profile' | 'security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader title="Personal Information" />
          <form onSubmit={handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" required error={errors.firstName?.message as string} {...register('firstName', { required: 'Required' })} />
              <Input label="Last Name" required error={errors.lastName?.message as string} {...register('lastName', { required: 'Required' })} />
            </div>
            <Input label="Email" value={user?.email || ''} disabled hint="Contact admin to change email" />
            <Input label="Phone" {...register('phone')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Department" {...register('department')} />
              <Input label="Designation" {...register('designation')} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={profileMutation.isPending} icon={<Save size={14} />}>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader title="Change Password" icon={<Lock size={18} />} />
          <form onSubmit={handlePassSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            <Input label="Current Password" type="password" required error={passErrors.currentPassword?.message as string}
              {...registerPass('currentPassword', { required: 'Required' })}
            />
            <Input label="New Password" type="password" required error={passErrors.newPassword?.message as string}
              {...registerPass('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            <Input label="Confirm New Password" type="password" required error={passErrors.confirmPassword?.message as string}
              {...registerPass('confirmPassword', { required: 'Required' })}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={passwordMutation.isPending} icon={<Lock size={14} />}>Change Password</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Profile;
