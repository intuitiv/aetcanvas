// components/Sources.js
// Updated to match vision mockup styling with source pills and URL support
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Source types:
 *  - document_chunk: { document_title, snippet, relevance_score, source_id, mime_type }
 *  - url_content: { url, page_title, snippet, from_cache, relevance_score }
 *  - memory_item: { snippet, relevance_score, source_id }
 *  - TraceStep: { id, type, message, duration_ms }
 */

// Pastel color palette (soft, light tones)
const COLORS = {
    accent: '#7c7fdb',      // Pastel indigo
    text: '#e2e8f0',
    textDim: '#94a3b8',
    bgCard: '#1a1a2e',
    bgHover: '#252540',
    // Pastel source colors
    gmail: '#e8a5a0',       // Pastel coral
    outlook: '#a5b8e8',     // Pastel blue (Microsoft)
    url: '#a5c4e8',         // Pastel blue
    file: '#a5e8c0',        // Pastel mint
    memory: '#c4a5e8',      // Pastel lavender
    webex: '#a5dde8',       // Pastel cyan
    calendar: '#a5b8e8',    // Pastel periwinkle
};

// iOS-style icon names (Ionicons - matches Apple SF Symbols)
const IOS_ICONS = {
    gmail: 'mail',              // iOS mail icon
    outlook: 'mail',            // iOS mail icon for Outlook
    email: 'mail',
    webex: 'videocam',          // iOS video camera icon
    calendar: 'calendar',       // iOS calendar icon
    url: 'link',                // iOS link icon
    document: 'document-text',  // iOS document icon
    file: 'document',
    memory: 'hardware-chip',    // iOS chip/memory icon
    note: 'document-text',
};

// --- Source Pill (inline compact view matching vision) ---
const SourcePill = ({ source }) => {
    const getIconAndColor = () => {
        switch (source.source_type) {
            case 'url_content':
                return {
                    icon: '🔗',
                    color: COLORS.url,
                    label: source.page_title || (source.url ? new URL(source.url).hostname : 'URL')
                };
            case 'document_chunk':
                return {
                    icon: '📎',
                    color: COLORS.file,
                    label: source.document_title || 'Attachment'
                };
            case 'memory_item':
                // Determine specific type from snippet content
                const snippet = (source.snippet || '').toLowerCase();
                if (snippet.includes('gmail') || snippet.includes('email')) {
                    return { icon: '📧', color: COLORS.gmail, label: 'Gmail' };
                } else if (snippet.includes('webex') || snippet.includes('teams')) {
                    return { icon: '💬', color: '#00b8fc', label: 'Webex' };
                } else if (snippet.includes('calendar')) {
                    return { icon: '📅', color: '#4285f4', label: 'Calendar' };
                }
                return { icon: '📝', color: COLORS.memory, label: source.snippet || 'Note' };
            default:
                return { icon: '📎', color: COLORS.accent, label: 'Source' };
        }
    };

    const { icon, color, label } = getIconAndColor();

    const handlePress = () => {
        if (source.source_type === 'url_content' && source.url) {
            Linking.openURL(source.url);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.pill, { borderColor: color }]}
            onPress={handlePress}
            disabled={source.source_type !== 'url_content'}
        >
            <Text style={styles.pillText}>{icon} {label}</Text>
            {source.from_cache && <Text style={styles.pillCached}>⚡</Text>}
        </TouchableOpacity>
    );
};

