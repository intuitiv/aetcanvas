// ConnectivityPanel.js
// Right-side panel showing connected services status

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    ScrollView,
} from 'react-native';
import { API_BASE } from '../services/api';

// Colors matching vision mockup
const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#6366f1',
    gmail: '#ea4335',
    webex: '#00b8fc',
    calendar: '#4285f4',
};

// Service configuration
const SERVICES = [
    {
        id: 'gmail',
        name: 'Gmail',
        icon: '📧',
        color: COLORS.gmail,
        description: 'Read and send emails',
        authEndpoint: '/api/v1/auth/google/login-desktop',
        statusEndpoint: '/api/v1/channels/gmail/status',
    },
    {
        id: 'webex',
        name: 'Webex',
        icon: '💬',
        color: COLORS.webex,
        description: 'Team messages & meetings',
        authEndpoint: '/api/v1/auth/webex/login',
        statusEndpoint: '/api/v1/channels/webex/status',
        comingSoon: true,
    },
    {
        id: 'calendar',
        name: 'Calendar',
        icon: '📅',
        color: COLORS.calendar,
        description: 'Google Calendar events',
        authEndpoint: '/api/v1/auth/google/login-desktop?scope=calendar',
        statusEndpoint: '/api/v1/channels/calendar/status',
        comingSoon: true,
    },
];

// API base URL from centralized config

// Single service card component - simplified, no disconnect button
const ServiceCard = ({ service, status, onConnect, loading }) => {
    const isConnected = status?.connected;
    const lastSync = status?.last_sync;

    const formatLastSync = (timestamp) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <View style={[styles.serviceCard, { borderLeftColor: service.color }]}>
            <View style={styles.serviceHeader}>
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                    <Text style={styles.serviceIconText}>{service.icon}</Text>
                </View>
                <View style={styles.serviceInfo}>
                    <View style={styles.serviceNameRow}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {service.comingSoon && (
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>Soon</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.serviceDesc}>{service.description}</Text>
                </View>
                {/* Status indicator on the right */}
                {!service.comingSoon && (
                    <View style={[
                        styles.statusDotLarge,
                        { backgroundColor: isConnected ? COLORS.success : COLORS.textDim }
                    ]} />
                )}
            </View>

            {/* Status text - only show if NOT connected */}
            {!service.comingSoon && !isConnected && (
                <Text style={styles.notConnectedText}>Not connected</Text>
            )}

            {/* Only show Connect button if not connected */}
            {!service.comingSoon && !isConnected && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: service.color }]}
                    onPress={() => onConnect(service)}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.actionButtonText}>Connect</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

// Main panel component - collapsible
export const ConnectivityPanel = ({ visible = true, expanded = true, onToggle }) => {
    const [statuses, setStatuses] = useState({});
    const [loading, setLoading] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    // Fetch status for all services
    const fetchStatuses = useCallback(async () => {
        setRefreshing(true);
        const newStatuses = {};

        for (const service of SERVICES) {
            if (service.comingSoon) continue;

            try {
                const response = await fetch(`${API_BASE}${service.statusEndpoint}`);
                if (response.ok) {
                    const data = await response.json();
                    newStatuses[service.id] = data;
                } else {
                    newStatuses[service.id] = { connected: false };
                }
            } catch (error) {
                console.log(`Status check for ${service.id} failed:`, error);
                newStatuses[service.id] = { connected: false };
            }
        }

        setStatuses(newStatuses);
        setRefreshing(false);
    }, []);

    // Initial fetch
    useEffect(() => {
        if (visible) {
            fetchStatuses();
        }
    }, [visible, fetchStatuses]);

    // Handle connect
    const handleConnect = async (service) => {
        setLoading(prev => ({ ...prev, [service.id]: true }));

        try {
            const response = await fetch(`${API_BASE}${service.authEndpoint}`);
            if (response.ok) {
                const data = await response.json();
                // Open auth URL in browser
                if (data.auth_url) {
                    await Linking.openURL(data.auth_url);
                }
            }
        } catch (error) {
            console.error(`Connect ${service.id} failed:`, error);
        }

        setLoading(prev => ({ ...prev, [service.id]: false }));
    };

    // Count connected services
    const connectedCount = Object.values(statuses).filter(s => s?.connected).length;

    if (!visible) return null;

    // Collapsed state - just show hamburger bar
    if (!expanded) {
        return (
            <View style={styles.collapsedPanel}>
                <TouchableOpacity style={styles.hamburgerButton} onPress={onToggle}>
                    <Text style={styles.hamburgerIcon}>☰</Text>
                    <View style={[
                        styles.statusDotSmall,
                        { backgroundColor: connectedCount > 0 ? COLORS.success : COLORS.textDim }
                    ]} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.panel}>
            {/* Header - just title and hamburger */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Connections</Text>
                <TouchableOpacity
                    style={styles.hamburgerButton}
                    onPress={onToggle}
                >
                    <Text style={styles.hamburgerIcon}>☰</Text>
                </TouchableOpacity>
            </View>

            {/* Services list */}
            <ScrollView
                style={styles.servicesList}
                showsVerticalScrollIndicator={false}
            >
                {SERVICES.map(service => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        status={statuses[service.id]}
                        loading={loading[service.id]}
                        onConnect={handleConnect}
                    />
                ))}
            </ScrollView>

            {/* Footer hint */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Connected services help Chaetra understand your context
                </Text>
            </View>
        </View>
    );
};

// Remove ConnectionStatusPill - no longer needed, using hamburger in panel
// export const ConnectionStatusPill = ... (removed)

const styles = StyleSheet.create({
    panel: {
        width: 280,
        backgroundColor: COLORS.panel,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        height: '100%',
    },

    collapsedPanel: {
        width: 48,
        backgroundColor: COLORS.panel,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        height: '100%',
        alignItems: 'center',
        paddingTop: 16,
    },

    hamburgerButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    hamburgerIcon: {
        fontSize: 18,
        color: COLORS.text,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },

    refreshButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },

    refreshIcon: {
        fontSize: 16,
    },

    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    statusDotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    servicesList: {
        flex: 1,
        padding: 12,
    },

    serviceCard: {
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 3,
    },

    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },

    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    serviceIconText: {
        fontSize: 20,
    },

    serviceInfo: {
        flex: 1,
        marginLeft: 12,
    },

    serviceNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    serviceName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },

    comingSoonBadge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: COLORS.warning + '30',
        borderRadius: 4,
    },

    comingSoonText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.warning,
    },

    serviceDesc: {
        fontSize: 12,
        color: COLORS.textDim,
        marginTop: 2,
    },

    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
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

    notConnectedText: {
        fontSize: 11,
        color: COLORS.textDim,
        marginBottom: 10,
    },

    lastSync: {
        fontSize: 11,
        color: COLORS.textDim,
    },

    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },

    disconnectButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.textDim,
    },

    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },

    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },

    footerText: {
        fontSize: 11,
        color: COLORS.textDim,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Status pill styles
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.panel,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },

    statusPillText: {
        fontSize: 12,
        color: COLORS.textDim,
    },
});

export default ConnectivityPanel;
