'use client';

/**
 * Classroom Building - Results Engine
 *
 * "You don't view results - you ENTER your classroom"
 *
 * This is where students/parents see:
 * - Class boards (Class 5A, 6B, etc.)
 * - Subject-wise marks
 * - Progress charts
 * - Grade cards
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import { resultsApi } from '@/lib/api';
import { formatPercentage, getGradeColor, formatDate } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  BookOpen,
  Trophy,
  TrendingUp,
  ChevronRight,
  Star,
  Award,
} from 'lucide-react';

interface SubjectMark {
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
}

interface ExamResult {
  exam_name: string;
  exam_type: string;
  subjects: SubjectMark[];
  total_obtained: number;
  total_max: number;
}

interface StudentResult {
  student_name: string;
  class_name: string;
  fa_score: number;
  term_score: number;
  final_score: number;
  percentage: number;
  grade: string;
  class_rank: number | null;
  is_passed: boolean;
}

export default function ClassroomBuilding() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<StudentResult | null>(null);
  const [marks, setMarks] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    if (currentBuilding === 'classroom' && token) {
      loadResults();
    }
  }, [currentBuilding, token]);

  const loadResults = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch marks and result based on role
      if (user?.role === 'STUDENT' || user?.role === 'PARENT') {
        const [marksRes, resultRes] = await Promise.all([
          resultsApi.getMyMarks(token),
          resultsApi.getMyResult(token),
        ]);

        // Process marks data
        if (marksRes.marks) {
          setMarks(marksRes.marks as ExamResult[]);
        }

        // Process result data
        if (resultRes) {
          setResult(resultRes as StudentResult);
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentBuilding !== 'classroom') return null;

  return (
    <BuildingPanel
      title="Classroom Building"
      subtitle={result?.class_name || 'Results & Progress'}
    >
      {loading ? (
        <PanelLoading />
      ) : !result ? (
        <PanelEmpty message="No results available yet" />
      ) : (
        <>
          {/* Result Summary Card */}
          <PanelSection title="Final Result">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-primary-600 font-medium">
                    {result.student_name}
                  </p>
                  <p className="text-xs text-primary-500">{result.class_name}</p>
                </div>
                {result.class_rank && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-700">
                      Rank #{result.class_rank}
                    </span>
                  </div>
                )}
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-primary-500">FA Score</p>
                  <p className="text-lg font-bold text-primary-700">
                    {result.fa_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-primary-400">/ 200</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-primary-500">Term Score</p>
                  <p className="text-lg font-bold text-primary-700">
                    {result.term_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-primary-400">/ 800</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-primary-500">Final</p>
                  <p className="text-lg font-bold text-primary-700">
                    {result.final_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-primary-400">/ 1000</p>
                </div>
              </div>

              {/* Grade & Percentage */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-primary-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-700">
                    {formatPercentage(result.percentage)}
                  </p>
                  <p className="text-xs text-primary-500">Percentage</p>
                </div>
                <div className="w-px h-12 bg-primary-200" />
                <div className="text-center">
                  <p className={`text-3xl font-bold ${getGradeColor(result.grade)}`}>
                    {result.grade}
                  </p>
                  <p className="text-xs text-primary-500">Grade</p>
                </div>
                <div className="w-px h-12 bg-primary-200" />
                <div className="text-center">
                  <div className={`text-lg font-bold ${result.is_passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.is_passed ? (
                      <div className="flex items-center gap-1">
                        <Award className="w-5 h-5" />
                        PASS
                      </div>
                    ) : (
                      'FAIL'
                    )}
                  </div>
                  <p className="text-xs text-primary-500">Status</p>
                </div>
              </div>
            </div>
          </PanelSection>

          {/* Exam-wise marks */}
          <PanelSection title="Exam-wise Marks">
            <PanelList>
              {marks.length === 0 ? (
                <PanelEmpty message="No exam marks recorded yet" />
              ) : (
                marks.map((exam, idx) => (
                  <ExamCard
                    key={idx}
                    exam={exam}
                    isExpanded={selectedExam === exam.exam_name}
                    onToggle={() =>
                      setSelectedExam(
                        selectedExam === exam.exam_name ? null : exam.exam_name
                      )
                    }
                  />
                ))
              )}
            </PanelList>
          </PanelSection>
        </>
      )}
    </BuildingPanel>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAM CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ExamCard({
  exam,
  isExpanded,
  onToggle,
}: {
  exam: ExamResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const percentage = (exam.total_obtained / exam.total_max) * 100;
  const isFA = exam.exam_type === 'FA';

  return (
    <PanelCard onClick={onToggle} className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isFA ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{exam.exam_name}</p>
            <p className="text-xs text-gray-500">
              {exam.exam_type === 'FA' ? 'Formative Assessment (20%)' : 'Term Exam (80%)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-gray-900">
              {exam.total_obtained}/{exam.total_max}
            </p>
            <p className="text-xs text-gray-500">{formatPercentage(percentage)}</p>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left font-medium pb-2">Subject</th>
                <th className="text-right font-medium pb-2">Marks</th>
                <th className="text-right font-medium pb-2">%</th>
              </tr>
            </thead>
            <tbody>
              {exam.subjects.map((sub, idx) => {
                const subPct = (sub.marks_obtained / sub.max_marks) * 100;
                return (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="py-2 text-gray-700">{sub.subject_name}</td>
                    <td className="py-2 text-right text-gray-900 font-medium">
                      {sub.marks_obtained}/{sub.max_marks}
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      subPct >= 80 ? 'text-green-600' :
                      subPct >= 60 ? 'text-blue-600' :
                      subPct >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(subPct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
