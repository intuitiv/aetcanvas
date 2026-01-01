// components/RemindersPanel.js
// iOS-style Reminders Panel with Edit, Swipe Delete, Custom Date, Compact Fonts

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
    Animated,
    PanResponder,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '../services/api';

// ChatGPT-style color palette
const COLORS = {
    bg: '#212121',
    card: '#2f2f2f',
    cardHover: '#3a3a3a',
    text: '#ececf1',
    textSecondary: '#b4b4b4',
    blue: '#10a37f',      // ChatGPT green
    green: '#10b981',
    orange: '#f59e0b',
    red: '#f87171',
    gray: '#6b7280',
    separator: '#3a3a3a',
    accent: '#10a37f',
};

const formatDate = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays < -1) return `${Math.abs(diffDays)}d ago`;
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Swipeable Reminder Row
const ReminderRow = ({ reminder, onToggle, onDelete, onEdit }) => {
    const isDone = reminder.status === 'done';
    const isOverdue = reminder.due_at && new Date(reminder.due_at) < new Date() && !isDone;
    const dueText = formatDate(reminder.due_at);
    
    const isHigh = reminder.title.startsWith('🔴');
    const isLow = reminder.title.startsWith('🟢');
    const displayTitle = reminder.title.replace(/^[🔴🟡🟢]\s*/, '');
    
    const translateX = useRef(new Animated.Value(0)).current;
    const [showDelete, setShowDelete] = useState(false);
    
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => 
                Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx > 0) {
                    translateX.setValue(Math.min(gestureState.dx, 80));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 60) {
                    setShowDelete(true);
                    Animated.spring(translateX, { toValue: 80, useNativeDriver: true }).start();
                } else {
                    setShowDelete(false);
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;
    
    const handleDelete = () => {
        Animated.timing(translateX, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
            onDelete(reminder.id);
        });
    };
    
    const resetSwipe = () => {
        setShowDelete(false);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    };
    
    return (
        <View style={styles.rowContainer}>
            {/* Delete button behind */}
            <TouchableOpacity 
                style={styles.deleteAction}
                onPress={handleDelete}
            >
                <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
            
            <Animated.View
                style={[styles.reminderRow, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => { resetSwipe(); onToggle(reminder.id, isDone); }}
                >
                    <View style={[
                        styles.circle,
                        isDone && styles.circleFilled,
                        isHigh && !isDone && { borderColor: COLORS.red },
                        isLow && !isDone && { borderColor: COLORS.green },
                    ]}>
                        {isDone && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.reminderContent}
                    onPress={() => { resetSwipe(); onEdit(reminder); }}
                >
                    <Text style={[
                        styles.reminderTitle,
                        isDone && styles.reminderTitleDone,
                    ]} numberOfLines={1}>
                        {displayTitle}
                    </Text>
                    
                    {(dueText || reminder.description) && (
                        <View style={styles.reminderMeta}>
                            {dueText && (
                                <Text style={[styles.dueText, isOverdue && styles.dueTextOverdue]}>
                                    {dueText}
                                </Text>
                            )}
                            {dueText && reminder.description && <Text style={styles.metaSep}>·</Text>}
                            {reminder.description && (
                                <Text style={styles.descText} numberOfLines={1}>
                                    {reminder.description}
                                </Text>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
                
                {isHigh && !isDone && (
                    <View style={[styles.priorityDot, { backgroundColor: COLORS.red }]} />
                )}
            </Animated.View>
        </View>
    );
};

// Unified Add/Edit Modal
const ReminderModal = ({ visible, onClose, onSave, onDelete, editingReminder }) => {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [dueDate, setDueDate] = useState(null);
    const [customDate, setCustomDate] = useState('');
    const [priority, setPriority] = useState('medium');
    
    const isEditing = !!editingReminder;
    
    // Populate form when editing
    useEffect(() => {
        if (editingReminder) {
            const cleanTitle = editingReminder.title.replace(/^[🔴🟡🟢]\s*/, '');
            setTitle(cleanTitle);
            setNotes(editingReminder.description || '');
            
            // Determine priority from prefix
            if (editingReminder.title.startsWith('🔴')) setPriority('high');
            else if (editingReminder.title.startsWith('🟢')) setPriority('low');
            else setPriority('medium');
            
            // Determine due date
            if (editingReminder.due_at) {
                const date = new Date(editingReminder.due_at);
                const now = new Date();
                const diffDays = Math.floor((date - now) / 86400000);
                
                if (diffDays === 0) setDueDate('today');
                else if (diffDays === 1) setDueDate('tomorrow');
                else if (diffDays <= 7 && diffDays > 0) setDueDate('week');
                else {
                    setDueDate('custom');
                    setCustomDate(date.toISOString().split('T')[0]);
                }
            } else {
                setDueDate(null);
            }
        } else {
            setTitle('');
            setNotes('');
            setDueDate(null);
            setCustomDate('');
            setPriority('medium');
        }
    }, [editingReminder, visible]);
    
    const handleSave = () => {
        if (!title.trim()) return;
        
        let dueAt = null;
        const now = new Date();
        
        if (dueDate === 'today') {
            dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59).toISOString();
        } else if (dueDate === 'tomorrow') {
            dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59).toISOString();
        } else if (dueDate === 'week') {
            dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59).toISOString();
        } else if (dueDate === 'custom' && customDate) {
            const [year, month, day] = customDate.split('-').map(Number);
            dueAt = new Date(year, month - 1, day, 23, 59).toISOString();
        }
        
        const finalTitle = priority === 'high' ? `🔴 ${title.trim()}` :
                          priority === 'low' ? `🟢 ${title.trim()}` : title.trim();
        
        onSave({ 
            id: editingReminder?.id,
            title: finalTitle, 
            description: notes.trim() || null, 
            due_at: dueAt 
        });
        
        onClose();
    };
    
    const handleDelete = () => {
        if (editingReminder && onDelete) {
            onDelete(editingReminder.id);
            onClose();
        }
    };
    
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit' : 'New'}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={!title.trim()} style={styles.headerBtn}>
                            <Text style={[styles.modalAdd, !title.trim() && styles.modalAddDisabled]}>
                                {isEditing ? 'Save' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Title + Notes */}
                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Title"
                            placeholderTextColor={COLORS.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus={!isEditing}
                        />
                        <View style={styles.inputDivider} />
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Notes"
                            placeholderTextColor={COLORS.textSecondary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </View>
                    
                    {/* Details */}
                    <View style={styles.detailsCard}>
                        {/* Date Row */}
                        <View style={styles.detailRow}>
                            <View style={[styles.detailIcon, { backgroundColor: COLORS.red + '20' }]}>
                                <Ionicons name="calendar" size={12} color={COLORS.red} />
                            </View>
                            <Text style={styles.detailLabel}>Date</Text>
                            <View style={styles.detailOptions}>
                                {[
                                    { id: null, label: '−' },
                                    { id: 'today', label: 'Tdy' },
                                    { id: 'tomorrow', label: 'Tmr' },
                                    { id: 'week', label: 'Wk' },
                                    { id: 'custom', label: '...' },
                                ].map(opt => (
                                    <TouchableOpacity
                                        key={opt.id || 'none'}
                                        style={[styles.detailChip, dueDate === opt.id && styles.detailChipActive]}
                                        onPress={() => setDueDate(opt.id)}
                                    >
                                        <Text style={[styles.detailChipText, dueDate === opt.id && styles.detailChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* Custom Date Input */}
                        {dueDate === 'custom' && (
                            <View style={styles.customDateRow}>
                                <TextInput
                                    style={styles.customDateInput}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={customDate}
                                    onChangeText={setCustomDate}
                                    maxLength={10}
                                />
                            </View>
                        )}
                        
                        <View style={styles.detailDivider} />
                        
                        {/* Priority Row */}
                        <View style={styles.detailRow}>
                            <View style={[styles.detailIcon, { backgroundColor: COLORS.orange + '20' }]}>
                                <Ionicons name="flag" size={12} color={COLORS.orange} />
                            </View>
                            <Text style={styles.detailLabel}>Priority</Text>
                            <View style={styles.detailOptions}>
                                {[
                                    { id: 'low', label: 'Lo', color: COLORS.green },
                                    { id: 'medium', label: '−', color: COLORS.gray },
                                    { id: 'high', label: 'Hi', color: COLORS.red },
                                ].map(opt => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.detailChip,
                                            priority === opt.id && { backgroundColor: opt.color }
                                        ]}
                                        onPress={() => setPriority(opt.id)}
                                    >
                                        <Text style={[styles.detailChipText, priority === opt.id && styles.detailChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                    
                    {/* Delete button for editing */}
                    {isEditing && (
                        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={14} color={COLORS.red} />
                            <Text style={styles.deleteBtnText}>Delete Reminder</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export const RemindersPanel = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filter, setFilter] = useState('all');
    
    const fetchReminders = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reminders?user_id=sainathm&include_done=true`);
            if (response.ok) {
                const data = await response.json();
                setReminders(data.reminders || []);
            }
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    
    useEffect(() => { fetchReminders(); }, [fetchReminders]);
    
    const handleToggle = async (id, isDone) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/reminders/${id}/${isDone ? '' : 'done'}`,
                { 
                    method: isDone ? 'PUT' : 'POST',
                    headers: isDone ? { 'Content-Type': 'application/json' } : undefined,
                    body: isDone ? JSON.stringify({ status: 'pending' }) : undefined
                }
            );
            if (response.ok) fetchReminders();
        } catch (error) {
            console.error('Failed to toggle:', error);
        }
    };
    
    const handleDelete = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/reminders/${id}`, { method: 'DELETE' });
            fetchReminders();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };
    
    const handleSave = async (reminder) => {
        try {
            if (reminder.id) {
                // Update existing
                await fetch(`${API_BASE_URL}/reminders/${reminder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reminder),
                });
            } else {
                // Create new
                await fetch(`${API_BASE_URL}/reminders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...reminder, user_id: 'sainathm' }),
                });
            }
            fetchReminders();
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };
    
    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        setShowModal(true);
    };
    
    const handleAdd = () => {
        setEditingReminder(null);
        setShowModal(true);
    };
    
    // Filter reminders
    const filteredReminders = reminders.filter(r => {
        const isDone = r.status === 'done';
        const isToday = r.due_at && new Date(r.due_at).toDateString() === new Date().toDateString();
        const hasFlag = r.title.startsWith('🔴');
        const hasSchedule = r.due_at;
        
        switch (filter) {
            case 'today': return isToday && !isDone;
            case 'scheduled': return hasSchedule && !isDone;
            case 'flagged': return hasFlag && !isDone;
            default: return !isDone;
        }
    });
    
    // Stats
    const todayCount = reminders.filter(r => r.due_at && new Date(r.due_at).toDateString() === new Date().toDateString() && r.status !== 'done').length;
    const scheduledCount = reminders.filter(r => r.due_at && r.status !== 'done').length;
    const flaggedCount = reminders.filter(r => r.title.startsWith('🔴') && r.status !== 'done').length;
    const allCount = reminders.filter(r => r.status !== 'done').length;
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.blue} />
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {/* Compact stat cards */}
            <View style={styles.statsRow}>
                {[
                    { id: 'today', label: 'Today', count: todayCount, color: COLORS.blue, icon: 'today' },
                    { id: 'scheduled', label: 'Sched', count: scheduledCount, color: COLORS.red, icon: 'calendar' },
                    { id: 'all', label: 'All', count: allCount, color: COLORS.gray, icon: 'list' },
                    { id: 'flagged', label: 'Flag', count: flaggedCount, color: COLORS.orange, icon: 'flag' },
                ].map(stat => (
                    <TouchableOpacity
                        key={stat.id}
                        style={[styles.statCard, filter === stat.id && styles.statCardActive]}
                        onPress={() => setFilter(stat.id)}
                    >
                        <Ionicons name={stat.icon} size={14} color={stat.color} />
                        <Text style={styles.statCount}>{stat.count}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            {/* List */}
            <View style={styles.listSection}>
                <Text style={styles.listTitle}>
                    {filter === 'today' ? 'Today' : filter === 'scheduled' ? 'Scheduled' : filter === 'flagged' ? 'Flagged' : 'All'}
                </Text>
                
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchReminders(); }}
                            tintColor={COLORS.blue}
                        />
                    }
                >
                    {filteredReminders.map(reminder => (
                        <ReminderRow
                            key={reminder.id}
                            reminder={reminder}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                    
                    {filteredReminders.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No reminders</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
            
            {/* Add button */}
            <TouchableOpacity style={styles.fab} onPress={handleAdd}>
                <Ionicons name="add" size={16} color={COLORS.blue} />
                <Text style={styles.fabText}>New</Text>
            </TouchableOpacity>
            
            {/* Modal */}
            <ReminderModal
                visible={showModal}
                onClose={() => { setShowModal(false); setEditingReminder(null); }}
                onSave={handleSave}
                onDelete={handleDelete}
                editingReminder={editingReminder}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
    
    // Compact stats row
    statsRow: { flexDirection: 'row', padding: 8, gap: 6 },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        gap: 2,
    },
    statCardActive: { borderWidth: 1, borderColor: COLORS.blue },
    statCount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase' },
    
    // List section
    listSection: { flex: 1, paddingHorizontal: 12 },
    listTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginLeft: 4 },
    list: { flex: 1 },
    listContent: { paddingBottom: 60 },
    
    // Swipeable row container
    rowContainer: { position: 'relative', marginBottom: 2 },
    deleteAction: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: COLORS.red,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    
    // Reminder row
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 10,
        borderRadius: 6,
    },
    checkbox: { marginRight: 10 },
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleFilled: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
    reminderContent: { flex: 1 },
    reminderTitle: { fontSize: 12, color: COLORS.text, lineHeight: 16, fontWeight: '500' },
    reminderTitleDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    reminderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
    dueText: { fontSize: 11, color: COLORS.textSecondary },
    dueTextOverdue: { color: COLORS.red },
    metaSep: { fontSize: 11, color: COLORS.textSecondary },
    descText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
    priorityDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 8 },
    
    // Empty state
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 13, color: COLORS.textSecondary },
    
    // FAB
    fab: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
    fabText: { fontSize: 13, fontWeight: '600', color: COLORS.blue },
    
    // Compact Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', maxWidth: 380, backgroundColor: COLORS.card, borderRadius: 12, padding: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerBtn: { minWidth: 60 },
    modalCancel: { fontSize: 14, color: COLORS.blue },
    modalTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    modalAdd: { fontSize: 14, fontWeight: '600', color: COLORS.blue, textAlign: 'right' },
    modalAddDisabled: { color: COLORS.textSecondary },
    
    // Input Card
    inputCard: { backgroundColor: COLORS.bg, borderRadius: 8, marginBottom: 12 },
    titleInput: { fontSize: 14, color: COLORS.text, padding: 12 },
    inputDivider: { height: 1, backgroundColor: COLORS.separator, marginHorizontal: 12 },
    notesInput: { fontSize: 13, color: COLORS.text, padding: 12, minHeight: 40 },
    
    // Details Card
    detailsCard: { backgroundColor: COLORS.bg, borderRadius: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    detailIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    detailLabel: { fontSize: 13, color: COLORS.text, marginRight: 10, minWidth: 50 },
    detailOptions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
    detailChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: COLORS.card },
    detailChipActive: { backgroundColor: COLORS.blue },
    detailChipText: { fontSize: 12, color: COLORS.textSecondary },
    detailChipTextActive: { color: '#fff' },
    detailDivider: { height: 1, backgroundColor: COLORS.separator, marginHorizontal: 10 },
    customDateRow: { paddingHorizontal: 10, paddingBottom: 10 },
    customDateInput: { backgroundColor: COLORS.card, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.blue },
    
    // Delete button
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 10 },
    deleteBtnText: { fontSize: 13, color: COLORS.red },
});

export default RemindersPanel;
