// components/MessageBubble.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SourcesAndTraceFooter } from './Sources';

/**
 * Props:
 *  - item: Message { id, sender, text, sources[], attachmentName, trace[] }
 *
 * This file preserves the original rendering logic and console logs that you had
 * so you can still inspect the shapes at runtime.
 */

export const MessageBubble = ({ item }) => {
    console.log(`\n--- [MessageBubble] Rendering ID: ${item.id} ---`);
    console.log('[MessageBubble] Full item:', JSON.stringify(item, null, 2));

    const primaryImageSource = item.sources?.find((s) => s.mime_type?.startsWith('image/'));
    const otherSources = item.sources?.filter((s) => s.source_id !== primaryImageSource?.source_id) || [];
    const hasTextContent = !!item.text;
    const hasFooterContent = otherSources.length > 0 || (item.trace && item.trace.length > 0);

    return (
        <View style={[styles.row, { alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
            <View style={styles.inner}>
                {primaryImageSource && (
                    <View style={styles.responseImageContainer}>
                        <Image source={{ uri: primaryImageSource.preview_url }} style={styles.responseImage} />
                    </View>
                )}

                <View
                    style={[
                        styles.bubble,
                        item.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                        primaryImageSource ? { marginTop: 8 } : null,
                        item.sender === 'user' ? { borderBottomRightRadius: 0 } : null,
                        item.sender === 'chaetra' ? { borderBottomLeftRadius: 0 } : null,
                    ]}
                >
                    {hasTextContent && <View style={{ padding: 10 }}><Text style={styles.paragraph}>{item.text}</Text></View>}

                    {item.attachmentName && (
                        <View style={styles.attachmentRow}>
                            <Icon name="paperclip" size={16} color="#e5e7eb" />
                            <Text style={styles.attachmentText} numberOfLines={1}>{item.attachmentName}</Text>
                        </View>
                    )}

                    {item.sender === 'chaetra' && hasFooterContent && (
                        <View style={{ padding: 12, paddingTop: hasTextContent ? 6 : 12 }}>
                            <SourcesAndTraceFooter sources={otherSources} trace={item.trace || []} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: { width: '100%', paddingHorizontal: 10 },
    inner: { maxWidth: '85%' },
    responseImageContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    responseImage: { width: '100%', aspectRatio: 16 / 9, resizeMode: 'contain' },
    bubble: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    bubbleUser: { backgroundColor: '#0ea5e9', alignSelf: 'flex-end' },
    bubbleBot: { backgroundColor: '#1f2937', alignSelf: 'flex-start' },
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
