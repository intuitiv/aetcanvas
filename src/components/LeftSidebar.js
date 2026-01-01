// components/LeftSidebar.js
// Premium Navigation Sidebar - Glassmorphism Design

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ChatGPT-style Color Palette
const COLORS = {
    // Base colors - matching #212121 theme
    bgDark: '#171717',
    bgPanel: '#171717',
    
    // Glass effects
    glassBg: 'rgba(255, 255, 255, 0.03)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHover: 'rgba(255, 255, 255, 0.06)',
    
    // Accent colors - ChatGPT green
    accentPrimary: '#10a37f',
    accentSecondary: '#1a7f64',
    accentTertiary: '#0d8c6d',
    
    // Text colors
    textPrimary: '#ececf1',
    textSecondary: '#b4b4b4',
    textMuted: '#8e8ea0',
    
    // Glow effects
    glowPrimary: 'rgba(16, 163, 127, 0.3)',
    glowSecondary: 'rgba(16, 163, 127, 0.2)',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
};

const NAV_ITEMS = [
    { id: 'new_chat', icon: '＋', label: 'New Chat', gradient: ['#10a37f', '#1a7f64'], action: true },
    { id: 'chat', icon: '○', label: 'Chat', gradient: ['#10a37f', '#1a7f64'] },
    { id: 'reminders', icon: '◎', label: 'Reminders', gradient: ['#f59e0b', '#ef4444'] },
    { id: 'routines', icon: '↻', label: 'Routines', gradient: ['#10b981', '#14b8a6'] },
    { id: 'contacts', icon: '⊕', label: 'Contacts', gradient: ['#60a5fa', '#3b82f6'] },
];

