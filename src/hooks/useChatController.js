// src/hooks/useChatController.js

import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { sendMessageToAPI } from "../services/api";
import useCognitiveTraceSocket from "./useCognitiveTraceSocket";

export default function useChatController() {
    const [messages, setMessages] = useState([]);
    const [traceSteps, setTraceSteps] = useState([]);
    const [inputText, setInputText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // --- Cognitive Trace streaming ---
    useCognitiveTraceSocket((step) => {
        setTraceSteps((prev) => [...prev, step]);
    });

    const handlePickAttachment = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.7,
            });

            if (!result.cancelled) {
                setAttachment(result.assets?.[0] || null);
            }
        } catch (e) {
            console.log("Attachment error", e);
        }
    };

    const handleSendMessage = async () => {
        const trimmed = inputText.trim();
        if (trimmed.length === 0 && !attachment) return;

        const newMsg = {
            id: Date.now().toString(),
            sender: "user",
            text: trimmed,
            attachment,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        setAttachment(null);
        setIsLoading(true);
        setTraceSteps([]);

        try {
            const response = await sendMessageToAPI({
                text: trimmed,
                attachment,
            });

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                sender: "assistant",
                text: response?.text || "No response",
                attachment: response?.attachment,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            console.log("SendMessage error", err);

            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 2).toString(),
                    sender: "assistant",
                    text: "⚠️ Something went wrong.",
                },
            ]);
        }

        setIsLoading(false);

        // scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleInputKeyDown = (e) => {
        if (e.nativeEvent.key === "Enter" && !e.shiftKey) {
            e.preventDefault?.();
            handleSendMessage();
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setTraceSteps([]);
        setInputText("");
        setAttachment(null);

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
    };

    return {
        messages,
        setMessages,
        traceSteps,
        inputText,
        setInputText,
        attachment,
        setAttachment,
        isLoading,

        flatListRef,
        inputRef,

        handleSendMessage,
        handlePickAttachment,
        handleNewChat,
        handleInputKeyDown,
    };
}