// --- Source Card (expanded view with snippet) ---
const SourceCard = ({ source }) => {
    if (!source) return null;

    const getCardStyle = () => {
        switch (source.source_type) {
            case 'url_content':
                return {
                    borderLeftColor: COLORS.url,
                    icon: '🔗',
                    iconBg: COLORS.url,
                    label: source.page_title || (source.url ? new URL(source.url).hostname : 'URL')
                };
            case 'document_chunk':
                return {
                    borderLeftColor: COLORS.file,
                    icon: '📎',
                    iconBg: COLORS.file,
                    label: source.document_title || 'Attachment'
                };
            case 'memory_item':
                // Determine specific type from snippet content
                const snippet = (source.snippet || '').toLowerCase();
                if (snippet.includes('gmail') || snippet.includes('email')) {
                    return { borderLeftColor: COLORS.gmail, icon: '📧', iconBg: COLORS.gmail, label: 'Gmail' };
                } else if (snippet.includes('webex') || snippet.includes('teams')) {
                    return { borderLeftColor: '#00b8fc', icon: '💬', iconBg: '#00b8fc', label: 'Webex' };
                } else if (snippet.includes('calendar')) {
                    return { borderLeftColor: '#4285f4', icon: '📅', iconBg: '#4285f4', label: 'Calendar' };
                }
                return { borderLeftColor: COLORS.memory, icon: '📝', iconBg: COLORS.memory, label: 'Note' };
            default:
                return { borderLeftColor: COLORS.accent, icon: '📎', iconBg: COLORS.accent, label: 'Source' };
        }
    };

    const { borderLeftColor, icon, iconBg, label } = getCardStyle();
    const subtitle = source.url ? new URL(source.url).hostname : null;

    return (
        <View style={[styles.card, { borderLeftColor, borderLeftWidth: 3 }]}>
            <View style={[styles.cardIconBox, { backgroundColor: iconBg }]}>
                <Text style={styles.cardIcon}>{icon}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{label}</Text>
                {subtitle && (
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                )}
                {source.snippet && (
                    <Text style={styles.cardSnippet} numberOfLines={2}>
                        "{source.snippet}"
                    </Text>
                )}
            </View>
            {source.relevance_score != null && (
                <Text style={styles.cardScore}>{Math.round(source.relevance_score * 100)}%</Text>
            )}
        </View>
    );
};

