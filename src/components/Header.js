// components/Header.js
// Minimal ChatGPT-style header

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Platform,
} from 'react-native';
import { NotificationBell } from './NotificationBell';

const COLORS = {
    bg: '#212121',
    panel: '#2f2f2f',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ececf1',
    textDim: '#8e8ea0',
    accent: '#10a37f',
};

export const Header = ({
    onMenuPress,
    onNewChat,
    onSearch,
    onNotificationPress,
    onProfilePress,
    activeView = 'chat',
    userProfile = null,
    isConnected = false,
    showMenuButton = false,
}) => {
    const [searchText, setSearchText] = useState('');

    const handleSearch = () => {
        if (searchText.trim()) {
            onSearch?.(searchText);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const displayName = userProfile?.display_name || userProfile?.full_name || 'User';

    // View titles
    const getTitle = () => {
        switch(activeView) {
            case 'chat': return 'Chaetra';
            case 'reminders': return 'Reminders';
            case 'routines': return 'Routines';
            case 'contacts': return 'Contacts';
            case 'api_map': return 'Component Map';
            case 'api_arch': return 'Architecture';
            default: return 'Chaetra';
        }
    };

    return (
        <View style={styles.header}>
            {/* Left section */}
            <View style={styles.leftSection}>
                {showMenuButton && (
                    <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
                        <Text style={styles.iconText}>☰</Text>
                    </TouchableOpacity>
                )}
                
                <Text style={styles.title}>{getTitle()}</Text>
            </View>

            {/* Right section */}
            <View style={styles.rightSection}>
                {/* New chat button - chat view only */}
                {activeView === 'chat' && (
                    <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat}>
                        <Text style={styles.newChatIcon}>✏️</Text>
                        <Text style={styles.newChatText}>New</Text>
                    </TouchableOpacity>
                )}

                {/* Notifications */}
                <NotificationBell onNotificationPress={onNotificationPress} />

                {/* User Avatar */}
                <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress}>
                    {userProfile?.photo_url ? (
                        <Image source={{ uri: userProfile.photo_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.panel,
    },

    iconText: {
        fontSize: 14,
        color: COLORS.text,
    },

    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    newChatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },

    newChatIcon: {
        fontSize: 12,
    },

    newChatText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
    },

    avatarBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: 'hidden',
    },

    avatarImage: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },

    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },

    avatarInitials: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
});

export default Header;
