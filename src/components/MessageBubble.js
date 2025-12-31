// components/MessageBubble.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Feather';
import { SourcesAndTraceFooter } from './Sources';

/**
 * Props:
 *  - item: Message { id, sender, text, sources[], attachmentName, trace[], isNew }
 */

// Typewriter effect for streaming feel
const TypewriterText = ({ text, onComplete, speed = 15 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!text) return;

        // Reset on new text
        indexRef.current = 0;
        setDisplayedText('');
        setIsComplete(false);

        const timer = setInterval(() => {
            if (indexRef.current < text.length) {
                // Add 1-3 characters at a time for faster appearance
                const charsToAdd = Math.min(3, text.length - indexRef.current);
                setDisplayedText(text.slice(0, indexRef.current + charsToAdd));
                indexRef.current += charsToAdd;
            } else {
                clearInterval(timer);
                setIsComplete(true);
                onComplete?.();
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, onComplete]);

    return displayedText;
};

// Pastel color palette (soft, light tones)
const COLORS = {
    accent: '#7c7fdb',      // Pastel indigo
    accentLight: '#a5a8ed',
    bgCard: '#1a1a2e',
    bgHover: '#252540',
    bgCode: '#0f0f1a',
    text: '#e2e8f0',
    textDim: '#94a3b8',
    border: '#334155',
    // Pastel source colors
    gmail: '#e8a5a0',       // Pastel coral
    url: '#a5c4e8',         // Pastel blue
    document: '#a5e8c0',    // Pastel mint
    memory: '#c4a5e8',      // Pastel lavender
    webex: '#a5dde8',       // Pastel cyan
    calendar: '#a5b8e8',    // Pastel periwinkle
};

// Check if text contains actual HTML tags (not email addresses)
const containsHtml = (text) => {
    if (!text) return false;
    // Match only actual HTML tags like <div>, <p>, <br>, <span>, etc.
    const htmlTagPattern = /<(div|p|br|span|strong|em|b|i|ul|ol|li|table|tr|td|th|a|img|h[1-6]|pre|code|blockquote)[^>]*>/i;
    return htmlTagPattern.test(text);
};

// HTML styles for react-native-render-html
const htmlTagsStyles = {
    body: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 24,
    },
    p: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 24,
        marginTop: 0,
        marginBottom: 12,
    },
    h1: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    h2: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '600',
        marginTop: 14,
        marginBottom: 6,
    },
    h3: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    a: {
        color: COLORS.accentLight,
        textDecorationLine: 'underline',
    },
    strong: {
        fontWeight: '700',
        color: COLORS.text,
    },
    em: {
        fontStyle: 'italic',
    },
    code: {
        backgroundColor: COLORS.bgCode,
        color: COLORS.accentLight,
        fontFamily: 'monospace',
        fontSize: 13,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pre: {
        backgroundColor: COLORS.bgCode,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    blockquote: {
        backgroundColor: COLORS.bgHover,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        paddingLeft: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
    },
    ul: {
        marginVertical: 8,
    },
    ol: {
        marginVertical: 8,
    },
    li: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 24,
        marginVertical: 4,
    },
    hr: {
        backgroundColor: COLORS.border,
        height: 1,
        marginVertical: 16,
    },
};

// Markdown styling
const markdownStyles = StyleSheet.create({
    body: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 24,
    },
    heading1: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 8,
    },
    heading2: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '600',
        marginTop: 14,
        marginBottom: 6,
    },
    heading3: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 12,
    },
    strong: {
        fontWeight: '700',
        color: COLORS.text,
    },
    em: {
        fontStyle: 'italic',
    },
    link: {
        color: COLORS.accentLight,
        textDecorationLine: 'underline',
    },
    blockquote: {
        backgroundColor: COLORS.bgHover,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
        paddingLeft: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
    },
    code_inline: {
        backgroundColor: COLORS.bgCode,
        color: COLORS.accentLight,
        fontFamily: 'monospace',
        fontSize: 13,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    code_block: {
        backgroundColor: COLORS.bgCode,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fence: {
        backgroundColor: COLORS.bgCode,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontFamily: 'monospace',
        fontSize: 13,
        color: COLORS.text,
    },
    list_item: {
        marginVertical: 4,
    },
    bullet_list: {
        marginVertical: 8,
    },
    ordered_list: {
        marginVertical: 8,
    },
    bullet_list_icon: {
        color: COLORS.accent,
        fontSize: 8,
        marginRight: 8,
    },
    ordered_list_icon: {
        color: COLORS.accent,
        fontWeight: '600',
        marginRight: 8,
    },
});

