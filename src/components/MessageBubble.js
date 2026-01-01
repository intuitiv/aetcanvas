// components/MessageBubble.js
// ChatGPT-style compact message bubbles

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import RenderHtml from 'react-native-render-html';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Feather';
import { SourcesAndTraceFooter } from './Sources';

// ChatGPT-inspired color palette
const COLORS = {
    bgDark: '#212121',
    bgMessage: '#2f2f2f',
    bgUser: '#2f2f2f',
    text: '#ececf1',
    textDim: '#b4b4b4',
    accent: '#10a37f',
    accentLight: '#1a7f64',
    border: '#444',
    code: '#1e1e1e',
    // Source colors (muted)
    gmail: '#f87171',
    url: '#60a5fa',
    document: '#4ade80',
    memory: '#a78bfa',
    webex: '#22d3ee',
    calendar: '#818cf8',
};

// Check if text contains actual HTML tags
const containsHtml = (text) => {
    if (!text) return false;
    const htmlTagPattern = /<(div|p|br|span|strong|em|b|i|ul|ol|li|table|tr|td|th|a|img|h[1-6]|pre|code|blockquote)[^>]*>/i;
    return htmlTagPattern.test(text);
};

// HTML styles
const htmlTagsStyles = {
    body: { color: COLORS.text, fontSize: 15, lineHeight: 24 },
    p: { color: COLORS.text, fontSize: 15, lineHeight: 24, marginTop: 0, marginBottom: 8 },
    h1: { color: COLORS.text, fontSize: 22, fontWeight: '600', marginTop: 12, marginBottom: 6 },
    h2: { color: COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 4 },
    h3: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    a: { color: COLORS.accent, textDecorationLine: 'underline' },
    strong: { fontWeight: '600', color: COLORS.text },
    em: { fontStyle: 'italic' },
    code: {
        backgroundColor: COLORS.code,
        color: '#e5e5e5',
        fontFamily: 'monospace',
        fontSize: 13,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    pre: {
        backgroundColor: COLORS.code,
        borderRadius: 6,
        padding: 12,
        marginVertical: 6,
    },
    blockquote: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent,
        paddingLeft: 10,
        paddingVertical: 4,
        marginVertical: 6,
    },
    ul: { marginVertical: 4 },
    ol: { marginVertical: 4 },
    li: { color: COLORS.text, fontSize: 15, lineHeight: 24, marginVertical: 2 },
};

// Markdown styling
const markdownStyles = StyleSheet.create({
    body: { color: COLORS.text, fontSize: 15, lineHeight: 24 },
    heading1: { color: COLORS.text, fontSize: 22, fontWeight: '600', marginTop: 12, marginBottom: 6 },
    heading2: { color: COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 4 },
    heading3: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    strong: { fontWeight: '600', color: COLORS.text },
    em: { fontStyle: 'italic' },
    link: { color: COLORS.accent, textDecorationLine: 'underline' },
    blockquote: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent,
        paddingLeft: 10,
        paddingVertical: 4,
        marginVertical: 6,
    },
    code_inline: {
        backgroundColor: COLORS.code,
        color: '#e5e5e5',
        fontFamily: 'monospace',
        fontSize: 13,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    code_block: {
        backgroundColor: COLORS.code,
        borderRadius: 6,
        padding: 12,
        marginVertical: 6,
    },
    fence: {
        backgroundColor: COLORS.code,
        borderRadius: 6,
        padding: 12,
        marginVertical: 6,
        fontFamily: 'monospace',
        fontSize: 13,
        color: COLORS.text,
    },
    list_item: { marginVertical: 2 },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    bullet_list_icon: { color: COLORS.textDim, fontSize: 6, marginRight: 8 },
    ordered_list_icon: { color: COLORS.textDim, fontWeight: '500', marginRight: 8 },
});

// Content renderers
const HtmlContent = ({ text, width }) => (
    <RenderHtml
        contentWidth={width - 48}
        source={{ html: text }}
        tagsStyles={htmlTagsStyles}
        baseStyle={{ color: COLORS.text }}
    />
);

const MarkdownContent = ({ text }) => (
    <Markdown style={markdownStyles}>{text}</Markdown>
);

