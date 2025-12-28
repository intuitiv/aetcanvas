// components/RightPanel.js
// Right sidebar with Sources in Conversation + Connections

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Pastel color palette
const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    accent: '#7c7fdb',
    // Pastel source colors
    gmail: '#e8a5a0',       // Pastel coral
    webex: '#a5dde8',       // Pastel cyan
    calendar: '#a5b8e8',    // Pastel periwinkle
    url: '#a5c4e8',         // Pastel blue
    file: '#a5e8c0',        // Pastel mint
    memory: '#c4a5e8',      // Pastel lavender
    outlook: '#a5b8e8',     // Pastel blue (Microsoft)
};

const API_BASE = 'http://localhost:8000';

// Service configuration with iOS icon names
const SERVICES = [
    {
        id: 'gmail',
        name: 'Gmail',
        iconName: 'mail',           // iOS mail icon
        color: COLORS.gmail,
        authEndpoint: '/api/v1/auth/google/login-desktop',
        statusEndpoint: '/api/v1/channels/gmail/status',
    },
    {
        id: 'outlook',
        name: 'Outlook',
        iconName: 'mail',           // iOS mail icon
        color: COLORS.outlook,
        authEndpoint: '/api/v1/auth/microsoft/login-desktop',
        statusEndpoint: '/api/v1/channels/outlook/status',
    },
    {
        id: 'webex',
        name: 'Webex',
        iconName: 'videocam',       // iOS video camera
        color: COLORS.webex,
        authEndpoint: '/api/v1/auth/webex/login',
        statusEndpoint: '/api/v1/auth/webex/status',
    },
    {
        id: 'calendar',
        name: 'Calendar',
        iconName: 'calendar',       // iOS calendar
        color: COLORS.calendar,
        comingSoon: true,
    },
];

// Section Header
const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

// Source Item in "Sources in Conversation"
const SourceItem = ({ source }) => {
    const getIconAndColor = () => {
        switch (source.type) {
            case 'gmail':
                return { iconName: 'mail', color: COLORS.gmail };
            case 'url':
                return { iconName: 'link', color: COLORS.url };
            case 'file':
            case 'pdf':
                return { iconName: 'document-text', color: COLORS.file };
            case 'memory':
                return { iconName: 'hardware-chip', color: COLORS.memory };
            default:
                return { iconName: 'document', color: COLORS.accent };
        }
    };

    const { iconName, color } = getIconAndColor();

    return (
        <View style={[styles.sourceItem, { borderLeftColor: color }]}>
            <Ionicons name={iconName} size={14} color={color} style={{ marginRight: 8 }} />
            <View style={styles.sourceInfo}>
                <Text style={styles.sourceName} numberOfLines={1}>{source.name}</Text>
                {source.detail && (
                    <Text style={styles.sourceDetail} numberOfLines={1}>{source.detail}</Text>
                )}
            </View>
        </View>
    );
};

