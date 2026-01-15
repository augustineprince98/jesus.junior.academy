'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { admissionsApi } from '@/lib/api';
import { FileText, Trash2, Phone, Calendar, User, School } from 'lucide-react';

interface Enquiry {
  id: number;
  child_name: string;
  parent_name: string;
  contact_number: string;
  seeking_class: string;
  submitted_at: string;
  status: string;
}

export default function AdmissionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadEnquiries();
  }, [isAuthenticated, user, router, filterStatus]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await admissionsApi.list(token!, filterStatus || undefined);
      setEnquiries(data as Enquiry[]);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await admissionsApi.updateStatus(token!, id, status);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const deleteEnquiry = async (id: number) => {
    if (!confirm('Delete this enquiry?')) return;
    try {
      await admissionsApi.delete(token!, id);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-700';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-700';
      case 'CONVERTED':
        return 'bg-green-100 text-green-700';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="admissions">
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Admission Enquiries</h1>
            <p className="text-gray-600">Manage admission requests from parents</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Enquiries Yet</h3>
            <p className="text-gray-500">Admission enquiries will appear here</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {enquiries.map((enquiry) => (
              <div key={enquiry.id} className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{enquiry.child_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Parent: {enquiry.parent_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${enquiry.contact_number}`} className="text-primary-600 hover:underline">
                          {enquiry.contact_number}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        <span>Class: {enquiry.seeking_class}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(enquiry.submitted_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-semibold text-gray-700 mr-2">Update Status:</label>
                      <select
                        value={enquiry.status}
                        onChange={(e) => updateStatus(enquiry.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteEnquiry(enquiry.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
