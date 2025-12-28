// components/ChatInput.js
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
import * as DocumentPicker from 'expo-document-picker';

/**
 * Keep same props:
 *  - inputText, setInputText, attachment, setAttachment, isLoading,
 *  - onSendMessage, onPickAttachment, onKeyDown, inputRef
 */

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
        <View style={styles.container}>
            {attachment && (
                <View style={styles.attachmentBar}>
                    <View style={styles.attachmentLeft}>
                        <Icon name="paperclip" size={16} color="#e5e7eb" />
                        <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAttachment(null)}>
                        <Icon name="x" size={18} color="#e5e7eb" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.inputRow, isLoading ? styles.inputRowDisabled : null]}>
                <TouchableOpacity onPress={onPickAttachment} disabled={isLoading} style={styles.iconBtn}>
                    <Icon name="paperclip" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="What can I take off your plate?"
                    placeholderTextColor="#9ca3af"
                    onKeyPress={(e) => {
                        if (Platform.OS === 'web' && onKeyDown) {
                            // web-specific typing event emulation preserved
                            onKeyDown(e.nativeEvent);
                        }
                    }}
                    onSubmitEditing={() => onSendMessage && onSendMessage()}
                    editable={!isLoading}
                />

                <TouchableOpacity
                    onPress={onSendMessage}
                    disabled={!canSend}
                    style={[styles.sendBtn, canSend ? styles.sendBtnEnabled : styles.sendBtnDisabled]}
                >
                    {isLoading ? <ActivityIndicator /> :
                        <Icon name="send" size={18} color={canSend ? '#fff' : '#9ca3af'} />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Matching vision mockup .input-area
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
        backgroundColor: '#1a1a2e',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    attachmentBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#252540',
        padding: 10,
        marginBottom: 8,
        borderRadius: 8,
    },
    attachmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    attachmentName: { color: '#e2e8f0', marginLeft: 8, fontSize: 12, flex: 1 },
    // Input container matching vision .input-container
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#0f0f1a',
    },
    inputRowDisabled: { opacity: 0.7 },
    iconBtn: { padding: 6 },
    textInput: { flex: 1, paddingHorizontal: 8, color: '#e2e8f0', minHeight: 36, outlineStyle: "none", fontSize: 15 },
    sendBtn: { padding: 10, borderRadius: 8 },
    sendBtnEnabled: { backgroundColor: '#6366f1' },  // Accent purple
    sendBtnDisabled: { backgroundColor: '#252540' },
});

