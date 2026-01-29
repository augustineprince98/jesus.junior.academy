/**
 * Fees Screen
 * 
 * Shows fee payment status and history.
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
import { FeesAPI } from '../../services/api';

interface FeeItem {
    id: number;
    fee_type: string;
    amount: number;
    due_date: string;
    status: 'paid' | 'pending' | 'overdue';
    paid_date?: string;
}

export default function FeesScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuthStore();

    const [fees, setFees] = useState<FeeItem[]>([]);
    const [totalDue, setTotalDue] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            if (user?.student_id) {
                const [due, history] = await Promise.all([
                    FeesAPI.getDue(user.student_id),
                    FeesAPI.getHistory(user.student_id),
                ]);
                setFees([...due, ...history] || []);
                setTotalDue(due.reduce((sum: number, f: any) => sum + f.amount, 0));
                setTotalPaid(history.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + f.amount, 0));
            }
        } catch (error) {
            console.error('Error fetching fees:', error);
            // Mock data for demo
            setFees([
                { id: 1, fee_type: 'Tuition Fee', amount: 15000, due_date: '2024-04-01', status: 'paid', paid_date: '2024-03-28' },
                { id: 2, fee_type: 'Exam Fee', amount: 2000, due_date: '2024-04-15', status: 'paid', paid_date: '2024-04-10' },
                { id: 3, fee_type: 'Lab Fee', amount: 3000, due_date: '2024-05-01', status: 'pending' },
            ]);
            setTotalDue(3000);
            setTotalPaid(17000);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return colors.success;
            case 'pending': return colors.warning;
            case 'overdue': return colors.error;
            default: return colors.tabIconDefault;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
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
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: colors.error }]}>
                    <Text style={styles.summaryLabel}>Due Amount</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalDue)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
                    <Text style={styles.summaryLabel}>Total Paid</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
                </View>
            </View>

            {/* Pay Now Button (if due) */}
            {totalDue > 0 && (
                <TouchableOpacity style={[styles.payButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.payButtonText}>Pay Now - {formatCurrency(totalDue)}</Text>
                </TouchableOpacity>
            )}

            {/* Fee List */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Fee History</Text>

                {fees.map((fee) => (
                    <View
                        key={fee.id}
                        style={[styles.feeCard, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.feeHeader}>
                            <View>
                                <Text style={[styles.feeType, { color: colors.text }]}>
                                    {fee.fee_type}
                                </Text>
                                <Text style={[styles.feeDate, { color: colors.tabIconDefault }]}>
                                    Due: {new Date(fee.due_date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>
                            <View style={styles.feeRight}>
                                <Text style={[styles.feeAmount, { color: colors.text }]}>
                                    {formatCurrency(fee.amount)}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(fee.status) + '20' },
                                    ]}
                                >
                                    <Text
                                        style={[styles.statusText, { color: getStatusColor(fee.status) }]}
                                    >
                                        {fee.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {fee.paid_date && (
                            <Text style={[styles.paidDate, { color: colors.success }]}>
                                ✓ Paid on {new Date(fee.paid_date).toLocaleDateString('en-IN')}
                            </Text>
                        )}
                    </View>
                ))}
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
    summaryRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 4,
    },
    payButton: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    feeCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    feeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    feeType: {
        fontSize: 16,
        fontWeight: '600',
    },
    feeDate: {
        fontSize: 13,
        marginTop: 4,
    },
    feeRight: {
        alignItems: 'flex-end',
    },
    feeAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    paidDate: {
        fontSize: 13,
        marginTop: 12,
    },
});
