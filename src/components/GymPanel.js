// components/GymPanel.js
// Active Learning Trainer - Train AI with human feedback
// Features: Stacked cards, swipe animations on both gestures AND buttons

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    TextInput,
    Platform,
    Modal,
    Dimensions,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';

const DOMAIN = 'tool_selection';
const SCREEN_WIDTH = Dimensions.get('window').width;

const COLORS = {
    // Match app theme (#212121 based)
    bg: '#212121',
    cardBg: '#2f2f2f',
    surface: '#3a3a3a',
    accent: '#7c3aed',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    text: '#ececf1',
    textMuted: '#8e8ea0',
};

export const GymPanel = () => {
    const [mode, setMode] = useState('queue');
    const [examples, setExamples] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [streak, setStreak] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [trainingStatus, setTrainingStatus] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editJson, setEditJson] = useState('');
    const [editComment, setEditComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [addInput, setAddInput] = useState('');
    const [addResult, setAddResult] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Animation values for the top card
    const cardPosition = useRef(new Animated.ValueXY()).current;
    const cardOpacity = useRef(new Animated.Value(1)).current;
    const cardRotation = useRef(new Animated.Value(0)).current;

    // Load examples
    const loadExamples = useCallback(async () => {
        try {
            const resp = await fetch(`${API_URL}/gym/${DOMAIN}/next?batch_size=10`);
            const data = await resp.json();
            setExamples(data.examples || []);
            setCurrentIndex(0);
        } catch (e) {
            console.error('Failed to load examples:', e);
            setExamples([
                { id: '1', input: { query: 'Email John about the meeting tomorrow', history: [] }, prediction: { tool: 'send_message', params: { recipient: 'John' } }, confidence: 0.72 },
                { id: '2', input: { query: 'What tasks do I have today?', history: [] }, prediction: { tool: 'filter_reminders', params: { filter_type: 'today' } }, confidence: 0.95 },
                { id: '3', input: { query: 'Show me online meetings this week', history: [] }, prediction: { tool: 'filter_calendar', params: { filter_type: 'online' } }, confidence: 0.68 },
                { id: '4', input: { query: 'Remind me to call mom at 5pm', history: [] }, prediction: { tool: 'create_reminder', params: { title: 'Call mom', time: '5pm' } }, confidence: 0.88 },
            ]);
        }
    }, []);

    const loadTrainingStatus = useCallback(async () => {
        try {
            const resp = await fetch(`${API_URL}/gym/${DOMAIN}/training-status`);
            setTrainingStatus(await resp.json());
        } catch (e) {
            console.error('Failed to load training status:', e);
            setTrainingStatus({ golden_count: 12, prompt_version: 1, new_since_last_train: 5 });
        }
    }, []);

    useEffect(() => {
        loadExamples();
        loadTrainingStatus();
    }, []);

    const submitFeedback = async (exampleId, action, correction = null, comment = null) => {
        try {
            await fetch(`${API_URL}/gym/feedback?domain=${DOMAIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ example_id: exampleId, action, correction, comment }),
            });
        } catch (e) {
            console.error('Feedback error:', e);
        }
    };

    // Reset card position for next card
    const resetCardPosition = () => {
        cardPosition.setValue({ x: 0, y: 0 });
        cardOpacity.setValue(1);
        cardRotation.setValue(0);
    };

    // Animate card swipe
    const animateSwipe = (direction, callback) => {
        if (isAnimating) return;
        setIsAnimating(true);

        let toX = 0, toY = 0, toRotation = 0;
        
        if (direction === 'right') {
            toX = SCREEN_WIDTH + 100;
            toRotation = 15;
        } else if (direction === 'left') {
            toX = -SCREEN_WIDTH - 100;
            toRotation = -15;
        } else if (direction === 'down') {
            toY = 600;
            toRotation = 0;
        }

        Animated.parallel([
            Animated.timing(cardPosition, {
                toValue: { x: toX, y: toY },
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(cardRotation, {
                toValue: toRotation,
                duration: 350,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Reset and advance
            resetCardPosition();
            setSessionCount(prev => prev + 1);
            setCurrentIndex(prev => {
                const next = prev + 1;
                if (next >= examples.length) {
                    loadExamples();
                    return 0;
                }
                return next;
            });
            setIsAnimating(false);
            callback?.();
        });
    };

    // Button actions with animations
    const approveCurrent = async () => {
        const ex = examples[currentIndex];
        if (!ex || isAnimating) return;
        
        animateSwipe('right', async () => {
            await submitFeedback(ex.id, 'approve');
            setStreak(prev => prev + 1);
        });
    };

    const rejectCurrent = () => {
        const ex = examples[currentIndex];
        if (!ex || isAnimating) return;
        
        animateSwipe('left', () => {
            setEditJson(JSON.stringify(ex.prediction, null, 2));
            setEditComment('');
            setEditModalVisible(true);
        });
    };

    const skipCurrent = async () => {
        const ex = examples[currentIndex];
        if (!ex || isAnimating) return;
        
        animateSwipe('down', async () => {
            await submitFeedback(ex.id, 'skip');
        });
    };

    const saveCorrection = async () => {
        const ex = examples[currentIndex > 0 ? currentIndex - 1 : 0];
        if (!ex) return;
        
        try {
            const correction = JSON.parse(editJson);
            await submitFeedback(ex.id, 'reject', correction, editComment);
            setEditModalVisible(false);
            setStreak(0);
        } catch (e) {
            alert('Invalid JSON');
        }
    };

    const startTraining = async () => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/gym/${DOMAIN}/train`, { method: 'POST' });
            const pollStatus = async () => {
                const resp = await fetch(`${API_URL}/gym/${DOMAIN}/training-status`);
                const data = await resp.json();
                setTrainingStatus(data);
                if (data.current_job === 'running') {
                    setTimeout(pollStatus, 1000);
                } else {
                    setLoading(false);
                }
            };
            pollStatus();
        } catch (e) {
            console.error('Train error:', e);
            setLoading(false);
        }
    };

    const renderJson = (obj) => JSON.stringify(obj, null, 2);

    const currentExample = examples[currentIndex];
    const nextCards = examples.slice(currentIndex + 1, currentIndex + 3);

    // Animated styles for top card
    const rotateInterpolate = cardRotation.interpolate({
        inputRange: [-15, 0, 15],
        outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
        <View style={styles.container}>
            {/* Tabs + Streak Row */}
            <View style={styles.tabs}>
                <View style={styles.tabsLeft}>
                    {[
                        { id: 'queue', label: 'Queue' },
                        { id: 'train', label: 'Train' },
                        { id: 'add', label: 'Add Sample' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, mode === tab.id && styles.tabActive]}
                            onPress={() => {
                                setMode(tab.id);
                                if (tab.id === 'train') loadTrainingStatus();
                            }}
                        >
                            <Text style={[styles.tabText, mode === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.streakBadge}>
                    <Text style={styles.fire}>🔥</Text>
                    <Text style={styles.streakText}>{streak}</Text>
                </View>
            </View>

            {/* Queue Mode */}
            {mode === 'queue' && (
                <View style={styles.queuePanel}>
                    <View style={styles.cardStack}>
                        {/* Background cards (static, stacked) */}
                        {nextCards.map((ex, i) => (
                            <View
                                key={ex.id}
                                style={[
                                    styles.card,
                                    styles.stackedCard,
                                    {
                                        zIndex: 10 - i,
                                        transform: [
                                            { translateY: (i + 1) * 12 },
                                            { scale: 1 - ((i + 1) * 0.05) },
                                        ],
                                        opacity: 0.5 - (i * 0.15),
                                    },
                                ]}
                            >
                                <Text style={styles.sectionLabel}>inputs =</Text>
                                <View style={styles.jsonBox}>
                                    <Text style={styles.jsonText} numberOfLines={3}>{renderJson(ex.input)}</Text>
                                </View>
                            </View>
                        ))}
                        
                        {/* Top card (animated) */}
                        {currentExample && (
                            <Animated.View
                                style={[
                                    styles.card,
                                    {
                                        zIndex: 100,
                                        transform: [
                                            { translateX: cardPosition.x },
                                            { translateY: cardPosition.y },
                                            { rotate: rotateInterpolate },
                                        ],
                                        opacity: cardOpacity,
                                    },
                                ]}
                            >
                                <ScrollView style={styles.cardScroll} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.sectionLabel}>📥 inputs =</Text>
                                    <View style={styles.jsonBox}>
                                        <Text style={styles.jsonText}>{renderJson(currentExample.input)}</Text>
                                    </View>
                                    
                                    <Text style={[styles.sectionLabel, styles.outputLabel]}>📤 expected =</Text>
                                    <View style={[styles.jsonBox, styles.outputBox]}>
                                        <Text style={styles.jsonText}>{renderJson(currentExample.prediction)}</Text>
                                    </View>
                                    
                                    {currentExample.confidence && (
                                        <View style={styles.confidenceBadge}>
                                            <Text style={styles.confidenceLabel}>Confidence:</Text>
                                            <Text style={[
                                                styles.confidenceValue,
                                                currentExample.confidence < 0.7 && styles.lowConfidence
                                            ]}>
                                                {Math.round(currentExample.confidence * 100)}%
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>

                    {/* Control buttons */}
                    <View style={styles.controls}>
                        <TouchableOpacity 
                            style={[styles.controlBtn, styles.rejectBtn]} 
                            onPress={rejectCurrent}
                            disabled={isAnimating}
                        >
                            <Text style={[styles.controlBtnIcon, { color: COLORS.danger }]}>✕</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.controlBtn, styles.skipBtn]} 
                            onPress={skipCurrent}
                            disabled={isAnimating}
                        >
                            <Text style={styles.skipBtnIcon}>⏭</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.controlBtn, styles.approveBtn]} 
                            onPress={approveCurrent}
                            disabled={isAnimating}
                        >
                            <Text style={styles.controlBtnIcon}>✓</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Train Mode */}
            {mode === 'train' && (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{trainingStatus?.golden_count || 0}</Text>
                            <Text style={styles.statLabel}>Golden</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>v{trainingStatus?.prompt_version || 1}</Text>
                            <Text style={styles.statLabel}>Version</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{trainingStatus?.new_since_last_train || 0}</Text>
                            <Text style={styles.statLabel}>New</Text>
                        </View>
                    </View>

                    {loading && (
                        <View style={styles.progressBar}>
                            <Animated.View 
                                style={[
                                    styles.progressFill, 
                                    { width: `${(trainingStatus?.progress || 0.5) * 100}%` }
                                ]} 
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.trainBtn, loading && styles.trainBtnDisabled]}
                        onPress={startTraining}
                        disabled={loading}
                    >
                        <Text style={styles.trainBtnText}>
                            {loading ? 'Training...' : 'Train Now'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.statusMessage}>
                        {loading 
                            ? 'Optimizing with DSPy...'
                            : '20+ golden samples recommended'}
                    </Text>
                </ScrollView>
            )}

            {/* Add Mode */}
            {mode === 'add' && (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                    <Text style={styles.inputLabel}>Input JSON</Text>
                    <TextInput
                        style={styles.addInput}
                        multiline
                        value={addInput}
                        onChangeText={setAddInput}
                        placeholder='{"query": "Email John", "history": []}'
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <TouchableOpacity 
                        style={styles.runBtn}
                        onPress={async () => {
                            try {
                                const input = JSON.parse(addInput || '{"query": "test", "history": []}');
                                const resp = await fetch(`${API_URL}/gym/${DOMAIN}/predict`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(input),
                                });
                                const result = await resp.json();
                                setAddResult(result.prediction || result);
                            } catch (e) {
                                setAddResult({ error: 'Failed to get prediction' });
                            }
                        }}
                    >
                        <Text style={styles.runBtnText}>Run Prediction</Text>
                    </TouchableOpacity>

                    {addResult && (
                        <View style={styles.resultSection}>
                            <Text style={styles.inputLabel}>Prediction</Text>
                            <View style={[styles.jsonBox, styles.outputBox]}>
                                <Text style={styles.jsonText}>{JSON.stringify(addResult, null, 2)}</Text>
                            </View>
                            
                            <View style={styles.addActions}>
                                <TouchableOpacity 
                                    style={styles.correctBtn}
                                    onPress={async () => {
                                        try {
                                            const input = JSON.parse(addInput);
                                            await fetch(`${API_URL}/gym/feedback?domain=${DOMAIN}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    example_id: `manual_${Date.now()}`,
                                                    action: 'approve',
                                                    correction: addResult,
                                                    input: input,
                                                }),
                                            });
                                            setAddResult(null);
                                            setAddInput('');
                                            alert('Added to golden samples!');
                                        } catch (e) {
                                            alert('Failed to add');
                                        }
                                    }}
                                >
                                    <Text style={styles.correctBtnText}>✓ Add to Golden</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.wrongBtn}
                                    onPress={() => setAddResult(null)}
                                >
                                    <Text style={styles.wrongBtnText}>✕ Discard</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Tool Selection • {sessionCount} reviewed this session
                </Text>
            </View>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>✏️ Fix Expected Output</Text>
                        
                        <Text style={styles.modalLabel}>Corrected JSON (for DSPy)</Text>
                        <TextInput
                            style={styles.modalInput}
                            multiline
                            value={editJson}
                            onChangeText={setEditJson}
                        />
                        
                        <Text style={styles.modalLabel}>💬 Comment (optional)</Text>
                        <TextInput
                            style={[styles.modalInput, styles.commentInput]}
                            multiline
                            value={editComment}
                            onChangeText={setEditComment}
                            placeholder="e.g., 'Need to filter events first before RSVP'"
                            placeholderTextColor={COLORS.textMuted}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={saveCorrection}>
                                <Text style={styles.saveBtnText}>Save & Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    fire: { fontSize: 18 },
    streakText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    tabsLeft: {
        flexDirection: 'row',
        gap: 8,
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: COLORS.surface,
    },
    tabActive: {
        backgroundColor: COLORS.accent,
    },
    tabText: {
        color: COLORS.textMuted,
        fontWeight: '500',
        fontSize: 12,
    },
    tabTextActive: {
        color: 'white',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    fire: { fontSize: 12 },
    streakText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 12,
    },
    content: {
        flex: 1,
    },
    contentInner: {
        padding: 20,
    },
    
    // Queue Mode
    queuePanel: {
        flex: 1,
        padding: 20,
    },
    cardStack: {
        flex: 1,
        marginBottom: 20,
        position: 'relative',
        minHeight: 380,
    },
    card: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.surface,
        minHeight: 350,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 25,
            },
            android: { elevation: 15 },
            web: { boxShadow: '0 15px 40px rgba(0,0,0,0.6)' },
        }),
    },
    stackedCard: {
        minHeight: 100,
    },
    cardScroll: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    outputLabel: {
        color: COLORS.accent,
        marginTop: 20,
    },
    jsonBox: {
        backgroundColor: '#0d0f14',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    outputBox: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
    },
    jsonText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 20,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    confidenceLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    confidenceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    lowConfidence: {
        color: COLORS.warning,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 10,
    },
    controlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
            web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
        }),
    },
    rejectBtn: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.danger,
    },
    skipBtn: {
        backgroundColor: COLORS.surface,
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    approveBtn: {
        backgroundColor: COLORS.success,
    },
    controlBtnIcon: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    skipBtnIcon: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    controlLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    controlLabelLight: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    swipeHint: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 16,
        fontWeight: '500',
    },

    // Train Mode
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    progressBar: {
        height: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.accent,
        borderRadius: 12,
    },
    trainBtn: {
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    trainBtnGradient: {
        padding: 16,
        alignItems: 'center',
    },
    trainBtnDisabled: {
        opacity: 0.6,
    },
    trainBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    statusMessage: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: 16,
        fontSize: 13,
    },

    // Add Mode
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    addInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 100,
        marginBottom: 12,
        fontSize: 12,
        textAlignVertical: 'top',
    },
    runBtn: {
        backgroundColor: COLORS.accent,
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    runBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
    resultSection: {
        marginTop: 16,
    },
    addActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    correctBtn: {
        flex: 1,
        backgroundColor: COLORS.success,
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    correctBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    wrongBtn: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    wrongBtnText: {
        color: COLORS.danger,
        fontWeight: 'bold',
        fontSize: 12,
    },

    // Footer
    footer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.surface,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 12,
        color: COLORS.accent,
        marginBottom: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        color: COLORS.text,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 150,
        marginBottom: 16,
        fontSize: 13,
        textAlignVertical: 'top',
    },
    commentInput: {
        minHeight: 80,
        fontFamily: undefined,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        backgroundColor: COLORS.accent,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default GymPanel;
