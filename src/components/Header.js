// components/Header.js
// Top header bar with search, notifications, user avatar

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { NotificationBell } from './NotificationBell';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    success: '#10b981',
    accent: '#818cf8',
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

    // Get initials from profile
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const displayName = userProfile?.display_name || userProfile?.full_name || 'User';

    return (
        <View style={styles.header}>
            {/* Menu button (mobile only) */}
            {showMenuButton && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
            )}

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search reminders, contacts, conversations..."
                    placeholderTextColor={COLORS.textDim}
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
            </View>

            {/* Right side - notification bell, new chat button (chat only), user avatar */}
            <View style={styles.rightSection}>
                {/* Notification Bell */}
                <NotificationBell onNotificationPress={onNotificationPress} />
                
                {/* New chat button - only on Chat view */}
                {activeView === 'chat' && (
                    <TouchableOpacity
                        style={styles.newChatButton}
                        onPress={onNewChat}
                    >
                        <Text style={styles.newChatIcon}>＋</Text>
                    </TouchableOpacity>
                )}

                {/* User Avatar */}
                <TouchableOpacity
                    style={styles.userAvatarBtn}
                    onPress={onProfilePress}
                >
                    {userProfile?.photo_url ? (
                        <Image 
                            source={{ uri: userProfile.photo_url }} 
                            style={styles.userAvatarImage}
                        />
                    ) : (
                        <View style={styles.userAvatarPlaceholder}>
                            <Text style={styles.userAvatarInitials}>
                                {getInitials(displayName)}
                            </Text>
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    menuButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    menuIcon: {
        fontSize: 16,
        color: COLORS.text,
    },

    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.panel,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    searchIcon: {
        fontSize: 12,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
        paddingVertical: 0,
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 8,
    },

    newChatButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    newChatIcon: {
        fontSize: 18,
        color: COLORS.text,
    },

    // User Avatar
    userAvatarBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },

    userAvatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },

    userAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },

    userAvatarInitials: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
});

export default Header;
