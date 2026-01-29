/**
 * Results Screen
 * 
 * Shows student exam results and grades.
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { ResultsAPI } from '../../services/api';

interface Result {
    id: number;
    exam_name: string;
    exam_date: string;
    subjects: {
        name: string;
        marks: number;
        max_marks: number;
        grade: string;
    }[];
    total_marks: number;
    max_total: number;
    percentage: number;
    grade: string;
    rank?: number;
}

export default function ResultsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuthStore();

    const [results, setResults] = useState<Result[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            if (user?.student_id) {
                const data = await ResultsAPI.getStudentResults(user.student_id);
                setResults(data || []);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            // Mock data for demo
            setResults([
                {
                    id: 1,
                    exam_name: 'Mid-Term Examination',
                    exam_date: '2024-10-15',
                    subjects: [
                        { name: 'Mathematics', marks: 92, max_marks: 100, grade: 'A+' },
                        { name: 'Science', marks: 88, max_marks: 100, grade: 'A' },
                        { name: 'English', marks: 95, max_marks: 100, grade: 'A+' },
                        { name: 'Social Studies', marks: 85, max_marks: 100, grade: 'A' },
                        { name: 'Hindi', marks: 90, max_marks: 100, grade: 'A+' },
                    ],
                    total_marks: 450,
                    max_total: 500,
                    percentage: 90,
                    grade: 'A+',
                    rank: 3,
                },
            ]);
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

    const getGradeColor = (grade: string) => {
        if (grade.includes('A')) return colors.success;
        if (grade.includes('B')) return colors.primary;
        if (grade.includes('C')) return colors.warning;
        return colors.error;
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
            {results.length > 0 ? (
                results.map((result) => (
                    <TouchableOpacity
                        key={result.id}
                        style={[styles.resultCard, { backgroundColor: colors.card }]}
                        onPress={() => setExpandedId(expandedId === result.id ? null : result.id)}
                        activeOpacity={0.8}
                    >
                        {/* Header */}
                        <View style={styles.resultHeader}>
                            <View>
                                <Text style={[styles.examName, { color: colors.text }]}>
                                    {result.exam_name}
                                </Text>
                                <Text style={[styles.examDate, { color: colors.tabIconDefault }]}>
                                    {new Date(result.exam_date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>
                            <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(result.grade) }]}>
                                <Text style={styles.gradeText}>{result.grade}</Text>
                            </View>
                        </View>

                        {/* Summary */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>
                                    {result.total_marks}/{result.max_total}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                                    Total Marks
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                                    {result.percentage}%
                                </Text>
                                <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                                    Percentage
                                </Text>
                            </View>
                            {result.rank && (
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.accent }]}>
                                        #{result.rank}
                                    </Text>
                                    <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                                        Rank
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Expanded Subjects */}
                        {expandedId === result.id && (
                            <View style={styles.subjectsContainer}>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.subjectsTitle, { color: colors.text }]}>
                                    Subject-wise Marks
                                </Text>
                                {result.subjects.map((subject, index) => (
                                    <View key={index} style={styles.subjectRow}>
                                        <Text style={[styles.subjectName, { color: colors.text }]}>
                                            {subject.name}
                                        </Text>
                                        <View style={styles.subjectMarks}>
                                            <Text style={[styles.subjectScore, { color: colors.text }]}>
                                                {subject.marks}/{subject.max_marks}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.subjectGrade,
                                                    { backgroundColor: getGradeColor(subject.grade) + '20' },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.subjectGradeText,
                                                        { color: getGradeColor(subject.grade) },
                                                    ]}
                                                >
                                                    {subject.grade}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Expand Indicator */}
                        <Text style={[styles.expandIndicator, { color: colors.tabIconDefault }]}>
                            {expandedId === result.id ? '▲ Tap to collapse' : '▼ Tap for details'}
                        </Text>
                    </TouchableOpacity>
                ))
            ) : (
                <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Yet</Text>
                    <Text style={[styles.emptyMessage, { color: colors.tabIconDefault }]}>
                        Your exam results will appear here once published.
                    </Text>
                </View>
            )}

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
    resultCard: {
        margin: 16,
        marginBottom: 0,
        padding: 16,
        borderRadius: 16,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    examName: {
        fontSize: 18,
        fontWeight: '600',
    },
    examDate: {
        fontSize: 14,
        marginTop: 4,
    },
    gradeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    gradeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    summaryRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 24,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    summaryLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    subjectsContainer: {
        marginTop: 16,
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    subjectsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    subjectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    subjectName: {
        fontSize: 14,
    },
    subjectMarks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subjectScore: {
        fontSize: 14,
        fontWeight: '600',
    },
    subjectGrade: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    subjectGradeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    expandIndicator: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 12,
    },
    emptyCard: {
        margin: 16,
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        textAlign: 'center',
    },
});
