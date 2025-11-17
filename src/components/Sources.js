// components/Sources.js
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

/**
 * Lightweight replacement for the Tamagui Sources/Trace components.
 * Exports: TraceList, SourcesAndTraceFooter
 *
 * Types expected (kept same shape):
 *  - Source: { mime_type, document_title, snippet, relevance_score, preview_url, source_id }
 *  - TraceStep: { id, type, message, duration_ms }
 */

const SourceCard = ({ source }) => {
    if (!source) return null;

    const isText = source.mime_type === 'application/pdf' || (source.mime_type || '').startsWith('text/');

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Icon name={isText ? 'file-text' : 'file'} size={20} color="#9ca3af" style={styles.cardIcon} />
                <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                            {source.document_title || 'Document'}
                        </Text>
                        {source.relevance_score != null && (
                            <Text style={styles.cardScore}>{Math.round(source.relevance_score * 100)}%</Text>
                        )}
                    </View>
                    <Text style={styles.cardSnippet} numberOfLines={3}>"{source.snippet}"</Text>
                </View>
            </View>
        </View>
    );
};

const CollapsibleSection = ({ title, count, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!count) return null;
    return (
        <View style={{ marginBottom: 4 }}>
            <TouchableOpacity onPress={() => setIsExpanded((s) => !s)} style={styles.collapsibleBtn}>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
                <Text style={styles.collapsibleText}>{isExpanded ? `Hide ${title}` : `Show ${count} ${title}`}</Text>
            </TouchableOpacity>
            {isExpanded && <View style={{ marginTop: 6 }}>{children}</View>}
        </View>
    );
};

export const TraceList = ({ steps }) => {
    if (!steps || steps.length === 0) return null;
    const getIconName = (type) => {
        switch (type) {
            case 'PLANNING':
                return 'cpu'; // substitute
            case 'EXECUTING':
                return 'tool';
            case 'FINALIZING':
                return 'check-circle';
            default:
                return null;
        }
    };

    return (
        <View style={{ paddingLeft: 4 }}>
            {steps.map((step) => (
                <View key={step.id} style={styles.traceRow}>
                    {getIconName(step.type) ? (
                        <Icon name="circle" size={12} color="#94a3b8" style={{ marginRight: 8 }} />
                    ) : (
                        <ActivityIndicator style={{ marginRight: 8 }} size="small" color="#94a3b8" />
                    )}
                    <Text style={styles.traceText} numberOfLines={2}>
                        {step.message}
                    </Text>
                    {step.duration_ms != null && (
                        <View style={styles.traceDuration}>
                            <Icon name="clock" size={10} color="#9ca3af" />
                            <Text style={styles.durationText}>{step.duration_ms}ms</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

export const SourcesAndTraceFooter = ({ sources = [], trace = [] }) => {
    const hasContent = (sources && sources.length > 0) || (trace && trace.length > 0);
    if (!hasContent) return null;

    return (
        <View style={styles.footer}>
            <CollapsibleSection title="Sources" count={sources.length}>
                {sources.map((s, i) => (
                    <SourceCard key={`source-${i}`} source={s} />
                ))}
            </CollapsibleSection>

            <CollapsibleSection title="Thought Process" count={trace.length}>
                <TraceList steps={trace} />
            </CollapsibleSection>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0f172a',
        padding: 10,
        borderRadius: 10,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { marginRight: 10 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { color: '#e5e7eb', fontWeight: '700', fontSize: 13, flex: 1 },
    cardScore: { color: '#60a5fa', fontSize: 11, marginLeft: 8 },
    cardSnippet: { color: '#cbd5e1', fontStyle: 'italic', marginTop: 4, fontSize: 13, lineHeight: 18 },
    collapsibleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
    collapsibleText: { color: '#94a3b8', marginLeft: 8, fontSize: 12, fontWeight: '500' },
    traceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
    traceText: { color: '#94a3b8', flex: 1, fontSize: 12 },
    traceDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { color: '#9ca3af', fontSize: 10, marginLeft: 4 },
    footer: { borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 4 },
});