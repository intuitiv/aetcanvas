// components/ChatInput.js
// ChatGPT-style floating input with glassmorphism

import React from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Premium color palette
const COLORS = {
    inputBg: 'rgba(32, 33, 35, 0.95)',
    inputBorder: 'rgba(86, 88, 105, 0.4)',
    text: '#ececf1',
    placeholder: '#8e8ea0',
    accent: '#10a37f',       // ChatGPT green
    accentHover: '#1a7f64',
    sendBg: '#ececf1',
    sendIcon: '#000',
    sendDisabled: 'rgba(142, 142, 160, 0.3)',
};

export const ChatInput = ({
    inputText,
    setInputText,
    attachment,
    setAttachment,
    isLoading,
    onSendMessage,
    onPickAttachment,
    onKeyDown,
    inputRef,
}) => {
    const canSend = (inputText?.trim() || attachment) && !isLoading;

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {/* Attachment preview */}
                {attachment && (
                    <View style={styles.attachmentBar}>
                        <View style={styles.attachmentContent}>
                            <Icon name="file" size={14} color={COLORS.text} />
                            <Text style={styles.attachmentName} numberOfLines={1}>
                                {attachment.name}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setAttachment(null)}
                            style={styles.attachmentRemove}
                        >
                            <Icon name="x" size={14} color={COLORS.placeholder} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Main input row */}
                <View style={styles.inputRow}>
                    {/* Attachment button */}
                    <TouchableOpacity 
                        onPress={onPickAttachment} 
                        disabled={isLoading} 
                        style={styles.attachBtn}
                    >
                        <Icon name="paperclip" size={18} color={COLORS.placeholder} />
                    </TouchableOpacity>

                    {/* Text input */}
                    <TextInput
                        ref={inputRef}
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Message Chaetra..."
                        placeholderTextColor={COLORS.placeholder}
                        onKeyPress={(e) => {
                            if (Platform.OS === 'web' && onKeyDown) {
                                onKeyDown(e.nativeEvent);
                            }
                        }}
                        onSubmitEditing={() => onSendMessage && onSendMessage()}
                        editable={!isLoading}
                        multiline
                    />

                    {/* Send button */}
                    <TouchableOpacity
                        onPress={onSendMessage}
                        disabled={!canSend}
                        style={[
                            styles.sendBtn,
                            canSend ? styles.sendBtnEnabled : styles.sendBtnDisabled,
                        ]}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={COLORS.placeholder} />
                        ) : (
                            <Icon 
                                name="arrow-up" 
                                size={16} 
                                color={canSend ? COLORS.sendIcon : COLORS.placeholder} 
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer hint */}
            <Text style={styles.footerHint}>
                Chaetra can make mistakes. Check important info.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        paddingTop: 8,
        alignItems: 'center',
    },

    container: {
        width: '100%',
        maxWidth: 768,
        backgroundColor: COLORS.inputBg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
            },
        }),
    },

    attachmentBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.inputBorder,
        backgroundColor: 'rgba(64, 65, 79, 0.5)',
    },

    attachmentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },

    attachmentName: {
        color: COLORS.text,
        fontSize: 13,
        flex: 1,
    },

    attachmentRemove: {
        padding: 4,
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },

    attachBtn: {
        padding: 8,
        marginBottom: 2,
    },

    textInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 22,
        maxHeight: 150,
        paddingVertical: 8,
        paddingHorizontal: 4,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },

    sendBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },

    sendBtnEnabled: {
        backgroundColor: COLORS.sendBg,
    },

    sendBtnDisabled: {
        backgroundColor: COLORS.sendDisabled,
    },

    footerHint: {
        marginTop: 8,
        fontSize: 11,
        color: COLORS.placeholder,
        textAlign: 'center',
    },
});

export default ChatInput;