// --- Source Pills Row with grouping and counts (matching mockup) ---
export const SourcePillsRow = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    // Group sources by type and count them
    const grouped = sources.reduce((acc, source) => {
        let type = 'other';
        let label = 'Source';
        let color = COLORS.accent;
        let iconType = 'file';

        if (source.source_type === 'url_content') {
            type = 'url';
            iconType = 'url';
            color = COLORS.url;
            label = 'URL';
        } else if (source.source_type === 'document_chunk') {
            type = 'document';
            iconType = 'document';
            color = COLORS.file;
            label = 'Document';
        } else if (source.source_type === 'memory' || source.source_type === 'memory_item') {
            // Check memory_type first (from backend), then fallback to snippet detection
            const memoryType = source.memory_type || '';
            const snippet = (source.snippet || source.description || '').toLowerCase();

            // Check memory_type FIRST (most reliable), then fallback to snippet detection
            // Order matters: check Outlook BEFORE Gmail to prevent 'emails from Outlook' matching Gmail
            if (memoryType === 'outlook') {
                type = 'outlook';
                iconType = 'outlook';
                color = COLORS.outlook;
                label = 'Outlook';
            } else if (memoryType === 'gmail') {
                type = 'gmail';
                iconType = 'gmail';
                color = COLORS.gmail;
                label = 'Gmail';
            } else if (memoryType === 'calendar') {
                type = 'calendar';
                iconType = 'calendar';
                color = COLORS.calendar;
                label = 'Calendar';
            } else if (memoryType === 'webex') {
                type = 'webex';
                iconType = 'webex';
                color = COLORS.webex;
                label = 'Webex';
                // Snippet fallback - check Outlook BEFORE Gmail
            } else if (snippet.includes('outlook') || snippet.includes('microsoft')) {
                type = 'outlook';
                iconType = 'outlook';
                color = COLORS.outlook;
                label = 'Outlook';
            } else if (snippet.includes('gmail') || snippet.includes('email') || snippet.includes('subject:')) {
                type = 'gmail';
                iconType = 'gmail';
                color = COLORS.gmail;
                label = 'Gmail';
            } else if (snippet.includes('webex')) {
                type = 'webex';
                iconType = 'webex';
                color = COLORS.webex;
                label = 'Webex';
            } else if (snippet.includes('calendar')) {
                type = 'calendar';
                iconType = 'calendar';
                color = COLORS.calendar;
                label = 'Calendar';
            } else {
                type = 'memory';
                iconType = 'memory';
                color = COLORS.memory;
                label = 'Memory';
            }
        }

        if (!acc[type]) {
            acc[type] = { type, iconType, color, label, count: 0, emailCount: 0, items: [] };
        }
        acc[type].count += 1;
        // Use email_count from source if available (for Gmail)
        if (source.email_count) {
            acc[type].emailCount = source.email_count;
        }
        acc[type].items.push(source);
        return acc;
    }, {});

    const groups = Object.values(grouped);

    return (
        <View style={styles.pillsRow}>
            {groups.map((group, i) => {
                let countText = '';
                if (group.type === 'gmail') {
                    // Use emailCount from metadata if available, otherwise use count
                    const emailNum = group.emailCount || group.count;
                    countText = `${emailNum} ${emailNum === 1 ? 'email' : 'emails'}`;
                } else if (group.type === 'document') {
                    countText = `${group.count} ${group.count === 1 ? 'doc' : 'docs'}`;
                } else if (group.type === 'url') {
                    countText = group.count > 1 ? `${group.count} pages` : '';
                } else if (group.type === 'memory') {
                    countText = group.count > 1 ? `${group.count} items` : '';
                }

                return (
                    <View
                        key={i}
                        style={[styles.pillWithCount, { backgroundColor: group.color + '20', borderColor: group.color }]}
                    >
                        <View style={styles.pillIconContainer}>
                            <Ionicons
                                name={IOS_ICONS[group.iconType] || 'document'}
                                size={14}
                                color={group.color}
                            />
                        </View>
                        <Text style={[styles.pillLabel, { color: group.color }]}>
                            {group.label}
                            {countText ? `: ${countText}` : ''}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

// --- Collapsible Section (for trace) ---
const CollapsibleSection = ({ title, count, emoji, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!count) return null;

    return (
        <View style={styles.section}>
            <TouchableOpacity
                onPress={() => setIsExpanded((s) => !s)}
                style={styles.sectionHeader}
            >
                <Icon
                    name={isExpanded ? 'chevron-down' : 'chevron-right'}
                    size={16}
                    color={COLORS.textDim}
                />
                <Text style={styles.sectionTitle}>
                    {emoji} {isExpanded ? `Hide ${title}` : `${count} ${title}`}
                </Text>
            </TouchableOpacity>
            {isExpanded && <View style={styles.sectionContent}>{children}</View>}
        </View>
    );
};

// --- Trace List (thinking steps) ---
export const TraceList = ({ steps }) => {
    if (!steps || steps.length === 0) return null;

    return (
        <View style={styles.traceList}>
            {steps.map((step) => (
                <View key={step.id} style={styles.traceRow}>
                    <View style={styles.traceDot} />
                    <Text style={styles.traceText} numberOfLines={2}>
                        {step.message}
                    </Text>
                    {step.duration_ms != null && (
                        <Text style={styles.traceDuration}>{step.duration_ms}ms</Text>
                    )}
                </View>
            ))}
        </View>
    );
};

// --- Main Footer with Sources and Trace ---
export const SourcesAndTraceFooter = ({ sources = [], trace = [] }) => {
    const hasContent = (sources && sources.length > 0) || (trace && trace.length > 0);
    if (!hasContent) return null;

    return (
        <View style={styles.footer}>
            {/* Show source pills inline - no collapsible, clean display */}
            {sources.length > 0 && (
                <SourcePillsRow sources={sources} />
            )}

            {/* Thinking trace is still collapsible */}
            <CollapsibleSection title="Thinking" count={trace.length} emoji="💭">
                <TraceList steps={trace} />
            </CollapsibleSection>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- Pills (compact, minimal spacing) ---
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 6,
        marginBottom: 2,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderWidth: 1,
        borderRadius: 10,
    },
    pillText: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: '500',
    },
    pillCached: {
        marginLeft: 3,
        fontSize: 9,
    },

    // --- Cards (matching vision mockup .source-card) ---
    card: {
        backgroundColor: COLORS.bgHover,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    cardIconBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cardIcon: {
        fontSize: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 13,
    },
    cardSubtitle: {
        color: COLORS.textDim,
        fontSize: 11,
        marginTop: 2,
    },
    cardSnippet: {
        color: COLORS.textDim,
        fontStyle: 'italic',
        marginTop: 4,
        fontSize: 12,
        lineHeight: 16,
    },
    cardScore: {
        color: '#60a5fa',
        fontSize: 11,
        fontWeight: '600',
    },

    // --- Sections ---
    section: {
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    sectionTitle: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    sectionContent: {
        marginTop: 6,
    },

    // --- Trace ---
    traceList: {
        paddingLeft: 4,
    },
    traceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    traceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textDim,
        marginRight: 10,
    },
    traceText: {
        color: COLORS.textDim,
        flex: 1,
        fontSize: 12,
    },
    traceDuration: {
        color: COLORS.textDim,
        fontSize: 10,
        marginLeft: 8,
    },

    // --- Footer (no separator line) ---
    footer: {
        paddingTop: 4,
        marginTop: 4,
    },

    // --- Activity Header (e.g., "Searched Gmail • Read Q4 Reports") ---
    activityHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 6,
    },

    activityText: {
        fontSize: 11,
        color: COLORS.textDim,
    },

    // --- Pill with count (e.g., "📧 Gmail: 12 emails") ---
    pillWithCount: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },

    pillIconContainer: {
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    pillLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});