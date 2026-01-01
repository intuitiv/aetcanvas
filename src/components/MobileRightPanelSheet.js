// components/MobileRightPanelSheet.js
// Draggable bottom sheet with gesture support for connections and sources

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Linking,
    Animated,
    Dimensions,
    Platform,
    PanResponder,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_BASE } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sheet snap points
const SNAP_POINTS = {
    CLOSED: SCREEN_HEIGHT,
    HALF: SCREEN_HEIGHT * 0.5,
    FULL: SCREEN_HEIGHT * 0.08, // Leave a small top margin
};

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    accent: '#7c7fdb',
    gmail: '#e8a5a0',
    webex: '#a5dde8',
    calendar: '#a5b8e8',
    outlook: '#a5b8e8',
    url: '#a5c4e8',
    file: '#a5e8c0',
    memory: '#c4a5e8',
    backdrop: 'rgba(0, 0, 0, 0.6)',
};


const SERVICES = [
    {
        id: 'gmail',
        name: 'Gmail',
        iconName: 'mail',
        color: COLORS.gmail,
        authEndpoint: '/api/v1/auth/google/login-desktop',
        statusEndpoint: '/api/v1/channels/gmail/status',
    },
    {
        id: 'outlook',
        name: 'Outlook',
        iconName: 'mail',
        color: COLORS.outlook,
        authEndpoint: '/api/v1/auth/microsoft/login-desktop',
        statusEndpoint: '/api/v1/channels/outlook/status',
    },
    {
        id: 'webex',
        name: 'Webex',
        iconName: 'videocam',
        color: COLORS.webex,
        authEndpoint: '/api/v1/auth/webex/login',
        statusEndpoint: '/api/v1/auth/webex/status',
    },
    {
        id: 'calendar',
        name: 'Calendar',
        iconName: 'calendar',
        color: COLORS.calendar,
        authEndpoint: '/api/v1/auth/google/login-desktop?scope=calendar',
        statusEndpoint: '/api/v1/channels/calendar/status',
    },
];

