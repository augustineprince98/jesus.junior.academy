/**
 * Attendance Screen
 * 
 * Shows student attendance with calendar view.
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { AttendanceAPI } from '../../services/api';

interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent' | 'late' | 'holiday';
}

interface AttendanceSummary {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
}

export default function AttendanceScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuthStore();

    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            if (user?.student_id) {
                const data = await AttendanceAPI.getSummary(user.student_id);
                setSummary(data);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            // Set mock data for demo
            setSummary({
                total_days: 180,
                present: 171,
                absent: 5,
                late: 4,
                percentage: 95,
            });
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

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return colors.success;
            case 'absent': return colors.error;
            case 'late': return colors.warning;
            default: return colors.tabIconDefault;
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
        >
            {/* Attendance Overview */}
            <View style={[styles.overviewCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.overviewLabel}>Overall Attendance</Text>
                <Text style={styles.overviewPercentage}>{summary?.percentage || 0}%</Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${summary?.percentage || 0}%` },
                        ]}
                    />
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                        <Text style={styles.statIconText}>✓</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                        {summary?.present || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>Present</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.error + '20' }]}>
                        <Text style={styles.statIconText}>✗</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.error }]}>
                        {summary?.absent || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>Absent</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={styles.statIconText}>⏱</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.warning }]}>
                        {summary?.late || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>Late</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={styles.statIconText}>📅</Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                        {summary?.total_days || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>Total Days</Text>
                </View>
            </View>

            {/* Legend */}
            <View style={[styles.legendCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.legendTitle, { color: colors.text }]}>Legend</Text>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Absent</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Late</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.tabIconDefault }]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>Holiday</Text>
                    </View>
                </View>
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
    overviewCard: {
        margin: 16,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    overviewLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    overviewPercentage: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '700',
        marginVertical: 8,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 8,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: '1%',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statIconText: {
        fontSize: 20,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    legendCard: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 14,
    },
});
