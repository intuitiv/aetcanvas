// File: chaetra-universal/hooks/useChatController.ts

import { useState, useEffect, useRef } from 'react';
import { Platform, TextInput, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useCognitiveTraceSocket, TraceStep } from './useCognitiveTraceSocket';
import { apiClient, MOCK_USER_ID } from '../services/api';
import { Message } from '../types';

export const useChatController = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachment, setAttachment] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput | null>(null);
    const [lastUploadId, setLastUploadId] = useState<string | null>(null);
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const isSubmitting = useRef(false);

    const { traceSteps, connect, disconnect } = useCognitiveTraceSocket();

    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
            if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) inputRef.current?.focus();
        };
        if (Platform.OS === 'web') {
            document.body.addEventListener('keydown', handleGlobalKeyDown);
            return () => document.body.removeEventListener('keydown', handleGlobalKeyDown);
        }
    }, []);

    const handleNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setLastUploadId(null);
        setMessageHistory([]);
        setHistoryIndex(-1);
        inputRef.current?.focus();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (messageHistory.length > 0) {
                const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
                setInputText(messageHistory[newIndex]);
                setHistoryIndex(newIndex);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setInputText(messageHistory[newIndex]);
                setHistoryIndex(newIndex);
            } else if (historyIndex === 0) {
                setInputText('');
                setHistoryIndex(-1);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handlePickAttachment = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            if (result.canceled === false && result.assets && result.assets[0]) {
                setAttachment(result.assets[0]);
            }
        } catch (error) { console.error("Error picking document:", error); }
    };

    const handleSendMessage = async () => {
        if (isSubmitting.current) return;
        const messageText = inputText.trim();
        const attachmentToSend = attachment;
        if (!messageText && !attachmentToSend) return;

        connect();

        const userMessage: Message = { id: `user-${Date.now()}`, text: messageText, sender: 'user', attachmentName: attachmentToSend?.name };
        setMessages((prev) => [...prev, userMessage]);

        setInputText('');
        setAttachment(null);
        if (messageText) {
            setMessageHistory(prev => [messageText, ...prev.filter(m => m !== messageText).slice(0, 49)]);
        }
        setHistoryIndex(-1);

        setIsLoading(true);
        isSubmitting.current = true;
        let finalTrace: TraceStep[] = [];

        try {
            let chaetraResponse;
            if (attachmentToSend) {
                const formData = new FormData();
                if (Platform.OS === 'web' && attachmentToSend.file) {
                    formData.append('file', attachmentToSend.file);
                } else {
                    formData.append('file', { uri: attachmentToSend.uri, name: attachmentToSend.name, type: attachmentToSend.mimeType } as any);
                }
                formData.append('document_title', attachmentToSend.name);
                formData.append('message', messageText);
                const response = await apiClient.post('/knowledge/upload', formData, { headers: { 'Content-Type': 'multipart/form-data', 'X-User-Id': MOCK_USER_ID, }, });
                chaetraResponse = response.data;
            } else {
                const payload: any = {
                    user_id: MOCK_USER_ID,
                    message_text: messageText,
                    conversation_id: conversationId,
                    metadata: {}
                };
                if (lastUploadId) {
                    payload.metadata.linked_document_id = lastUploadId;
                    setLastUploadId(null);
                }
                const response = await apiClient.post('/conversation', payload);
                chaetraResponse = response.data;
            }

            finalTrace = traceSteps;

            const finalChaetraMessage: Message = {
                id: chaetraResponse.chaetra_message_id || `chaetra-${Date.now()}`,
                text: chaetraResponse.reply_text,
                sender: 'chaetra',
                sources: chaetraResponse.sources,
                trace: finalTrace
            };
            setMessages((prev) => [...prev, finalChaetraMessage]);

            if (chaetraResponse.conversation_id && !conversationId) {
                setConversationId(chaetraResponse.conversation_id);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            finalTrace = traceSteps;
            const errorMessage: Message = { id: `error-${Date.now()}`, text: 'Sorry, an error occurred. Please check the connection and API payload.', sender: 'chaetra', trace: finalTrace };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            isSubmitting.current = false;
            disconnect();
        }
    };

    return {
        messages, isLoading, inputText, setInputText, attachment, setAttachment,
        traceSteps, flatListRef, inputRef, handleNewChat, handleInputKeyDown,
        handlePickAttachment, handleSendMessage,
    };
};