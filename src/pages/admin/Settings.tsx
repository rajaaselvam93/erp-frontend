import React, { useState } from 'react';
import { Sun, Moon, Monitor, Globe, Bell, Shield, Database, Save } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useTheme } from '../../hooks/useTheme';
import { useAppSelector } from '../../store';
import type { Theme } from '../../types';
import { toast } from 'react-toastify';

const themeOptions = [
  { label: 'Light', value: 'light', icon: <Sun size={16} /> },
  { label: 'Dark', value: 'dark', icon: <Moon size={16} /> },
  { label: 'System', value: 'system', icon: <Monitor size={16} /> },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Arabic (عربي)', value: 'ar' },
  { label: 'Spanish (Español)', value: 'es' },
  { label: 'French (Français)', value: 'fr' },
];

const Settings: React.FC = () => {
  const { theme, changeTheme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Settings</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage your application preferences</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" subtitle="Customize the look and feel" icon={<Sun size={18} />} />
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Theme</label>
            <div className="flex gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changeTheme(opt.value as Theme)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === opt.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                  }`}
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Language"
            options={languageOptions}
            defaultValue="en"
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader title="Notifications" subtitle="Control your notification preferences" icon={<Bell size={18} />} />
        <div className="space-y-4">
          {[
            { label: 'In-app notifications', desc: 'Real-time notifications in the app', default: true },
            { label: 'Email notifications', desc: 'Receive email for important events', default: true },
            { label: 'Workflow approvals', desc: 'Notify when approval is needed', default: true },
            { label: 'System alerts', desc: 'Critical system notifications', default: true },
          ].map((setting) => (
            <div key={setting.label} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{setting.label}</p>
                <p className="text-xs text-surface-400">{setting.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={setting.default} className="sr-only peer" />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-500" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title="Security" subtitle="Manage security preferences" icon={<Shield size={18} />} />
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">Two-Factor Authentication</p>
              <p className="text-xs text-surface-400">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">
              {user?.isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">Active Sessions</p>
              <p className="text-xs text-surface-400">Manage your login sessions</p>
            </div>
            <Button variant="danger" size="sm">Revoke All</Button>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader title="System Information" subtitle="Platform details" icon={<Database size={18} />} />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: import.meta.env.MODE },
            { label: 'API', value: import.meta.env.VITE_API_URL || 'localhost:5000' },
            { label: 'License', value: 'Enterprise' },
          ].map((info) => (
            <div key={info.label} className="flex flex-col gap-0.5 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <span className="text-xs text-surface-400">{info.label}</span>
              <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{info.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} icon={<Save size={16} />}>Save Settings</Button>
      </div>
    </div>
  );
};

export default Settings;