// Premium Nav Item Component
const NavItem = ({ item, expanded, onPress, isActive, isHovered, onHoverIn, onHoverOut }) => {
    const isDisabled = item.disabled;
    
    return (
        <TouchableOpacity
            style={[
                styles.navItem,
                isHovered && !isDisabled && styles.navItemHover,
                isActive && styles.navItemActive,
                isDisabled && styles.navItemDisabled,
            ]}
            onPress={() => !isDisabled && onPress?.(item.id)}
            disabled={isDisabled}
            onMouseEnter={onHoverIn}
            onMouseLeave={onHoverOut}
            activeOpacity={0.7}
        >
            {/* Active indicator bar */}
            {isActive && (
                <View style={styles.activeIndicator}>
                    <LinearGradient
                        colors={item.gradient || [COLORS.accentPrimary, COLORS.accentSecondary]}
                        style={styles.activeIndicatorGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                </View>
            )}
            
            {/* Icon with glow effect when active */}
            <View style={[styles.navIconContainer, isActive && styles.navIconContainerActive]}>
                <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                    {item.icon}
                </Text>
                {isActive && <View style={styles.iconGlow} />}
            </View>
            
            {expanded && (
                <Text style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                    isDisabled && styles.navLabelDisabled,
                ]}>
                    {item.label}
                </Text>
            )}
            
            {/* Coming soon badge for disabled items */}
            {isDisabled && expanded && (
                <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                </View>
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
    onNewChat,
    onNotificationPress,
    activeView = 'chat',
    userProfile = null,
}) => {
    const [apiExpanded, setApiExpanded] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    
    if (!visible) return null;

    return (
        <View style={[styles.sidebar, !expanded && styles.sidebarCollapsed]}>
            {/* Ambient background glow */}
            <View style={styles.ambientGlow} />
            
            {/* Logo/Brand Section */}
            <View style={styles.brand}>
                <View style={styles.logoWrapper}>
                    <LinearGradient
                        colors={[COLORS.accentPrimary, COLORS.accentSecondary, COLORS.accentTertiary]}
                        style={styles.logoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.logoIcon}>✦</Text>
                    </LinearGradient>
                    <View style={styles.logoGlowEffect} />
                </View>
                
                {expanded && (
                    <View style={styles.brandText}>
                        <Text style={styles.brandName}>Chaetra</Text>
                        <View style={styles.taglineContainer}>
                            <Text style={styles.taglineDot}>●</Text>
                            <Text style={styles.brandTagline}>Think</Text>
                            <Text style={styles.taglineDot}>●</Text>
                            <Text style={styles.brandTagline}>Remember</Text>
                            <Text style={styles.taglineDot}>●</Text>
                            <Text style={styles.brandTagline}>Act</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Quick Actions - Profile */}
            {expanded && (
                <View style={styles.quickActions}>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={onProfilePress}
                    >
                        <Text style={styles.actionIcon}>👤</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Navigation */}
            <View style={styles.nav}>
                <View style={styles.navSection}>
                    {expanded && <Text style={styles.sectionLabel}>MENU</Text>}
                    
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.id}
                            item={item}
                            expanded={expanded}
                            onPress={(id) => {
                                if (id === 'new_chat') {
                                    onNewChat?.();
                                } else {
                                    onNavigate?.(id);
                                }
                            }}
                            isActive={activeView === item.id}
                            isHovered={hoveredItem === item.id}
                            onHoverIn={() => setHoveredItem(item.id)}
                            onHoverOut={() => setHoveredItem(null)}
                        />
                    ))}
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    {expanded && <Text style={styles.dividerText}>DEVELOPER</Text>}
                    <View style={styles.dividerLine} />
                </View>

                {/* API Section - Collapsible */}
                <View style={styles.navSection}>
                    <TouchableOpacity 
                        style={[
                            styles.navItem,
                            (activeView === 'api_map' || activeView === 'api_arch') && styles.navItemActive,
                            hoveredItem === 'api' && styles.navItemHover,
                        ]}
                        onPress={() => setApiExpanded(!apiExpanded)}
                        onMouseEnter={() => setHoveredItem('api')}
                        onMouseLeave={() => setHoveredItem(null)}
                        activeOpacity={0.7}
                    >
                        {(activeView === 'api_map' || activeView === 'api_arch') && (
                            <View style={styles.activeIndicator}>
                                <LinearGradient
                                    colors={['#06b6d4', '#3b82f6']}
                                    style={styles.activeIndicatorGradient}
                                />
                            </View>
                        )}
                        <View style={styles.navIconContainer}>
                            <Text style={styles.navIcon}>🔌</Text>
                        </View>
                        {expanded && (
                            <>
                                <Text style={[
                                    styles.navLabel,
                                    (activeView === 'api_map' || activeView === 'api_arch') && styles.navLabelActive
                                ]}>
                                    API
                                </Text>
                                <View style={styles.expandIcon}>
                                    <Text style={[
                                        styles.expandArrow,
                                        apiExpanded && styles.expandArrowOpen
                                    ]}>
                                        ›
                                    </Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* API Sub-items with animation */}
                    {expanded && apiExpanded && (
                        <View style={styles.subNav}>
                            <View style={styles.subNavLine} />
                            <View style={styles.subNavItems}>
                                <NavItem
                                    item={{ id: 'api_map', icon: '🗺️', label: 'Component Map', gradient: ['#06b6d4', '#3b82f6'] }}
                                    expanded={expanded}
                                    onPress={onNavigate}
                                    isActive={activeView === 'api_map'}
                                    isHovered={hoveredItem === 'api_map'}
                                    onHoverIn={() => setHoveredItem('api_map')}
                                    onHoverOut={() => setHoveredItem(null)}
                                />
                                <NavItem
                                    item={{ id: 'api_arch', icon: '📐', label: 'Architecture', gradient: ['#06b6d4', '#3b82f6'] }}
                                    expanded={expanded}
                                    onPress={onNavigate}
                                    isActive={activeView === 'api_arch'}
                                    isHovered={hoveredItem === 'api_arch'}
                                    onHoverIn={() => setHoveredItem('api_arch')}
                                    onHoverOut={() => setHoveredItem(null)}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Footer - Body Map with premium styling */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.bodyMapButton,
                        hoveredItem === 'bodymap' && styles.bodyMapButtonHover,
                    ]}
                    onPress={onBodyMapPress}
                    onMouseEnter={() => setHoveredItem('bodymap')}
                    onMouseLeave={() => setHoveredItem(null)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.15)', 'rgba(99, 102, 241, 0.05)']}
                        style={styles.bodyMapGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.bodyMapIcon}>📊</Text>
                        {expanded && (
                            <View style={styles.bodyMapTextContainer}>
                                <Text style={styles.bodyMapLabel}>System Status</Text>
                                <View style={styles.statusIndicator}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>All systems online</Text>
                                </View>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                
                {/* Version info */}
                {expanded && (
                    <Text style={styles.versionText}>v0.1.0 • Alpha</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        width: 260,
        backgroundColor: COLORS.bgPanel,
        height: '100%',
        paddingVertical: 0,
        borderRightWidth: 1,
        borderRightColor: COLORS.glassBorder,
        position: 'relative',
        overflow: 'hidden',
    },

    sidebarCollapsed: {
        width: 72,
        alignItems: 'center',
    },

    ambientGlow: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        backgroundColor: COLORS.glowPrimary,
        borderRadius: 150,
        opacity: 0.15,
        ...Platform.select({
            web: {
                filter: 'blur(80px)',
            },
        }),
    },

    // Brand Section
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
    },

    logoWrapper: {
        position: 'relative',
    },

    logoGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            },
        }),
    },

    logoIcon: {
        fontSize: 22,
        color: '#fff',
    },

    logoGlowEffect: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 18,
        backgroundColor: COLORS.glowPrimary,
        opacity: 0.3,
        ...Platform.select({
            web: {
                filter: 'blur(8px)',
            },
        }),
    },

    brandText: {
        marginLeft: 14,
        flex: 1,
    },

    brandName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },

    taglineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    taglineDot: {
        fontSize: 4,
        color: COLORS.accentPrimary,
        marginHorizontal: 6,
    },

    brandTagline: {
        fontSize: 10,
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Navigation
    nav: {
        paddingHorizontal: 12,
        paddingTop: 20,
    },

    navSection: {
        marginBottom: 8,
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginLeft: 12,
        marginBottom: 12,
    },

    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 2,
        position: 'relative',
        backgroundColor: 'transparent',
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
            },
        }),
    },

    navItemHover: {
        backgroundColor: COLORS.glassHover,
    },

    navItemActive: {
        backgroundColor: COLORS.glassBg,
        ...Platform.select({
            web: {
                boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
            },
        }),
    },

    navItemDisabled: {
        opacity: 0.5,
    },

    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: 3,
        borderRadius: 2,
        overflow: 'hidden',
    },

    activeIndicatorGradient: {
        flex: 1,
        borderRadius: 2,
    },

    navIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    navIconContainerActive: {
        backgroundColor: 'transparent',
    },

    navIcon: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },

    navIconActive: {
        transform: [{ scale: 1.1 }],
    },

    iconGlow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 12,
        backgroundColor: COLORS.glowPrimary,
        opacity: 0.3,
        ...Platform.select({
            web: {
                filter: 'blur(4px)',
            },
        }),
    },

    navLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 10,
        fontWeight: '500',
        flex: 1,
    },

    navLabelActive: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },

    navLabelDisabled: {
        color: COLORS.textMuted,
    },

    comingSoonBadge: {
        backgroundColor: 'rgba(100, 116, 139, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 'auto',
    },

    comingSoonText: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        marginHorizontal: 8,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.glassBorder,
    },

    dividerText: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginHorizontal: 12,
    },

    // Expand icon
    expandIcon: {
        marginLeft: 'auto',
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },

    expandArrow: {
        fontSize: 18,
        color: COLORS.textMuted,
        ...Platform.select({
            web: {
                transition: 'transform 0.2s ease',
            },
        }),
    },

    expandArrowOpen: {
        transform: [{ rotate: '90deg' }],
    },

    // Sub Navigation
    subNav: {
        flexDirection: 'row',
        marginLeft: 24,
        marginTop: 4,
    },

    subNavLine: {
        width: 2,
        backgroundColor: COLORS.glassBorder,
        borderRadius: 1,
        marginRight: 12,
    },

    subNavItems: {
        flex: 1,
    },

    // Spacer
    spacer: {
        flex: 1,
    },

    // Footer
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
    },

    bodyMapButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },

    bodyMapButtonHover: {
        ...Platform.select({
            web: {
                transform: [{ scale: 1.02 }],
            },
        }),
    },

    bodyMapGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    bodyMapIcon: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },

    bodyMapTextContainer: {
        marginLeft: 10,
        flex: 1,
    },

    bodyMapLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.success,
        marginRight: 4,
    },

    statusText: {
        fontSize: 10,
        color: COLORS.textMuted,
    },

    versionText: {
        fontSize: 10,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 12,
        letterSpacing: 0.5,
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
    },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },

    actionIcon: {
        fontSize: 14,
    },

    actionLabel: {
        fontSize: 13,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
});

export default LeftSidebar;
