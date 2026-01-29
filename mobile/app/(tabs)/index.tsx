/**
 * Home Screen
 * 
 * Dashboard with notices, events, and quick actions.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { NotificationsAPI, EventsAPI } from '../../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [notifs, evts] = await Promise.all([
        NotificationsAPI.getAll(5),
        EventsAPI.getUpcoming(),
      ]);
      setNotifications(notifs.items || notifs || []);
      setEvents(evts || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <View style={[styles.welcomeCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>95%</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>A+</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Grade</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>₹0</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Due</Text>
        </View>
      </View>

      {/* Notices Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Notices</Text>
        {notifications.length > 0 ? (
          notifications.slice(0, 3).map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.noticeCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.noticeHeader}>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>
                  {notif.title}
                </Text>
                <Text style={[styles.noticeDate, { color: colors.tabIconDefault }]}>
                  {formatDate(notif.created_at)}
                </Text>
              </View>
              <Text
                style={[styles.noticeMessage, { color: colors.tabIconDefault }]}
                numberOfLines={2}
              >
                {notif.message}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No new notices
            </Text>
          </View>
        )}
      </View>

      {/* Events Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
        {events.length > 0 ? (
          events.slice(0, 3).map((event) => (
            <View
              key={event.id}
              style={[styles.eventCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.eventDateBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.eventDay}>
                  {new Date(event.event_date).getDate()}
                </Text>
                <Text style={styles.eventMonth}>
                  {new Date(event.event_date).toLocaleDateString('en-IN', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>
                  {event.title}
                </Text>
                <Text
                  style={[styles.eventDescription, { color: colors.tabIconDefault }]}
                  numberOfLines={1}
                >
                  {event.description}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No upcoming events
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noticeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  noticeDate: {
    fontSize: 12,
  },
  noticeMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  eventDateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDay: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  eventMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  eventDetails: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