// Connection Item
const ConnectionItem = ({ service, status, onConnect, loading }) => {
    const isConnected = status?.connected;

    return (
        <View style={[styles.connectionItem, { borderLeftColor: service.color }]}>
            <View style={[styles.connectionIcon, { backgroundColor: service.color + '20' }]}>
                <Ionicons name={service.iconName} size={16} color={service.color} />
            </View>
            <Text style={styles.connectionName}>{service.name}</Text>

            {service.comingSoon ? (
                <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                </View>
            ) : (
                <View style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? COLORS.success : COLORS.textDim }
                ]} />
            )}

            {!service.comingSoon && !isConnected && (
                <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => onConnect(service)}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : (
                        <Text style={styles.connectBtnText}>+</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

// Main RightPanel
export const RightPanel = ({
    visible = true,
    expanded = true,
    onToggle,
    conversationSources = [],
}) => {
    const [statuses, setStatuses] = useState({});
    const [loading, setLoading] = useState({});

    // Fetch connection statuses
    const fetchStatuses = useCallback(async () => {
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
                newStatuses[service.id] = { connected: false };
            }
        }
        setStatuses(newStatuses);
    }, []);

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
                if (data.auth_url) {
                    await Linking.openURL(data.auth_url);
                }
            }
        } catch (error) {
            console.error(`Connect ${service.id} failed:`, error);
        }
        setLoading(prev => ({ ...prev, [service.id]: false }));
    };

    // Any service connected?
    const hasAnyConnection = Object.values(statuses).some(s => s?.connected);

    if (!visible) return null;

    // Collapsed state
    if (!expanded) {
        return (
            <View style={styles.panelCollapsed}>
                <TouchableOpacity style={styles.toggleBtn} onPress={onToggle}>
                    <Text style={styles.toggleIcon}>◀</Text>
                    <View style={[
                        styles.statusDotSmall,
                        { backgroundColor: hasAnyConnection ? COLORS.success : COLORS.textDim }
                    ]} />
                </TouchableOpacity>
            </View>
        );
    }

    // Group conversation sources by type
    const groupedSources = conversationSources.reduce((acc, src) => {
        const type = src.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(src);
        return acc;
    }, {});

    return (
        <View style={styles.panel}>
            {/* Header with connection status and toggle */}
            <View style={styles.header}>
                <View style={styles.connectedIndicator}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: hasAnyConnection ? COLORS.success : COLORS.textDim }
                    ]} />
                    <Text style={styles.connectedText}>
                        {hasAnyConnection ? 'Connected' : 'Offline'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.toggleBtn} onPress={onToggle}>
                    <Text style={styles.toggleIcon}>▶</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Sources in this Conversation */}
                <SectionHeader title="SOURCES IN THIS CONVERSATION" />
                {conversationSources.length > 0 ? (
                    <View style={styles.sourcesList}>
                        {conversationSources.map((src, i) => (
                            <SourceItem key={i} source={src} />
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No sources used yet</Text>
                )}

                {/* Connections */}
                <SectionHeader title="CONNECTIONS" />
                <View style={styles.connectionsList}>
                    {SERVICES.map(service => (
                        <ConnectionItem
                            key={service.id}
                            service={service}
                            status={statuses[service.id]}
                            loading={loading[service.id]}
                            onConnect={handleConnect}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    panel: {
        width: 260,
        backgroundColor: COLORS.bg,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        height: '100%',
    },

    panelCollapsed: {
        width: 48,
        backgroundColor: COLORS.bg,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        height: '100%',
        alignItems: 'center',
        paddingTop: 12,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    connectedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    connectedText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
        marginLeft: 8,
    },

    toggleBtn: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
    },

    toggleIcon: {
        fontSize: 12,
        color: COLORS.textDim,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },

    content: {
        flex: 1,
        padding: 12,
    },

    // Section
    sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
    },

    sectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textDim,
        letterSpacing: 0.5,
    },

    emptyText: {
        fontSize: 12,
        color: COLORS.textDim,
        fontStyle: 'italic',
        paddingVertical: 8,
    },

    // Sources
    sourcesList: {
        marginBottom: 12,
    },

    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: COLORS.panel,
        borderRadius: 8,
        marginBottom: 6,
        borderLeftWidth: 3,
    },

    sourceIcon: {
        fontSize: 14,
        marginRight: 8,
    },

    sourceInfo: {
        flex: 1,
    },

    sourceName: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },

    sourceDetail: {
        fontSize: 10,
        color: COLORS.textDim,
        marginTop: 1,
    },

    // Connections
    connectionsList: {
        marginTop: 4,
    },

    connectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: COLORS.panel,
        borderRadius: 8,
        marginBottom: 6,
        borderLeftWidth: 3,
    },

    connectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },

    connectionIconText: {
        fontSize: 14,
    },

    connectionName: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text,
        marginLeft: 10,
    },

    soonBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: COLORS.warning + '30',
        borderRadius: 4,
    },

    soonText: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.warning,
    },

    connectBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.accent + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },

    connectBtnText: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
    },
});

export default RightPanel;
