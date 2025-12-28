// components/Header.js
// Top header bar with search and status

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    success: '#10b981',
    accent: '#6366f1',
};

export const Header = ({
    onMenuPress,
    onNewChat,
    onSearch,
    isConnected = false,
    showMenuButton = false,
}) => {
    const [searchText, setSearchText] = useState('');

    const handleSearch = () => {
        if (searchText.trim()) {
            onSearch?.(searchText);
        }
    };

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
                    placeholder="Search memory, documents, conversations..."
                    placeholderTextColor={COLORS.textDim}
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
            </View>

            {/* Right side - new chat button only (connection status shown in right panel) */}
            <View style={styles.rightSection}>
                {/* New chat button */}
                <TouchableOpacity
                    style={styles.newChatButton}
                    onPress={onNewChat}
                >
                    <Text style={styles.newChatIcon}>＋</Text>
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
        paddingVertical: 12,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    menuIcon: {
        fontSize: 18,
        color: COLORS.text,
    },

    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.panel,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    searchIcon: {
        fontSize: 14,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        paddingVertical: 0,
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },

    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.panel,
        borderRadius: 16,
        marginRight: 10,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },

    statusText: {
        fontSize: 12,
        color: COLORS.textDim,
    },

    newChatButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    newChatIcon: {
        fontSize: 20,
        color: COLORS.text,
    },
});

export default Header;
