// App.js

import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    FlatList,
    SafeAreaView,
    StyleSheet,
    ActivityIndicator,
    View,
    Text,
    TouchableOpacity,
} from "react-native";

import useChatController from "./src/hooks/useChatController";
import {ChatInput} from "./src/components/ChatInput";
import {MessageBubble} from "./src/components/MessageBubble";
import {TraceList} from "./src/components/Sources";

// simple replacement for PlusSquare icon
const PlusButton = ({ onPress }) => (
    <TouchableOpacity style={styles.plusButton} onPress={onPress}>
        <Text style={styles.plusButtonText}>＋</Text>
    </TouchableOpacity>
);

const ThinkingBubble = () => (
    <View style={styles.thinkingContainer}>
        <View style={styles.thinkingBubble}>
            <ActivityIndicator size="small" color="#9ca3af" />
        </View>
    </View>
);

export default function App() {
    const {
        messages,
        isLoading,
        inputText,
        setInputText,
        attachment,
        setAttachment,
        traceSteps,
        flatListRef,
        inputRef,
        handleNewChat,
        handleInputKeyDown,
        handlePickAttachment,
        handleSendMessage,
    } = useChatController();

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                <View style={styles.innerWrapper}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ width: 48 }} />
                        <Text style={styles.title}>Chaetra</Text>

                        <PlusButton onPress={handleNewChat} />
                    </View>

                    {/* Chat messages */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={({ item }) => <MessageBubble item={item} />}
                        keyExtractor={(item) => item.id}
                        style={styles.flex}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        ListFooterComponent={
                            isLoading && traceSteps.length === 0 ? (
                                <ThinkingBubble />
                            ) : null
                        }
                    />

                    {/* Cognitive trace steps */}
                    {isLoading && traceSteps.length > 0 && (
                        <View style={styles.traceWrapper}>
                            <TraceList steps={traceSteps} />
                        </View>
                    )}

                    {/* Input box */}
                    <ChatInput
                        inputText={inputText}
                        setInputText={setInputText}
                        attachment={attachment}
                        setAttachment={setAttachment}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        onPickAttachment={handlePickAttachment}
                        onKeyDown={handleInputKeyDown}
                        inputRef={inputRef}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },
    flex: { flex: 1 },

    innerWrapper: {
        flex: 1,
        width: "100%",
        maxWidth: 900,
        alignSelf: "center",
    },

    header: {
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
    },

    plusButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#333",
        justifyContent: "center",
        alignItems: "center",
    },

    plusButtonText: {
        fontSize: 24,
        color: "white",
    },

    listContent: { paddingBottom: 10, paddingTop: 10 },

    separator: {
        height: 12,
    },

    thinkingContainer: {
        marginVertical: 8,
        paddingHorizontal: 16,
        width: "100%",
        alignItems: "flex-start",
    },

    thinkingBubble: {
        maxWidth: "85%",
        padding: 10,
        backgroundColor: "#374151",
        borderRadius: 12,
        borderBottomLeftRadius: 0,
    },

    traceWrapper: {
        padding: 12,
        backgroundColor: "#222",
        borderTopWidth: 1,
        borderColor: "#444",
    },
});
