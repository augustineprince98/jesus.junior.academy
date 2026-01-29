/**
 * Profile Screen
 * 
 * User profile, settings, and logout.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const MenuItem = ({
        icon,
        title,
        value,
        onPress,
        isDestructive,
        rightElement,
    }: {
        icon: string;
        title: string;
        value?: string;
        onPress?: () => void;
        isDestructive?: boolean;
        rightElement?: React.ReactNode;
    }) => (
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{icon}</Text>
                <Text
                    style={[
                        styles.menuTitle,
                        { color: isDestructive ? colors.error : colors.text },
                    ]}
                >
                    {title}
                </Text>
            </View>
            {rightElement || (
                <Text style={[styles.menuValue, { color: colors.tabIconDefault }]}>
                    {value} {onPress && '›'}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
                </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
                    ACCOUNT
                </Text>
                <MenuItem
                    icon="👤"
                    title="Edit Profile"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="🔒"
                    title="Change Password"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="📱"
                    title="Phone Number"
                    value={user?.phone_number || 'Not set'}
                />
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
                    PREFERENCES
                </Text>
                <MenuItem
                    icon="🔔"
                    title="Push Notifications"
                    rightElement={
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    }
                />
                <MenuItem
                    icon="🌙"
                    title="Dark Mode"
                    value={colorScheme === 'dark' ? 'On' : 'Off'}
                />
                <MenuItem
                    icon="🌐"
                    title="Language"
                    value="English"
                    onPress={() => { }}
                />
            </View>

            {/* Support Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.tabIconDefault }]}>
                    SUPPORT
                </Text>
                <MenuItem
                    icon="❓"
                    title="Help & FAQ"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="📧"
                    title="Contact Us"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="⭐"
                    title="Rate the App"
                    onPress={() => { }}
                />
            </View>

            {/* Logout */}
            <View style={styles.section}>
                <MenuItem
                    icon="🚪"
                    title="Logout"
                    onPress={handleLogout}
                    isDestructive
                />
            </View>

            {/* App Version */}
            <Text style={[styles.version, { color: colors.tabIconDefault }]}>
                Jesus Junior Academy v1.0.0
            </Text>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileCard: {
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 12,
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIcon: {
        fontSize: 20,
    },
    menuTitle: {
        fontSize: 16,
    },
    menuValue: {
        fontSize: 14,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
    },
});
