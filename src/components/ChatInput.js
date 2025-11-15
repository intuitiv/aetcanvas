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
                    {isLoading ? <ActivityIndicator /> : <Icon name="send" size={18} color={canSend ? '#fff' : '#9ca3af'} />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
    attachmentBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0b1220',
        padding: 8,
        marginBottom: 8,
        borderRadius: 8,
    },
    attachmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    attachmentName: { color: '#e5e7eb', marginLeft: 8, fontSize: 12, flex: 1 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    inputRowDisabled: { opacity: 0.7 },
    iconBtn: { padding: 6 },
    textInput: { flex: 1, paddingHorizontal: 8, color: '#fff', minHeight: 36 },
    sendBtn: { padding: 8, borderRadius: 999 },
    sendBtnEnabled: { backgroundColor: '#0ea5e9' },
    sendBtnDisabled: { backgroundColor: '#374151' },
});