// --- Style Helper ---
const getBubbleStyles = (item, primaryImageSource) => {
    const isUser = item.sender === 'user';
    const bubbleStyle = [bubbleStyles.bubble];

    if (isUser) {
        bubbleStyle.push(bubbleStyles.bubbleUser);
        bubbleStyle.push({ borderBottomRightRadius: 4 });
    } else {
        bubbleStyle.push(bubbleStyles.bubbleBot);
        bubbleStyle.push({ borderBottomLeftRadius: 4 });
    }

    if (primaryImageSource) {
        bubbleStyle.push({ marginTop: 8 });
    }

    return bubbleStyle;
};

// --- Content Renderers ---
const HtmlContent = ({ text, width }) => (
    <RenderHtml
        contentWidth={width - 48}
        source={{ html: text }}
        tagsStyles={htmlTagsStyles}
        baseStyle={{ color: COLORS.text }}
    />
);

const MarkdownContent = ({ text }) => (
    <Markdown style={markdownStyles}>
        {text}
    </Markdown>
);

const RenderTextContent = ({ text, isUser, width }) => {
    if (isUser) {
        // User messages: plain text, no formatting
        return (
            <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={bubbleStyles.userText}>{text}</Text>
            </View>
        );
    }

    // Bot messages: detect HTML vs Markdown
    const isHtml = containsHtml(text);

    return (
        <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
            {isHtml ? (
                <HtmlContent text={text} width={width} />
            ) : (
                <MarkdownContent text={text} />
            )}
        </View>
    );
};

// Message Header - shows source/process info at top (e.g., "📧 Searched Gmail • 📄 Read Q4 Reports")
const MessageHeader = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    // Build activity descriptions from sources
    const activities = [];
    const seenTypes = new Set();

    sources.forEach(source => {
        if (source.source_type === 'memory_item') {
            const snippet = (source.snippet || '').toLowerCase();
            if ((snippet.includes('gmail') || snippet.includes('email')) && !seenTypes.has('gmail')) {
                activities.push({ icon: '📧', text: 'Searched Gmail', color: COLORS.gmail });
                seenTypes.add('gmail');
            } else if (!seenTypes.has('memory')) {
                activities.push({ icon: '🧠', text: 'Queried memory', color: COLORS.memory });
                seenTypes.add('memory');
            }
        } else if (source.source_type === 'url_content' && !seenTypes.has('url')) {
            const host = source.url ? new URL(source.url).hostname : 'URL';
            activities.push({ icon: '🔗', text: `Fetched URL`, extra: source.from_cache ? '• Cached 48h' : '', color: COLORS.url });
            seenTypes.add('url');
        } else if (source.source_type === 'document_chunk' && !seenTypes.has('doc')) {
            const title = source.document_title || 'document';
            activities.push({ icon: '📄', text: `Read ${title}`, color: COLORS.document });
            seenTypes.add('doc');
        }
    });

    if (activities.length === 0) return null;

    return (
        <View style={bubbleStyles.messageHeader}>
            {activities.map((activity, i) => (
                <Text key={i} style={[bubbleStyles.headerActivity, { color: activity.color }]}>
                    {i > 0 ? ' • ' : ''}{activity.icon} {activity.text} {activity.extra || ''}
                </Text>
            ))}
        </View>
    );
};

