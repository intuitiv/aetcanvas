// components/MessageBubble.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SourcesAndTraceFooter } from './Sources';

/**
 * Props:
 *  - item: Message { id, sender, text, sources[], attachmentName, trace[] }
 */

// --- Style Helper ---
const getBubbleStyles = (item, primaryImageSource) => {
    const isUser = item.sender === 'user';
    const bubbleStyle = [bubbleStyles.bubble];

    if (isUser) {
        bubbleStyle.push(bubbleStyles.bubbleUser);
        bubbleStyle.push({ borderBottomRightRadius: 0 });
    } else {
        bubbleStyle.push(bubbleStyles.bubbleBot);
        bubbleStyle.push({ borderBottomLeftRadius: 0 });
    }

    if (primaryImageSource) {
        bubbleStyle.push({ marginTop: 8 });
    }

    return bubbleStyle;
};

// --- Content Renderers ---
const renderTextContent = (text) => (
    <View style={{ padding: 10 }}>
        <Text style={bubbleStyles.paragraph}>{text}</Text>
    </View>
);

const renderAttachment = (attachmentName) => (
    <View style={bubbleStyles.attachmentRow}>
        <Icon name="paperclip" size={16} color="#e5e7eb" />
        <Text style={bubbleStyles.attachmentText} numberOfLines={1}>{attachmentName}</Text>
    </View>
);

const renderFooter = (sources, trace) => (
    <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 }}>
        <SourcesAndTraceFooter sources={sources} trace={trace} />
    </View>
);


export const MessageBubble = ({ item }) => {
    const primaryImageSource = item.sources?.find((s) => s.mime_type?.startsWith('image/'));
    const otherSources = item.sources?.filter((s) => s.source_id !== primaryImageSource?.source_id) || [];
    const hasTextContent = !!item.text;
    const hasFooterContent = otherSources.length > 0 || (item.trace && item.trace.length > 0);

    return (
        <View style={[bubbleStyles.row, { alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
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
                    {hasTextContent && renderTextContent(item.text)}
                    {item.attachmentName && renderAttachment(item.attachmentName)}
                    {item.sender === 'chaetra' && hasFooterContent && renderFooter(otherSources, item.trace || [])}
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
        borderRadius: 14,
        overflow: 'hidden',
    },
    // --- THE FIX: Removed 'alignSelf' from both styles ---
    bubbleUser: {
        backgroundColor: '#0ea5e9',
    },
    bubbleBot: {
        backgroundColor: '#1f2937',
    },
    paragraph: { color: '#e6eef8', lineHeight: 22 },
    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0b1220',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    attachmentText: { color: '#e5e7eb', fontSize: 12, marginLeft: 8, flex: 1 },
});