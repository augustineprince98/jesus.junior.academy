'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { Settings, Bell, Shield, Database, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  const settingsCategories = [
    {
      title: 'General Settings',
      description: 'School name, logo, contact information',
      icon: Globe,
      color: 'bg-blue-500',
      status: 'Coming Soon',
    },
    {
      title: 'Notification Settings',
      description: 'Configure email and SMS notifications',
      icon: Bell,
      color: 'bg-orange-500',
      status: 'Coming Soon',
    },
    {
      title: 'Security Settings',
      description: 'Password policies, session management',
      icon: Shield,
      color: 'bg-red-500',
      status: 'Coming Soon',
    },
    {
      title: 'Database Management',
      description: 'Backup, restore, and maintenance',
      icon: Database,
      color: 'bg-green-500',
      status: 'Coming Soon',
    },
  ];

  return (
    <AdminLayout activeSection="settings">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your school management system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{category.title}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                        {category.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700">
            Settings functionality is being developed. For urgent configuration changes,
            please contact the system administrator.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
