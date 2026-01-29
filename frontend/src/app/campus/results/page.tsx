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
  FileText,
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
      setMarks(Array.isArray(marksData?.marks) ? (marksData.marks as Mark[]) : []);
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/campus')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              My Results
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                Academic
              </span>
            </h1>
            <p className="text-white/40 text-sm">Performance analytics and exam reports</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent animate-spin-slow"></div>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card bg-red-500/10 border-red-500/20 p-8 text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={loadResults}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/20"
          >
            Retry Connection
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
              <div className="glass-card p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Overall Percentage</p>
                    <p className="text-3xl font-bold text-white">{result.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Class Rank</p>
                    <p className="text-3xl font-bold text-white">
                      {result.class_rank ? `#${result.class_rank}` : 'N/A'}
                    </p>
                    {result.class_rank && (
                      <p className="text-xs text-white/40">of {result.total_students} students</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 mb-1">FA Score</p>
                    <p className="text-3xl font-bold text-white">{result.fa_score}</p>
                    <p className="text-xs text-white/40">out of 200</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Term Score</p>
                    <p className="text-3xl font-bold text-white">{result.term_score}</p>
                    <p className="text-xs text-white/40">out of 800</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filter and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass-card rounded-lg p-1 px-3">
                <Filter className="w-4 h-4 text-white/50" />
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="bg-transparent border-none text-sm text-white focus:ring-0 pr-8 py-1 [&>option]:bg-gray-900"
                >
                  <option value="all">All Exams</option>
                  {examTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>

          {/* Marks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Subject-wise Marks</h2>
            </div>

            {filteredMarks.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No marks available yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMarks.map((mark, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{mark.subject_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white/80">{mark.exam_name}</div>
                          <div className="text-xs text-white/40">{mark.exam_type}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-white">{mark.marks_obtained}</span>
                          <span className="text-white/40"> / {mark.max_marks}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                            <div
                              className="bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                              style={{ width: `${mark.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white/60">{mark.percentage.toFixed(1)}%</span>
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
  );
}
