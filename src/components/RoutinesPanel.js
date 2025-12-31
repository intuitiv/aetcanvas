// components/RoutinesPanel.js
// Panel showing all routines with status, last run, and run controls

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const STATUS_CONFIG = {
    success: { icon: 'checkmark-circle', color: COLORS.success, label: 'Success' },
    error: { icon: 'close-circle', color: COLORS.error, label: 'Error' },
    running: { icon: 'sync', color: COLORS.warning, label: 'Running' },
    not_configured: { icon: 'settings-outline', color: COLORS.textDim, label: 'Not configured' },
    never_run: { icon: 'time-outline', color: COLORS.textDim, label: 'Never run' },
};

const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const RoutineCard = ({ routine, onRun }) => {
    const status = routine.last_status || 'never_run';
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.never_run;
    
    // Sync isRunning with actual status from API
    const isActuallyRunning = status === 'running';
    const [isLocalRunning, setIsLocalRunning] = useState(false);
    const isRunning = isLocalRunning || isActuallyRunning;
    
    // Reset local running state when API confirms completion
    useEffect(() => {
        if (status !== 'running' && isLocalRunning) {
            setIsLocalRunning(false);
        }
    }, [status, isLocalRunning]);
    
    const handleRun = async () => {
        setIsLocalRunning(true);
        try {
            await onRun(routine.id);
        } catch (e) {
            console.error('Failed to run routine:', e);
            setIsLocalRunning(false);
        }
    };
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{routine.icon}</Text>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{routine.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>
                        {routine.description}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.runButton,
                        isRunning && styles.runButtonDisabled
                    ]}
                    onPress={handleRun}
                    disabled={isRunning}
                >
                    {isRunning ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : (
                        <>
                            <Ionicons name="play" size={14} color="#fff" />
                            <Text style={styles.runButtonText}>Run</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
            
            <View style={styles.cardStatus}>
                <View style={styles.statusItem}>
                    <Ionicons
                        name={statusConfig.icon}
                        size={14}
                        color={statusConfig.color}
                    />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>
                
                <View style={styles.statusItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textDim} />
                    <Text style={styles.statusText}>
                        Last: {formatRelativeTime(routine.last_run_at)}
                    </Text>
                </View>
                
                {routine.schedule_enabled && (
                    <View style={styles.statusItem}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.textDim} />
                        <Text style={styles.statusText}>
                            {routine.schedule_cron || 'Scheduled'}
                        </Text>
                    </View>
                )}
            </View>
            
            {routine.last_error && status === 'error' && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText} numberOfLines={2}>
                        {routine.last_error}
                    </Text>
                </View>
            )}
        </View>
    );
};

export const RoutinesPanel = () => {
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const fetchRoutines = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/routines`);
            if (response.ok) {
                const data = await response.json();
                setRoutines(data);
            }
        } catch (error) {
            console.error('Failed to fetch routines:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    
    useEffect(() => {
        fetchRoutines();
        // Poll for status updates
        const interval = setInterval(fetchRoutines, 10000);
        return () => clearInterval(interval);
    }, [fetchRoutines]);
    
    const handleRun = async (routineId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/routines/${routineId}/run?user_id=sainathm`,
                { method: 'POST' }
            );
            if (response.ok) {
                // Refresh immediately to show running state
                fetchRoutines();
            }
        } catch (error) {
            console.error('Failed to run routine:', error);
        }
    };
    
    const onRefresh = () => {
        setRefreshing(true);
        fetchRoutines();
    };
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Loading routines...</Text>
            </View>
        );
    }
    
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.accent}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🔄 Routines</Text>
                <Text style={styles.headerSubtitle}>
                    {routines.length} routines • Pull to refresh
                </Text>
            </View>
            
            {routines.map((routine) => (
                <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onRun={handleRun}
                />
            ))}
            
            {routines.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No routines found</Text>
                    <Text style={styles.emptySubtext}>
                        Add patterns to brain/pattern/compositions/
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    content: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
    },
    loadingText: {
        color: COLORS.textDim,
        marginTop: 12,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textDim,
        marginTop: 4,
    },
    card: {
        backgroundColor: COLORS.panel,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    cardDesc: {
        fontSize: 12,
        color: COLORS.textDim,
        marginTop: 2,
    },
    runButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    runButtonDisabled: {
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    runButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardStatus: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 12,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        color: COLORS.textDim,
    },
    errorBox: {
        marginTop: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 6,
        padding: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.error,
    },
    errorText: {
        fontSize: 11,
        color: COLORS.error,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 48,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.text,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 12,
        color: COLORS.textDim,
        marginTop: 4,
    },
});

export default RoutinesPanel;
