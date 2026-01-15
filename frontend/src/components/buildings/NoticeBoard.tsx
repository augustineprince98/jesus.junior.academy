'use client';

/**
 * Notice Board - Announcements & Events
 *
 * A physical notice board near the entrance.
 * Pinned items:
 * - Circulars
 * - Events
 * - Holidays
 * - Exam schedules
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import { notificationsApi, eventsApi } from '@/lib/api';
import { formatDate, getPriorityColor, truncate } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  Bell,
  Calendar,
  Pin,
  AlertTriangle,
  PartyPopper,
  BookOpen,
  GraduationCap,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { Notification, SchoolEvent } from '@/types';

export default function NoticeBoard() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'notices' | 'events'>('notices');

  useEffect(() => {
    if (currentBuilding === 'noticeboard') {
      loadData();
    }
  }, [currentBuilding, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load events (public)
      const eventsRes = await eventsApi.getPublic();
      setEvents((eventsRes as { events: SchoolEvent[] }).events || []);

      // Load notifications (if logged in)
      if (token) {
        const notifRes = await notificationsApi.getMy(token);
        setNotifications((notifRes as { notifications: Notification[] }).notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notice board data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentBuilding !== 'noticeboard') return null;

  return (
    <BuildingPanel
      title="Notice Board"
      subtitle="Announcements & Events"
    >
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={activeTab === 'notices'}
          onClick={() => setActiveTab('notices')}
          icon={<Bell className="w-4 h-4" />}
          label="Notices"
          count={notifications.filter(n => !n.is_read).length}
        />
        <TabButton
          active={activeTab === 'events'}
          onClick={() => setActiveTab('events')}
          icon={<Calendar className="w-4 h-4" />}
          label="Events"
          count={events.length}
        />
      </div>

      {loading ? (
        <PanelLoading />
      ) : activeTab === 'notices' ? (
        <NoticesTab notifications={notifications} />
      ) : (
        <EventsTab events={events} />
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
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`px-1.5 py-0.5 text-xs rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTICES TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NoticesTab({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return <PanelEmpty message="No notices yet" />;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HOLIDAY':
        return <PartyPopper className="w-5 h-5" />;
      case 'HOMEWORK':
        return <BookOpen className="w-5 h-5" />;
      case 'RESULT':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOLIDAY':
        return 'bg-green-100 text-green-600';
      case 'HOMEWORK':
        return 'bg-blue-100 text-blue-600';
      case 'RESULT':
        return 'bg-purple-100 text-purple-600';
      case 'FEE_REMINDER':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <PanelList>
      {notifications.map((notif) => (
        <PanelCard key={notif.id} className={!notif.is_read ? 'ring-2 ring-primary-200' : ''}>
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notif.type)}`}>
              {getTypeIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-gray-900">{notif.title}</h4>
                {notif.priority === 'URGENT' && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-gray-600 mt-1">
                {truncate(notif.message, 100)}
              </p>

              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(notif.created_at)}
              </p>
            </div>
          </div>
        </PanelCard>
      ))}
    </PanelList>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EventsTab({ events }: { events: SchoolEvent[] }) {
  if (events.length === 0) {
    return <PanelEmpty message="No upcoming events" />;
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CELEBRATION':
        return 'bg-pink-100 text-pink-600';
      case 'SPORTS':
        return 'bg-green-100 text-green-600';
      case 'CULTURAL':
        return 'bg-purple-100 text-purple-600';
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-600';
      case 'HOLIDAY':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <PanelList>
      {events.map((event) => (
        <PanelCard key={event.id} className={event.is_featured ? 'card-featured' : ''}>
          {event.image_url && (
            <div className="h-32 -mx-4 -mt-4 mb-3 rounded-t-xl overflow-hidden">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Date badge */}
            <div className="flex flex-col items-center p-2 bg-primary-50 rounded-lg text-center min-w-[60px]">
              <span className="text-xs text-primary-500 uppercase">
                {new Date(event.event_date).toLocaleDateString('en-IN', { month: 'short' })}
              </span>
              <span className="text-2xl font-bold text-primary-700">
                {new Date(event.event_date).getDate()}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${getEventColor(event.event_type)}`}>
                  {event.event_type}
                </span>
                {event.is_featured && (
                  <Pin className="w-3 h-3 text-primary-500" />
                )}
              </div>

              <h4 className="font-medium text-gray-900">{event.title}</h4>

              <p className="text-sm text-gray-500 mt-1">
                {truncate(event.description, 80)}
              </p>

              {event.venue && (
                <p className="text-xs text-gray-400 mt-2">
                  Venue: {event.venue}
                </p>
              )}
            </div>
          </div>
        </PanelCard>
      ))}
    </PanelList>
  );
}