const RenderTextContent = ({ text, isUser, width }) => {
    if (isUser) {
        return <Text style={styles.userText}>{text}</Text>;
    }
    const isHtml = containsHtml(text);
    return isHtml ? <HtmlContent text={text} width={width} /> : <MarkdownContent text={text} />;
};

// Source activity header
const MessageHeader = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    const activities = [];
    const seenTypes = new Set();

    sources.forEach(source => {
        if (source.source_type === 'memory_item') {
            const snippet = (source.snippet || '').toLowerCase();
            if ((snippet.includes('gmail') || snippet.includes('email')) && !seenTypes.has('gmail')) {
                activities.push({ icon: '📧', text: 'Gmail', color: COLORS.gmail });
                seenTypes.add('gmail');
            } else if (!seenTypes.has('memory')) {
                activities.push({ icon: '🧠', text: 'Memory', color: COLORS.memory });
                seenTypes.add('memory');
            }
        } else if (source.source_type === 'url_content' && !seenTypes.has('url')) {
            activities.push({ icon: '🔗', text: 'Web', color: COLORS.url });
            seenTypes.add('url');
        } else if (source.source_type === 'document_chunk' && !seenTypes.has('doc')) {
            activities.push({ icon: '📄', text: 'Docs', color: COLORS.document });
            seenTypes.add('doc');
        }
    });

    if (activities.length === 0) return null;

    return (
        <View style={styles.messageHeader}>
            {activities.map((activity, i) => (
                <View key={i} style={[styles.sourcePill, { backgroundColor: activity.color + '20' }]}>
                    <Text style={styles.sourcePillText}>{activity.icon} {activity.text}</Text>
                </View>
            ))}
        </View>
    );
};

export const MessageBubble = ({ item }) => {
    const { width } = useWindowDimensions();
    const primaryImageSource = item.sources?.find((s) => s.mime_type?.startsWith('image/'));
    const allSources = item.sources || [];
    const hasTextContent = !!item.text;
    const hasFooterContent = allSources.length > 0 || (item.trace && item.trace.length > 0);
    const isUser = item.sender === 'user';

    return (
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
            {isUser ? (
                // User message - right aligned bubble with left-aligned text
                <View style={[styles.userBubble, { maxWidth: Math.min(480, width - 64) }]}>
                    <RenderTextContent text={item.text} isUser={isUser} width={width} />
                </View>
            ) : (
                // Bot message - full width, no bubble
                <View style={[styles.botContainer, { maxWidth: Math.min(768, width - 32) }]}>
                    {/* Source header */}
                    {allSources.length > 0 && <MessageHeader sources={allSources} />}

                    {/* Image */}
                    {primaryImageSource && (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: primaryImageSource.preview_url }} style={styles.responseImage} />
                        </View>
                    )}

                    {/* Text content */}
                    {hasTextContent && (
                        <View style={styles.textContent}>
                            <RenderTextContent text={item.text} isUser={isUser} width={width} />
                        </View>
                    )}

                    {/* Attachment */}
                    {item.attachmentName && (
                        <View style={styles.attachmentRow}>
                            <Icon name="paperclip" size={14} color={COLORS.textDim} />
                            <Text style={styles.attachmentText}>{item.attachmentName}</Text>
                        </View>
                    )}

                    {/* Footer with sources */}
                    {hasFooterContent && (
                        <View style={styles.footer}>
                            <SourcesAndTraceFooter sources={allSources} trace={item.trace || []} />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageRow: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    messageRowUser: {
        alignItems: 'flex-end',
    },

    userBubble: {
        backgroundColor: '#2f2f2f',
        borderRadius: 16,
        borderBottomRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    botContainer: {
        width: '100%',
    },

    messageHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },

    sourcePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },

    sourcePillText: {
        fontSize: 11,
        color: COLORS.text,
        fontWeight: '500',
    },

    imageContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },

    responseImage: {
        width: '100%',
        aspectRatio: 16 / 9,
        resizeMode: 'cover',
    },

    textContent: {
        // No extra padding - content flows naturally
    },

    userText: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 24,
    },

    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
    },

    attachmentText: {
        color: COLORS.textDim,
        fontSize: 12,
        flex: 1,
    },

    footer: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
});

export default MessageBubble;