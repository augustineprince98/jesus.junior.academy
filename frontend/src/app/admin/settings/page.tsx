'use client';

/**
 * Admin Settings Page
 *
 * Comprehensive settings management with 4 sections:
 * - General Settings: School info, logo, contact
 * - Notification Settings: Email/SMS configuration
 * - Security Settings: Password policies, sessions
 * - Database Management: Backup and maintenance
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Save,
  Check,
  X,
  Upload,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Lock,
  Key,
  Clock,
  AlertTriangle,
  Info,
  Loader2,
  ChevronRight,
  Building,
  MapPin,
  Image,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { settingsApi } from '@/lib/api';

// Types
interface SchoolSettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  established_year: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  email_provider: string;
  sms_provider: string;
  auto_notify_homework: boolean;
  auto_notify_attendance: boolean;
  auto_notify_fees: boolean;
  auto_notify_events: boolean;
}

interface SecuritySettings {
  min_password_length: number;
  require_uppercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  two_factor_enabled: boolean;
}

type SettingsTab = 'general' | 'notifications' | 'security' | 'database';

export default function AdminSettingsPage() {
  const router = useRouter();


  const { user, token, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings state
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'Jesus Junior Academy',
    tagline: 'The Truth Shall Make You Free',
    email: 'info@jesusja.com',
    phone: '+91-8059589595',
    address: 'Church House, Near SBI Bank, Rewari, Haryana',
    logo_url: '',
    established_year: '1994',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    email_provider: 'smtp',
    sms_provider: 'none',
    auto_notify_homework: true,
    auto_notify_attendance: true,
    auto_notify_fees: true,
    auto_notify_events: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    min_password_length: 8,
    require_uppercase: true,
    require_numbers: true,
    require_special_chars: false,
    session_timeout_minutes: 30,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    two_factor_enabled: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    // Load settings from API
    if (token) {
      settingsApi.get(token)
        .then(data => {
          if (data.school) setSchoolSettings(data.school);
          if (data.notifications) setNotificationSettings(data.notifications);
          if (data.security) setSecuritySettings(data.security);
        })
        .catch(err => console.error("Failed to load settings", err))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, user, router, token]);

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  if (loading) {
    return (
      <AdminLayout activeSection="settings">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError('');

    try {
      await settingsApi.update(token, {
        school: schoolSettings,
        notifications: notificationSettings,
        security: securitySettings
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: Globe, color: 'text-blue-600' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell, color: 'text-orange-600' },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield, color: 'text-red-600' },
    { id: 'database' as SettingsTab, label: 'Database', icon: Database, color: 'text-green-600' },
  ];

  return (
    <AdminLayout activeSection="settings">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="w-7 h-7 text-gray-700" />
            Settings
          </h1>
          <p className="text-gray-600">Configure your school management system</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <GeneralSettings
                settings={schoolSettings}
                onChange={setSchoolSettings}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettingsTab
                settings={notificationSettings}
                onChange={setNotificationSettings}
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettingsTab
                settings={securitySettings}
                onChange={setSecuritySettings}
              />
            )}
            {activeTab === 'database' && <DatabaseManagement />}
          </AnimatePresence>

          {/* Save Button - Hide for database tab */}
          {activeTab !== 'database' && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <div>
                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                )}
                {saved && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Settings saved successfully!
                  </p>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// General Settings Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function GeneralSettings({
  settings,
  onChange,
}: {
  settings: SchoolSettings;
  onChange: (s: SchoolSettings) => void;
}) {
  const updateField = (field: keyof SchoolSettings, value: string) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Building className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">School Information</h2>
          <p className="text-sm text-gray-500">Basic details about your school</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* School Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            School Name
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tagline / Motto
          </label>
          <input
            type="text"
            value={settings.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email Address
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone Number
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Established Year */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Established Year
          </label>
          <input
            type="text"
            value={settings.established_year}
            onChange={(e) => updateField('established_year', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Image className="w-4 h-4 inline mr-1" />
            School Logo
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Image className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Logo
            </button>
          </div>
        </div>
      </div>

      {/* Address - Full Width */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Address
        </label>
        <textarea
          value={settings.address}
          onChange={(e) => updateField('address', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Notification Settings Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NotificationSettingsTab({
  settings,
  onChange,
}: {
  settings: NotificationSettings;
  onChange: (s: NotificationSettings) => void;
}) {
  const toggleField = (field: keyof NotificationSettings) => {
    onChange({ ...settings, [field]: !settings[field] });
  };

  const updateField = (field: keyof NotificationSettings, value: string) => {
    onChange({ ...settings, [field]: value });
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'left-7' : 'left-1'
          }`}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Notification Channels */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notification Channels</h2>
            <p className="text-sm text-gray-500">Enable or disable notification methods</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Send notifications via email</p>
              </div>
            </div>
            <Toggle enabled={settings.email_enabled} onToggle={() => toggleField('email_enabled')} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">Send notifications via SMS</p>
              </div>
            </div>
            <Toggle enabled={settings.sms_enabled} onToggle={() => toggleField('sms_enabled')} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">Browser push notifications</p>
              </div>
            </div>
            <Toggle enabled={settings.push_enabled} onToggle={() => toggleField('push_enabled')} />
          </div>
        </div>
      </div>

      {/* Auto Notifications */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Automatic Notifications</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: 'auto_notify_homework', label: 'Homework Assigned', desc: 'Notify when new homework is posted' },
            { key: 'auto_notify_attendance', label: 'Attendance Alerts', desc: 'Notify parents of absence' },
            { key: 'auto_notify_fees', label: 'Fee Reminders', desc: 'Send fee payment reminders' },
            { key: 'auto_notify_events', label: 'Event Updates', desc: 'Notify about upcoming events' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Toggle
                enabled={settings[item.key as keyof NotificationSettings] as boolean}
                onToggle={() => toggleField(item.key as keyof NotificationSettings)}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Security Settings Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SecuritySettingsTab({
  settings,
  onChange,
}: {
  settings: SecuritySettings;
  onChange: (s: SecuritySettings) => void;
}) {
  const updateField = (field: keyof SecuritySettings, value: number | boolean) => {
    onChange({ ...settings, [field]: value });
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'left-7' : 'left-1'
          }`}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Password Policy */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Password Policy</h2>
            <p className="text-sm text-gray-500">Configure password requirements</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum Password Length
            </label>
            <select
              value={settings.min_password_length}
              onChange={(e) => updateField('min_password_length', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {[6, 8, 10, 12, 14, 16].map((len) => (
                <option key={len} value={len}>
                  {len} characters
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Require Uppercase</span>
              <Toggle
                enabled={settings.require_uppercase}
                onToggle={() => updateField('require_uppercase', !settings.require_uppercase)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Require Numbers</span>
              <Toggle
                enabled={settings.require_numbers}
                onToggle={() => updateField('require_numbers', !settings.require_numbers)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Require Special Characters</span>
              <Toggle
                enabled={settings.require_special_chars}
                onToggle={() => updateField('require_special_chars', !settings.require_special_chars)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session & Login Security */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Session & Login Security</h2>
            <p className="text-sm text-gray-500">Configure session management</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Session Timeout
            </label>
            <select
              value={settings.session_timeout_minutes}
              onChange={(e) => updateField('session_timeout_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {[15, 30, 60, 120, 480].map((min) => (
                <option key={min} value={min}>
                  {min < 60 ? `${min} minutes` : `${min / 60} hours`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max Login Attempts
            </label>
            <select
              value={settings.max_login_attempts}
              onChange={(e) => updateField('max_login_attempts', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {[3, 5, 10].map((num) => (
                <option key={num} value={num}>
                  {num} attempts
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lockout Duration
            </label>
            <select
              value={settings.lockout_duration_minutes}
              onChange={(e) => updateField('lockout_duration_minutes', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {[5, 15, 30, 60].map((min) => (
                <option key={min} value={min}>
                  {min} minutes
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
            </div>
            <Toggle
              enabled={settings.two_factor_enabled}
              onToggle={() => updateField('two_factor_enabled', !settings.two_factor_enabled)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Database Management Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DatabaseManagement() {
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>('2026-01-28 10:30 AM');

  const handleBackup = async () => {
    setBackingUp(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLastBackup(new Date().toLocaleString());
    setBackingUp(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Database Info */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Database Management</h2>
            <p className="text-sm text-gray-500">Backup, restore, and maintenance tools</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-800">Database Status</span>
            </div>
            <p className="text-lg font-bold text-green-900">Connected</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Last Backup</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{lastBackup || 'Never'}</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Database Size</span>
            </div>
            <p className="text-lg font-bold text-purple-900">~25 MB</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Create Backup
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a full backup of all data including users, students, fees, and more.
          </p>
          <button
            onClick={handleBackup}
            disabled={backingUp}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {backingUp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Create Backup Now
              </>
            )}
          </button>
        </div>

        <div className="p-6 border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Restore Backup
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Restore data from a previous backup. This will overwrite current data.
          </p>
          <button className="w-full py-3 border-2 border-orange-500 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Backup File
          </button>
        </div>

        <div className="p-6 border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            Clear Cache
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Clear application cache to free up memory and resolve stale data issues.
          </p>
          <button className="w-full py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </button>
        </div>

        <div className="p-6 border border-red-200 rounded-xl bg-red-50">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete all test data. This action cannot be undone.
          </p>
          <button className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            Reset Test Data
          </button>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Important Notice</p>
          <p className="text-sm text-yellow-700">
            Database operations should only be performed by system administrators.
            Always create a backup before making major changes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
