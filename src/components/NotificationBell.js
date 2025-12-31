// components/NotificationBell.js
// Notification bell icon with dropdown showing routine digests

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Pressable,
    Animated,
} from 'react-native';
import { API_BASE_URL } from '../services/api';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

// Use centralized API config
const USER_ID = 'sainathm';

export const NotificationBell = ({ onNotificationPress }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            // Show ALL notifications - only hide when deleted
            const response = await fetch(
                `${API_BASE_URL}/notifications?user_id=${USER_ID}&include_read=true`
            );
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);  // Badge = UNREAD only
            }
        } catch (error) {
            console.log('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (notificationId, e) => {
        if (e) e.stopPropagation();
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'POST',
            });
            fetchNotifications();
        } catch (error) {
            console.log('Failed to mark as read:', error);
        }
    };

    const deleteNotification = async (notificationId, e) => {
        if (e) e.stopPropagation();
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
            });
            fetchNotifications();
        } catch (error) {
            console.log('Failed to delete notification:', error);
        }
    };

    const handleNotificationPress = (notification) => {
        // DEV MODE: Don't auto-mark as read - use explicit icons instead
        setIsOpen(false);
        onNotificationPress?.(notification);
    };

    const getNotificationIcon = (source) => {
        switch (source) {
            case 'reddit_digest':
                return '🌍';
            case 'rss_digest':
                return '📰';
            case 'youtube_collection_digest':
                return '🎬';
            case 'bookmarks_digest':
                return '🔖';
            case 'chrome_history_digest':
                return '🔍';
            default:
                return '🔔';
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Bell Button */}
            <TouchableOpacity
                style={styles.bellButton}
                onPress={async () => {
                    setIsOpen(true);
                    // Mark all as read when opening (badge resets)
                    if (unreadCount > 0) {
                        await fetch(`${API_BASE_URL}/notifications/read-all?user_id=${USER_ID}`, {
                            method: 'POST'
                        });
                        fetchNotifications();
                    }
                }}
            >
                <Text style={styles.bellIcon}>🔔</Text>
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setIsOpen(false)}
                >
                    <Pressable 
                        style={styles.dropdown}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Notifications</Text>
                            {notifications.length > 0 && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        // Delete all notifications
                                        for (const n of notifications) {
                                            await fetch(`${API_BASE_URL}/notifications/${n.id}`, {
                                                method: 'DELETE'
                                            });
                                        }
                                        fetchNotifications();
                                    }}
                                >
                                    <Text style={styles.markAllRead}>Clear all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Notification List */}
                        <ScrollView style={styles.notificationList}>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🔔</Text>
                                    <Text style={styles.emptyText}>No notifications yet</Text>
                                    <Text style={styles.emptySubtext}>
                                        Routine digests will appear here
                                    </Text>
                                </View>
                            ) : (
                                notifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[
                                            styles.notificationItem,
                                            !notification.read && styles.unread
                                        ]}
                                        onPress={() => handleNotificationPress(notification)}
                                    >
                                        <Text style={styles.notificationIcon}>
                                            {getNotificationIcon(notification.source)}
                                        </Text>
                                        <View style={styles.notificationContent}>
                                            <Text style={styles.notificationTitle}>
                                                {notification.title}
                                            </Text>
                                            <Text style={styles.notificationMessage}>
                                                {notification.message}
                                            </Text>
                                            <Text style={styles.notificationTime}>
                                                {formatTime(notification.created_at)}
                                            </Text>
                                        </View>
                                        {/* DEV: Only delete button */}
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={(e) => deleteNotification(notification.id, e)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Text style={styles.deleteIcon}>✕</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },

    bellIcon: {
        fontSize: 18,
    },

    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },

    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },

    dropdown: {
        width: 340,
        maxHeight: 480,
        backgroundColor: COLORS.panel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    dropdownTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },

    markAllRead: {
        fontSize: 12,
        color: COLORS.accent,
    },

    notificationList: {
        maxHeight: 400,
    },

    emptyState: {
        padding: 40,
        alignItems: 'center',
    },

    emptyIcon: {
        fontSize: 40,
        opacity: 0.3,
        marginBottom: 12,
    },

    emptyText: {
        fontSize: 14,
        color: COLORS.textDim,
        marginBottom: 4,
    },

    emptySubtext: {
        fontSize: 12,
        color: COLORS.textDim,
        opacity: 0.7,
    },

    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'flex-start',
    },

    unread: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },

    notificationIcon: {
        fontSize: 24,
        marginRight: 12,
    },

    notificationContent: {
        flex: 1,
    },

    notificationTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 2,
    },

    notificationMessage: {
        fontSize: 12,
        color: COLORS.textDim,
        marginBottom: 4,
    },

    notificationTime: {
        fontSize: 10,
        color: COLORS.textDim,
        opacity: 0.7,
    },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
        marginLeft: 8,
        marginTop: 4,
    },

    // DEV: Delete button only
    deleteButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    deleteIcon: {
        fontSize: 12,
        color: COLORS.error,
        fontWeight: 'bold',
    },
});

export default NotificationBell;