// Embedded URL Card (for links in content)
const EmbeddedUrlCard = ({ source }) => {
    if (!source || source.source_type !== 'url_content') return null;

    const hostname = source.url ? new URL(source.url).hostname : '';
    const title = source.page_title || hostname;

    return (
        <View style={bubbleStyles.urlCard}>
            <View style={bubbleStyles.urlCardIcon}>
                <Text style={{ fontSize: 18 }}>🔗</Text>
            </View>
            <View style={bubbleStyles.urlCardContent}>
                <Text style={bubbleStyles.urlCardTitle} numberOfLines={1}>{title}</Text>
                <Text style={bubbleStyles.urlCardDomain}>{hostname}</Text>
            </View>
        </View>
    );
};

const renderAttachment = (attachmentName) => (
    <View style={bubbleStyles.attachmentRow}>
        <Icon name="paperclip" size={16} color={COLORS.text} />
        <Text style={bubbleStyles.attachmentText} numberOfLines={1}>{attachmentName}</Text>
    </View>
);

const renderFooter = (sources, trace) => (
    <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
        <SourcesAndTraceFooter sources={sources} trace={trace} />
    </View>
);


export const MessageBubble = ({ item }) => {
    const { width } = useWindowDimensions();
    const primaryImageSource = item.sources?.find((s) => s.mime_type?.startsWith('image/'));
    const allSources = item.sources || [];
    const hasTextContent = !!item.text;
    const hasFooterContent = allSources.length > 0 || (item.trace && item.trace.length > 0);
    const isUser = item.sender === 'user';

    // Find URL sources for embedded cards
    const urlSources = allSources.filter(s => s.source_type === 'url_content');

    return (
        <View style={[bubbleStyles.row, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
            <View style={[
                bubbleStyles.inner,
                item.sender === 'chaetra' && { width: '100%' }
            ]}>
                {primaryImageSource && (
                    <View style={bubbleStyles.responseImageContainer}>
                        <Image source={{ uri: primaryImageSource.preview_url }} style={bubbleStyles.responseImage} />
                    </View>
                )}

                <View style={getBubbleStyles(item, primaryImageSource)}>
                    {/* Header: Source/Process info (e.g., "📧 Searched Gmail • 🔗 Fetched URL") */}
                    {item.sender === 'chaetra' && allSources.length > 0 && (
                        <MessageHeader sources={allSources} />
                    )}

                    {/* Content */}
                    {hasTextContent && <RenderTextContent text={item.text} isUser={isUser} width={width} />}

                    {/* URL sources are now shown ONLY in compact pill at footer, not as individual cards */}

                    {item.attachmentName && renderAttachment(item.attachmentName)}

                    {/* Footer: Source pills with counts */}
                    {item.sender === 'chaetra' && hasFooterContent && renderFooter(allSources, item.trace || [])}
                </View>
            </View>
        </View>
    );
};

const bubbleStyles = StyleSheet.create({
    row: { width: '100%', paddingHorizontal: 10 },
    inner: { maxWidth: '85%' },
    responseImageContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    responseImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        resizeMode: 'cover',
    },
    bubble: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    // User messages: accent purple (matching vision)
    bubbleUser: {
        backgroundColor: COLORS.accent,
    },
    // Bot messages: card background (matching vision)
    bubbleBot: {
        backgroundColor: COLORS.bgCard,
    },
    userText: {
        color: '#ffffff',
        lineHeight: 22,
        fontSize: 15,
    },
    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgHover,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 12,
        marginBottom: 8,
    },
    attachmentText: { color: COLORS.text, fontSize: 12, marginLeft: 8, flex: 1 },

    // Message Header (source/process info at top)
    messageHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
    },

    headerActivity: {
        fontSize: 11,
        fontWeight: '500',
    },

    // Embedded URL Card
    urlCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgHover,
        borderRadius: 10,
        padding: 12,
        marginHorizontal: 14,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.url,
    },

    urlCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.url + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    urlCardContent: {
        flex: 1,
    },

    urlCardTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },

    urlCardDomain: {
        fontSize: 11,
        color: COLORS.textDim,
        marginTop: 2,
    },
});