import React, { useState } from 'react';
import {
  Sun, Moon, Monitor, Globe, Bell, Shield, Database, Save,
  Key, Copy, Check, RefreshCw, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../hooks/useTheme';
import { useAppSelector } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api.service';
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

// ── API Token card ─────────────────────────────────────────────────────────────

const ApiTokenCard: React.FC = () => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['api-token'],
    queryFn: async () => {
      const res = await api.get('/settings/api-token');
      return res.data.data as { token: string | null };
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/api-token/generate');
      return res.data.data as { token: string };
    },
    onSuccess: (result) => {
      toast.success('New API token generated');
      refetch();
      setRevealed(true);
      setConfirmRegen(false);
    },
    onError: () => toast.error('Failed to generate API token'),
  });

  const token = data?.token;
  const maskedToken = token
    ? token.slice(0, 8) + '•'.repeat(40) + token.slice(-8)
    : null;

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Token copied to clipboard');
  };

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1';

  return (
    <>
      <Card>
        <CardHeader
          title="API Token Management"
          subtitle="Permanent token for accessing all module REST APIs from external systems"
          icon={<Key size={18} />}
        />

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            Loading token…
          </div>
        ) : !token ? (
          /* No token yet */
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <Key size={24} className="text-surface-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">No API token generated yet</p>
              <p className="text-xs text-surface-400 mt-1">
                Generate a permanent token to allow external systems to access your module APIs.
              </p>
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
            >
              Generate Token
            </Button>
          </div>
        ) : (
          /* Token exists */
          <div className="space-y-5">
            {/* Token display */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                API Token
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-surface-50 dark:bg-surface-800 rounded-xl text-sm font-mono text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 overflow-x-auto whitespace-nowrap">
                  {revealed ? token : maskedToken}
                </code>
                <button
                  onClick={() => setRevealed((v) => !v)}
                  title={revealed ? 'Hide token' : 'Reveal token'}
                  className="p-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-800 hover:border-surface-300 dark:hover:text-surface-200 transition-colors"
                >
                  {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={handleCopy}
                  title="Copy token"
                  className="p-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-primary-600 hover:border-primary-300 transition-colors"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-surface-400 mt-2">
                This token is permanent and does not expire. Treat it like a password — never expose it publicly.
              </p>
            </div>

            {/* Usage examples */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                Usage
              </label>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { label: 'Authorization header', value: `Authorization: Bearer ${revealed ? token : '<token>'}` },
                  { label: 'Custom header', value: `X-API-Token: ${revealed ? token : '<token>'}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
                    <span className="text-surface-400 text-[10px] block mb-0.5">{label}</span>
                    <span className="text-surface-700 dark:text-surface-300 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API endpoints */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                Accessible Endpoints
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { method: 'GET', desc: 'Fetch all records', color: 'text-emerald-600' },
                  { method: 'POST', desc: 'Create a record', color: 'text-blue-600' },
                  { method: 'PATCH', desc: 'Update (id in body)', color: 'text-amber-600' },
                  { method: 'DELETE', desc: 'Bulk delete', color: 'text-red-600' },
                ].map(({ method, desc, color }) => (
                  <div key={method} className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
                    <span className={`font-bold w-14 shrink-0 ${color}`}>{method}</span>
                    <span className="text-surface-500 truncate">{apiBase}/{'{'}<span className="text-primary-500">module</span>{'}'}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-surface-400 mt-2">
                Replace <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">{'{'+'module'+'}'}</code> with any active module slug, e.g. <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">employees</code>.
              </p>
            </div>

            {/* Regenerate */}
            <div className="pt-2 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between gap-4">
              <p className="text-xs text-surface-400">
                Regenerating the token immediately invalidates the current one. All external integrations must be updated.
              </p>
              <Button
                variant="danger"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={() => setConfirmRegen(true)}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirm regenerate modal */}
      <Modal
        isOpen={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        title="Regenerate API Token"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRegen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              Yes, Regenerate
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            This will immediately invalidate the current token. Any external system using it will lose access until updated with the new token.
            <br /><br />
            <strong className="text-surface-800 dark:text-surface-200">This action cannot be undone.</strong>
          </p>
        </div>
      </Modal>
    </>
  );
};

// ── Main Settings page ─────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const { theme, changeTheme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { isAdmin } = useAuth();
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

      {/* API Token Management — admin only */}
      {isAdmin && <ApiTokenCard />}

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
