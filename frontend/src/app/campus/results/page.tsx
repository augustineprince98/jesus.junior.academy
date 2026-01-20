'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { resultsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

interface Mark {
  subject_name: string;
  subject_id: number;
  exam_name: string;
  exam_type: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
}

interface Result {
  fa_score: number;
  term_score: number;
  final_score: number;
  percentage: number;
  class_rank: number | null;
  total_students: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadResults();
  }, [isAuthenticated, router, token]);

  const loadResults = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [marksData, resultData] = await Promise.all([
        resultsApi.getMyMarks(token),
        resultsApi.getMyResult(token),
      ]);

      // Ensure marks is always an array
      setMarks(Array.isArray(marksData?.marks) ? marksData.marks : []);
      setResult(resultData as Result || null);
    } catch (err: any) {
      const errorMessage = typeof err.detail === 'string' ? err.detail : 
                          err.message || 
                          'Failed to load results';
      setError(errorMessage);
      setMarks([]); // Set empty array on error
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Ensure marks is always an array before filtering
  const marksArray = Array.isArray(marks) ? marks : [];
  const filteredMarks = selectedExamType === 'all'
    ? marksArray
    : marksArray.filter(m => m.exam_type === selectedExamType);

  const examTypes = Array.from(new Set(marksArray.map(m => m.exam_type)));

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/campus')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Results</h1>
                <p className="text-xs text-gray-500">Academic Performance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadResults}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Overall Percentage</p>
                      <p className="text-3xl font-bold text-gray-900">{result.percentage.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Class Rank</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {result.class_rank ? `#${result.class_rank}` : 'N/A'}
                      </p>
                      {result.class_rank && (
                        <p className="text-xs text-gray-500">of {result.total_students} students</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">FA Score</p>
                      <p className="text-3xl font-bold text-gray-900">{result.fa_score}</p>
                      <p className="text-xs text-gray-500">out of 200</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Term Score</p>
                      <p className="text-3xl font-bold text-gray-900">{result.term_score}</p>
                      <p className="text-xs text-gray-500">out of 800</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filter and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <select
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 pr-8"
                  >
                    <option value="all">All Exams</option>
                    {examTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            {/* Marks Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Subject-wise Marks</h2>
              </div>

              {filteredMarks.length === 0 ? (
                <div className="p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No marks available yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Exam
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMarks.map((mark, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{mark.subject_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{mark.exam_name}</div>
                            <div className="text-xs text-gray-400">{mark.exam_type}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">{mark.marks_obtained}</span>
                            <span className="text-gray-400"> / {mark.max_marks}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${mark.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{mark.percentage.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
