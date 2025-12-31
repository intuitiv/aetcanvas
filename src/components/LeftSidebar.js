// components/LeftSidebar.js
// Navigation sidebar matching vision mockup

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    accent: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.15)',
};

const NAV_ITEMS = [
    { id: 'chat', icon: '💬', label: 'Chat' },
    { id: 'reminders', icon: '📋', label: 'Reminders' },
    { id: 'routines', icon: '🔄', label: 'Routines' },
    { id: 'contacts', icon: '👥', label: 'Contacts' },
    { id: 'contacts', icon: '👥', label: 'Contacts' },
    { id: 'search', icon: '🔍', label: 'Search', disabled: true },
];

const NavItem = ({ item, expanded, onPress, isActive }) => {
    const isDisabled = item.disabled;

    return (
        <TouchableOpacity
            style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isDisabled && styles.navItemDisabled,
            ]}
            onPress={() => !isDisabled && onPress?.(item.id)}
            disabled={isDisabled}
        >
            <Text style={styles.navIcon}>{item.icon}</Text>
            {expanded && (
                <Text style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                    isDisabled && styles.navLabelDisabled,
                ]}>
                    {item.label}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export const LeftSidebar = ({
    visible = true,
    expanded = true,
    onNavigate,
    onBodyMapPress,
    onProfilePress,
    activeView = 'chat',
    userProfile = null,
}) => {
    if (!visible) return null;

    // Get initials from profile
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const displayName = userProfile?.display_name || userProfile?.full_name || 'User';

    return (
        <View style={[styles.sidebar, !expanded && styles.sidebarCollapsed]}>
            {/* Logo/Brand - Premium styling */}
            <View style={styles.brand}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>✦</Text>
                </View>
                {expanded && (
                    <View style={styles.brandText}>
                        <Text style={styles.brandName}>Chaetra</Text>
                        <Text style={styles.brandTagline}>Think · Remember · Act</Text>
                    </View>
                )}
            </View>

            {/* Navigation */}
            <View style={styles.nav}>
                {NAV_ITEMS.map(item => (
                    <NavItem
                        key={item.id}
                        item={item}
                        expanded={expanded}
                        onPress={onNavigate}
                        isActive={activeView === item.id}
                    />
                ))}
                
                {/* Apps Section Separator */}
                <View style={[styles.sectionDivider, !expanded && { marginHorizontal: 10 }]} />
                
                {/* API Section */}
                <View>
                    {expanded ? (
                        <Text style={styles.sectionTitle}>API</Text>
                    ) : (
                        <View style={styles.sectionDivider} />
                    )}
                    
                    <NavItem
                        item={{ id: 'api_map', icon: '🗺️', label: 'Component Map' }}
                        expanded={expanded}
                        onPress={onNavigate}
                        isActive={activeView === 'api_map'}
                    />
                    <NavItem
                        item={{ id: 'api_arch', icon: '📐', label: 'Architecture' }}
                        expanded={expanded}
                        onPress={onNavigate}
                        isActive={activeView === 'api_arch'}
                    />
                </View>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Footer - Body Map */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bodyMapButton}
                    onPress={onBodyMapPress}
                >
                    <Text style={styles.bodyMapIcon}>📊</Text>
                    {expanded && (
                        <Text style={styles.bodyMapLabel}>Body Map</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        width: 220,
        backgroundColor: COLORS.panel,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        height: '100%',
        paddingVertical: 16,
    },

    sidebarCollapsed: {
        width: 60,
        alignItems: 'center',
    },

    // Profile Section
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.accentBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.accent,
    },
    profileInfo: {
        marginLeft: 10,
        flex: 1,
    },
    profileName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    profileEmail: {
        fontSize: 10,
        color: COLORS.textDim,
        marginTop: 1,
    },

    // Brand - Premium styling
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    logoContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logo: {
        fontSize: 18,
        color: '#818cf8',
    },

    brandText: {
        marginLeft: 12,
    },

    brandName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 0.5,
    },

    brandTagline: {
        fontSize: 10,
        color: COLORS.accent,
        marginTop: 2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Navigation
    nav: {
        paddingHorizontal: 8,
    },

    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },

    navItemActive: {
        backgroundColor: COLORS.accentBg,
    },

    navItemDisabled: {
        opacity: 0.5,
    },

    navIcon: {
        fontSize: 18,
        width: 28,
        textAlign: 'center',
    },

    navLabel: {
        fontSize: 14,
        color: COLORS.textDim,
        marginLeft: 10,
    },

    navLabelActive: {
        color: COLORS.text,
        fontWeight: '500',
    },

    navLabelDisabled: {
        color: COLORS.textDim,
    },

    // Spacer
    spacer: {
        flex: 1,
    },

    // Footer
    footer: {
        paddingHorizontal: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: 12,
    },

    bodyMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },

    bodyMapIcon: {
        fontSize: 18,
        width: 28,
        textAlign: 'center',
    },

    bodyMapLabel: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '500',
        marginLeft: 10,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 10,
        marginHorizontal: 16,
    },
    
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 16,
        marginBottom: 8,
        marginTop: 6,
    },
});

export default LeftSidebar;
