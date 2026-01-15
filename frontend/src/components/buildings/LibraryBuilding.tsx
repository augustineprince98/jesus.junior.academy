'use client';

/**
 * Library Building - Academics Hub
 *
 * Library building contains:
 * - Subjects
 * - Syllabus
 * - Academic calendar
 * - Study resources (future)
 *
 * Bookshelves = subjects
 * Click shelf → subject page
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  Book,
  BookOpen,
  Calendar,
  GraduationCap,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { Subject, Homework } from '@/types';

// Mock data for now - would come from API
const SUBJECTS: Subject[] = [
  { id: 1, name: 'English', code: 'ENG' },
  { id: 2, name: 'Hindi', code: 'HIN' },
  { id: 3, name: 'Mathematics', code: 'MAT' },
  { id: 4, name: 'Science', code: 'SCI' },
  { id: 5, name: 'Social Studies', code: 'SST' },
  { id: 6, name: 'Computer Science', code: 'CS' },
];

const SUBJECT_COLORS: Record<string, string> = {
  ENG: 'bg-blue-100 text-blue-600',
  HIN: 'bg-orange-100 text-orange-600',
  MAT: 'bg-purple-100 text-purple-600',
  SCI: 'bg-green-100 text-green-600',
  SST: 'bg-yellow-100 text-yellow-600',
  CS: 'bg-cyan-100 text-cyan-600',
};

export default function LibraryBuilding() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subjects' | 'homework' | 'calendar'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);

  useEffect(() => {
    if (currentBuilding === 'library') {
      // Simulate loading
      setTimeout(() => setLoading(false), 500);
    }
  }, [currentBuilding]);

  if (currentBuilding !== 'library') return null;

  return (
    <BuildingPanel
      title="Library"
      subtitle="Academic Resources"
    >
      {loading ? (
        <PanelLoading />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <TabButton
              active={activeTab === 'subjects'}
              onClick={() => setActiveTab('subjects')}
              icon={<Book className="w-4 h-4" />}
              label="Subjects"
            />
            <TabButton
              active={activeTab === 'homework'}
              onClick={() => setActiveTab('homework')}
              icon={<FileText className="w-4 h-4" />}
              label="Homework"
            />
            <TabButton
              active={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
              icon={<Calendar className="w-4 h-4" />}
              label="Calendar"
            />
          </div>

          {activeTab === 'subjects' && (
            <SubjectsTab
              subjects={SUBJECTS}
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
            />
          )}

          {activeTab === 'homework' && (
            <HomeworkTab homework={homework} />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab />
          )}
        </>
      )}
    </BuildingPanel>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBJECTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SubjectsTab({
  subjects,
  selectedSubject,
  onSelectSubject,
}: {
  subjects: Subject[];
  selectedSubject: Subject | null;
  onSelectSubject: (subject: Subject | null) => void;
}) {
  if (selectedSubject) {
    return (
      <div>
        <button
          onClick={() => onSelectSubject(null)}
          className="flex items-center gap-2 text-sm text-primary-600 mb-4 hover:text-primary-700"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Subjects
        </button>

        <SubjectDetail subject={selectedSubject} />
      </div>
    );
  }

  return (
    <PanelSection title="Your Subjects">
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => (
          <PanelCard
            key={subject.id}
            onClick={() => onSelectSubject(subject)}
            className="text-center"
          >
            <div
              className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                SUBJECT_COLORS[subject.code] || 'bg-gray-100 text-gray-600'
              }`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="font-medium text-gray-900">{subject.name}</p>
            <p className="text-xs text-gray-500">{subject.code}</p>
          </PanelCard>
        ))}
      </div>
    </PanelSection>
  );
}

function SubjectDetail({ subject }: { subject: Subject }) {
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${SUBJECT_COLORS[subject.code] || 'bg-gray-100'}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{subject.name}</h3>
            <p className="text-sm opacity-80">Subject Code: {subject.code}</p>
          </div>
        </div>
      </div>

      <PanelSection title="Quick Links">
        <PanelList>
          <QuickLink icon={<FileText />} label="Syllabus" />
          <QuickLink icon={<Book />} label="Study Materials" />
          <QuickLink icon={<GraduationCap />} label="Previous Year Papers" />
        </PanelList>
      </PanelSection>
    </div>
  );
}

function QuickLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <PanelCard className="flex items-center justify-between cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </PanelCard>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOMEWORK TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HomeworkTab({ homework }: { homework: Homework[] }) {
  if (homework.length === 0) {
    return (
      <PanelSection title="Pending Homework">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-500">No pending homework!</p>
          <p className="text-sm text-gray-400">Enjoy your free time</p>
        </div>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Pending Homework">
      <PanelList>
        {homework.map((hw) => (
          <PanelCard key={hw.id}>
            <div className="flex items-start justify-between">
              <div>
                <span className="badge bg-blue-100 text-blue-600 mb-1">
                  {hw.subject_name}
                </span>
                <h4 className="font-medium text-gray-900">{hw.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{hw.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Due</p>
                <p className="text-sm font-medium text-orange-600">
                  {formatDate(hw.due_date)}
                </p>
              </div>
            </div>
          </PanelCard>
        ))}
      </PanelList>
    </PanelSection>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALENDAR TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CalendarTab() {
  // Mock academic calendar data
  const upcomingEvents = [
    { date: '2026-01-26', name: 'Republic Day', type: 'HOLIDAY' },
    { date: '2026-02-01', name: 'Half Yearly Exams Begin', type: 'EXAM' },
    { date: '2026-02-15', name: 'Half Yearly Exams End', type: 'EXAM' },
    { date: '2026-03-01', name: 'Holi', type: 'HOLIDAY' },
  ];

  return (
    <PanelSection title="Academic Calendar">
      <PanelList>
        {upcomingEvents.map((event, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex flex-col items-center min-w-[50px]">
              <span className="text-xs text-gray-400">
                {new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}
              </span>
              <span className="text-2xl font-bold text-primary-700">
                {new Date(event.date).getDate()}
              </span>
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">{event.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  event.type === 'HOLIDAY'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {event.type}
              </span>
            </div>
          </div>
        ))}
      </PanelList>
    </PanelSection>
  );
}