// Connection Item
const ConnectionItem = ({ service, status, onConnect, loading }) => {
    const isConnected = status?.connected;

    return (
        <View style={[styles.connectionItem, { borderLeftColor: service.color }]}>
            <View style={[styles.connectionIcon, { backgroundColor: service.color + '20' }]}>
                <Ionicons name={service.iconName} size={18} color={service.color} />
            </View>
            <Text style={styles.connectionName}>{service.name}</Text>

            {service.comingSoon ? (
                <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                </View>
            ) : isConnected ? (
                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            ) : (
                <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => onConnect(service)}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : (
                        <Text style={styles.connectBtnText}>Connect</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

// Source Item
const SourceItem = ({ source }) => {
    const getIconAndColor = () => {
        switch (source.type) {
            case 'gmail':
                return { iconName: 'mail', color: COLORS.gmail };
            case 'outlook':
                return { iconName: 'mail', color: COLORS.outlook };
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
            <Ionicons name={iconName} size={16} color={color} style={{ marginRight: 10 }} />
            <View style={styles.sourceInfo}>
                <Text style={styles.sourceName} numberOfLines={1}>{source.name}</Text>
                {source.detail && (
                    <Text style={styles.sourceDetail} numberOfLines={1}>{source.detail}</Text>
                )}
            </View>
        </View>
    );
};

export const MobileRightPanelSheet = ({
    visible,
    onClose,
    conversationSources = [],
}) => {
    const [statuses, setStatuses] = useState({});
    const [loading, setLoading] = useState({});
    const [currentSnapPoint, setCurrentSnapPoint] = useState(SNAP_POINTS.HALF);
    
    const translateY = useRef(new Animated.Value(SNAP_POINTS.CLOSED)).current;
    const lastTranslateY = useRef(SNAP_POINTS.CLOSED);
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Snap to a specific point with animation
    const snapTo = useCallback((point) => {
        setCurrentSnapPoint(point);
        lastTranslateY.current = point;
        
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: point,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }),
            Animated.timing(backdropOpacity, {
                toValue: point === SNAP_POINTS.CLOSED ? 0 : 0.6,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (point === SNAP_POINTS.CLOSED) {
                onClose();
            }
        });
    }, [translateY, backdropOpacity, onClose]);

    // Find closest snap point
    const findClosestSnapPoint = (currentY, velocityY) => {
        const snapPoints = [SNAP_POINTS.FULL, SNAP_POINTS.HALF, SNAP_POINTS.CLOSED];
        
        // If flinging down fast, close it
        if (velocityY > 1500) {
            return SNAP_POINTS.CLOSED;
        }
        // If flinging up fast, go full screen
        if (velocityY < -1000) {
            return SNAP_POINTS.FULL;
        }
        
        // Otherwise find closest snap point
        let closest = snapPoints[0];
        let minDistance = Math.abs(currentY - snapPoints[0]);
        
        for (const point of snapPoints) {
            const distance = Math.abs(currentY - point);
            if (distance < minDistance) {
                minDistance = distance;
                closest = point;
            }
        }
        
        return closest;
    };

    // Pan responder for drag gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical gestures
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                translateY.setOffset(lastTranslateY.current);
                translateY.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                // Limit upward movement
                const newY = Math.max(SNAP_POINTS.FULL, lastTranslateY.current + gestureState.dy);
                translateY.setValue(gestureState.dy);
                
                // Update backdrop opacity based on position
                const progress = 1 - (newY / SCREEN_HEIGHT);
                backdropOpacity.setValue(Math.min(0.6, progress * 0.6));
            },
            onPanResponderRelease: (_, gestureState) => {
                translateY.flattenOffset();
                const currentY = lastTranslateY.current + gestureState.dy;
                const snapPoint = findClosestSnapPoint(currentY, gestureState.vy);
                snapTo(snapPoint);
            },
        })
    ).current;

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
            snapTo(SNAP_POINTS.HALF);
        } else {
            translateY.setValue(SNAP_POINTS.CLOSED);
            lastTranslateY.current = SNAP_POINTS.CLOSED;
            backdropOpacity.setValue(0);
        }
    }, [visible, fetchStatuses, snapTo, translateY, backdropOpacity]);

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

    const hasAnyConnection = Object.values(statuses).some(s => s?.connected);
    const isFullScreen = currentSnapPoint === SNAP_POINTS.FULL;

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={() => snapTo(SNAP_POINTS.CLOSED)}
        >
            <View style={styles.modalContainer}>
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={() => snapTo(SNAP_POINTS.CLOSED)}>
                    <Animated.View 
                        style={[
                            styles.backdrop, 
                            { opacity: backdropOpacity }
                        ]} 
                    />
                </TouchableWithoutFeedback>

                {/* Sheet */}
                <Animated.View
                    style={[
                        styles.sheet,
                        isFullScreen && styles.sheetFullScreen,
                        { transform: [{ translateY }] }
                    ]}
                >
                    {/* Drag handle - entire top area is draggable */}
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={[
                                    styles.statusDotLarge,
                                    { backgroundColor: hasAnyConnection ? COLORS.success : COLORS.textDim }
                                ]} />
                                <Text style={styles.headerTitle}>
                                    {hasAnyConnection ? 'Connected' : 'Offline'}
                                </Text>
                            </View>
                            {/* Visual indicator for sheet state */}
                            <View style={styles.sheetStateIndicator}>
                                <Ionicons 
                                    name={isFullScreen ? "chevron-down" : "chevron-up"} 
                                    size={18} 
                                    color={COLORS.textDim} 
                                />
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        scrollEnabled={isFullScreen}
                    >
                        {/* Connections Section */}
                        <Text style={styles.sectionTitle}>CONNECTIONS</Text>
                        <View style={styles.sectionContent}>
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

                        {/* Sources Section */}
                        <Text style={styles.sectionTitle}>SOURCES IN CONVERSATION</Text>
                        <View style={styles.sectionContent}>
                            {conversationSources.length > 0 ? (
                                conversationSources.map((src, i) => (
                                    <SourceItem key={i} source={src} />
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No sources used yet</Text>
                            )}
                        </View>
                    </ScrollView>

                    {/* Safe area bottom */}
                    <View style={styles.safeAreaBottom} />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.backdrop,
    },

    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: COLORS.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },

    sheetFullScreen: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    dragArea: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },

    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },

    handle: {
        width: 48,
        height: 5,
        backgroundColor: COLORS.textDim,
        borderRadius: 3,
        opacity: 0.6,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    statusDotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },

    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },

    sheetStateIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
    },

    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textDim,
        letterSpacing: 0.5,
        marginTop: 20,
        marginBottom: 12,
    },

    sectionContent: {
        marginBottom: 8,
    },

    // Connection item styles
    connectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.panel,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
    },

    connectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    connectionName: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        marginLeft: 12,
        fontWeight: '500',
    },

    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    soonBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: COLORS.warning + '30',
        borderRadius: 6,
    },

    soonText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.warning,
    },

    connectBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: COLORS.accent + '30',
        borderRadius: 8,
    },

    connectBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accent,
    },

    // Source item styles
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.panel,
        borderRadius: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
    },

    sourceInfo: {
        flex: 1,
    },

    sourceName: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },

    sourceDetail: {
        fontSize: 11,
        color: COLORS.textDim,
        marginTop: 2,
    },

    emptyText: {
        fontSize: 13,
        color: COLORS.textDim,
        fontStyle: 'italic',
        paddingVertical: 12,
    },

    safeAreaBottom: {
        height: Platform.OS === 'ios' ? 34 : 16,
    },
});

export default MobileRightPanelSheet;
