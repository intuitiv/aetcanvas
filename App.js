// App.js - Full UI Structure matching vision mockup

// Import global styles for web (removes focus outlines)
import './src/styles/global.css';
import React, { useState, useEffect, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    FlatList,
    SafeAreaView,
    StyleSheet,
    ActivityIndicator,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
} from "react-native";

import { useChatController } from "./src/hooks/useChatController";
import { ChatInput } from "./src/components/ChatInput";
import MessageBubble, { MessageHeader } from "./src/components/MessageBubble";
import { TraceList } from "./src/components/Sources";
import Markdown from 'react-native-markdown-display';
import { LeftSidebar } from "./src/components/LeftSidebar";
import { Header } from "./src/components/Header";
import { RightPanel } from "./src/components/RightPanel";
import { BodyMapModal } from "./src/components/BodyMapModal";
import { ContactsTab } from "./src/components/ContactsTab";
import { ProfileModal } from "./src/components/ProfileModal";
import { MobileBottomNav } from "./src/components/MobileBottomNav";
import { MobileRightPanelSheet } from "./src/components/MobileRightPanelSheet";
import { RoutinesPanel } from "./src/components/RoutinesPanel";
import { RemindersPanel } from "./src/components/RemindersPanel";
import { ApiDocsPanel } from "./src/components/ApiDocsPanel";
import { GymPanel } from "./src/components/GymPanel";
import { API_BASE_URL } from "./src/services/api";

// Hook to detect screen width
const useWindowWidth = () => {
    const [width, setWidth] = useState(Dimensions.get('window').width);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setWidth(window.width);
        });
        return () => subscription?.remove();
    }, []);

    return width;
};

// Markdown imported at top of file

// ChatGPT-inspired color palette for streaming
const STREAM_COLORS = {
    accent: '#10a37f',
    accentDim: '#0d8a6a',
    text: '#ececf1',
    textDim: '#b4b4b4',
    bg: '#2f2f2f',
    bgDark: '#212121',
};

// Progress step data with icons and labels
const PROGRESS_STEPS = [
    { key: 'import_matchers', icon: '🧠', label: 'Loading' },
    { key: 'get_matcher_instance', icon: '🧠', label: 'Initializing' },
    { key: 'pattern_match', icon: '🎯', label: 'Understanding' },
    { key: 'cognitive_routing', icon: '🚦', label: 'Routing' },
    { key: 'file_extraction', icon: '📄', label: 'Reading' },
    { key: 'graph_execution', icon: '💭', label: 'Thinking' },
];

// Markdown styles for streaming (matches MessageBubble)
const streamMarkdownStyles = StyleSheet.create({
    body: { color: STREAM_COLORS.text, fontSize: 15, lineHeight: 24 },
    heading1: { color: STREAM_COLORS.text, fontSize: 22, fontWeight: '600', marginTop: 12, marginBottom: 6 },
    heading2: { color: STREAM_COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 4 },
    heading3: { color: STREAM_COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    strong: { fontWeight: '600', color: STREAM_COLORS.text },
    em: { fontStyle: 'italic' },
    link: { color: STREAM_COLORS.accent, textDecorationLine: 'underline' },
    code_inline: {
        backgroundColor: '#1e1e1e',
        color: '#e5e5e5',
        fontFamily: 'monospace',
        fontSize: 13,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    code_block: { backgroundColor: '#1e1e1e', borderRadius: 6, padding: 12, marginVertical: 6 },
    fence: { backgroundColor: '#1e1e1e', borderRadius: 6, padding: 12, marginVertical: 6, fontFamily: 'monospace', fontSize: 13, color: STREAM_COLORS.text },
    list_item: { marginVertical: 2 },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    bullet_list_icon: { color: STREAM_COLORS.textDim, fontSize: 6, marginRight: 8 },
    ordered_list_icon: { color: STREAM_COLORS.textDim, fontWeight: '500', marginRight: 8 },
});

// Minimal thinking indicator (shown before any events arrive)
const ThinkingBubble = () => (
    <View style={styles.thinkingContainer}>
        <View style={styles.thinkingBubble}>
            <ActivityIndicator size="small" color={STREAM_COLORS.accent} />
            <Text style={styles.thinkingText}>Thinking...</Text>
        </View>
    </View>
);

// Blinking cursor component for typewriter effect
// WhatsApp-style animated typing dots
const TypingDots = () => {
    const [dots, setDots] = React.useState([0.4, 0.4, 0.4]);
    const animationRef = React.useRef(null);
    
    React.useEffect(() => {
        let frame = 0;
        const animate = () => {
            frame++;
            const phase = (frame / 10) % 3;
            setDots([
                phase < 1 ? 1 : 0.4,
                phase >= 1 && phase < 2 ? 1 : 0.4,
                phase >= 2 ? 1 : 0.4,
            ]);
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, []);
    
    return (
        <View style={{ flexDirection: 'row', marginLeft: 4 }}>
            {dots.map((opacity, i) => (
                <Text key={i} style={[styles.typingDot, { opacity }]}>•</Text>
            ))}
        </View>
    );
};

// Legacy blinking cursor (kept for backward compatibility)
const BlinkingCursor = () => {
    const [visible, setVisible] = React.useState(true);
    
    React.useEffect(() => {
        const interval = setInterval(() => setVisible(v => !v), 500);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <Text style={styles.blinkingCursor}>
            {visible ? '▊' : ' '}
        </Text>
    );
};

// Escape angle brackets that aren't part of actual HTML tags for markdown rendering
const escapeHtmlForMarkdown = (text) => {
    if (!text) return '';
    // Replace < that aren't part of HTML tags with &lt;
    return text.replace(/<(?![a-zA-Z\/!])/g, '&lt;');
};

// Progressive Thinking + Streaming Bubble - Simple Flow
// 1. "Understanding request" → 2. Thinking tokens below → 3. "Thought for Xs" (collapsed) → 4. Tool actions → 5. Response




export default function App() {
    const {
        messages,
        isLoading,
        inputText,
        setInputText,
        attachment,
        setAttachment,
        traceSteps,
        performanceSteps,
        toolSteps,
        thinkingContent,
        thinkingDuration,
        isThinking,
        streamingContent,
        isStreaming,
        clearStreaming,
        requestStartTime,
        firstResponseTime,
        flatListRef,
        inputRef,
        handleNewChat,
        addSystemMessage,
        handleInputKeyDown,
        handlePickAttachment,
        handleSendMessage,
    } = useChatController();

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    // Sidebar states
    const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(isDesktop);
    const [rightPanelExpanded, setRightPanelExpanded] = useState(isDesktop);
    const [bodyMapVisible, setBodyMapVisible] = useState(false);
    const [profileVisible, setProfileVisible] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [activeView, setActiveView] = useState('chat'); // 'chat' | 'contacts' | 'routines'
    const [mobileRightPanelVisible, setMobileRightPanelVisible] = useState(false);

    // Calculate any connection status
    const [isConnected, setIsConnected] = useState(false);

    // Handle notification click - fetch full content and inject into NEW chat
    const handleNotificationPress = async (notification) => {
        try {
            // Start a new chat for each notification
            handleNewChat();
            
            // Activate notification via API to get full content
            const response = await fetch(
                `${API_BASE_URL}/notifications/${notification.id}/activate?user_id=sainathm`,
                { method: 'POST' }
            );
            
            if (response.ok) {
                const data = await response.json();
                // Sources already have proper format from backend (source_type, url, page_title, snippet)
                const sources = data.metadata?.sources || [];
                // Inject full content into NEW chat with sources
                addSystemMessage(
                    data.title || notification.title,
                    data.full_content || 'No content available',
                    sources
                );
                // Switch to chat view if not already
                setActiveView('chat');
            } else {
                // Fallback: just show the message
                addSystemMessage(
                    notification.title,
                    notification.message || 'Click to view details',
                    []
                );
            }
        } catch (error) {
            console.log('Failed to activate notification:', error);
            // Fallback
            addSystemMessage(
                notification.title,
                notification.message || 'Click to view details',
                []
            );
        }
    };

    useEffect(() => {
        // Check connection status
        const checkConnection = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/channels/gmail/status`);
                if (response.ok) {
                    const data = await response.json();
                    setIsConnected(data.connected);
                }
            } catch {
                setIsConnected(false);
            }
        };
        checkConnection();

        // Fetch user profile
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/user/profile`);
                if (res.ok) {
                    setUserProfile(await res.json());
                }
            } catch (e) {
                console.log('Profile fetch failed:', e);
            }
        };
        fetchProfile();
    }, []);

    // Extract sources from all messages for the right panel
    const conversationSources = useMemo(() => {
        const sourcesMap = new Map();

        messages.forEach(msg => {
            if (msg.sources) {
                msg.sources.forEach(src => {
                    let type = 'other';
                    let name = 'Source';
                    let detail = '';

                    if (src.source_type === 'url_content') {
                        type = 'url';
                        name = src.page_title || (src.url ? new URL(src.url).hostname : 'URL');
                        detail = src.url ? new URL(src.url).hostname : '';
                    } else if (src.source_type === 'document_chunk') {
                        type = 'file';
                        name = src.document_title || 'Document';
                        detail = src.mime_type || '';
                    } else if (src.source_type === 'memory_item' || src.source_type === 'memory') {
                        // Check memory_type first (from backend), then fallback to snippet detection
                        const memoryType = src.memory_type || '';
                        const snippet = (src.snippet || src.description || '').toLowerCase();

                        // Check memory_type first (most reliable)
                        if (memoryType === 'outlook') {
                            type = 'outlook';
                            name = 'Outlook';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (memoryType === 'gmail') {
                            type = 'gmail';
                            name = 'Gmail';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (memoryType === 'calendar') {
                            type = 'calendar';
                            name = 'Calendar';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (memoryType === 'webex') {
                            type = 'webex';
                            name = 'Webex';
                            detail = src.snippet?.slice(0, 30) + '...';
                            // Fallback to snippet detection - check Outlook BEFORE Gmail
                        } else if (snippet.includes('outlook') || snippet.includes('microsoft')) {
                            type = 'outlook';
                            name = 'Outlook';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (snippet.includes('gmail') || snippet.includes('email')) {
                            type = 'gmail';
                            name = 'Gmail';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (snippet.includes('calendar')) {
                            type = 'calendar';
                            name = 'Calendar';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else if (snippet.includes('webex')) {
                            type = 'webex';
                            name = 'Webex';
                            detail = src.snippet?.slice(0, 30) + '...';
                        } else {
                            type = 'memory';
                            name = 'Memory';
                            detail = src.snippet?.slice(0, 30) + '...';
                        }
                    }

                    // Use name as key to avoid duplicates
                    if (!sourcesMap.has(name)) {
                        sourcesMap.set(name, { type, name, detail });
                    }
                });
            }
        });

        return Array.from(sourcesMap.values());
    }, [messages]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.appLayout}>
                {/* Left Sidebar - Desktop/Tablet inline, Mobile as overlay */}
                {(isDesktop || (isTablet && leftSidebarExpanded)) && (
                    <LeftSidebar
                        visible={true}
                        expanded={isDesktop || leftSidebarExpanded}
                        onNavigate={(id) => setActiveView(id)}
                        onBodyMapPress={() => setBodyMapVisible(true)}
                        onProfilePress={() => setProfileVisible(true)}
                        onNewChat={handleNewChat}
                        onNotificationPress={handleNotificationPress}
                        activeView={activeView}
                        userProfile={userProfile}
                    />
                )}

                {/* Mobile Sidebar Overlay */}
                {isMobile && leftSidebarExpanded && (
                    <View style={styles.mobileOverlay}>
                        <TouchableOpacity
                            style={styles.overlayBackdrop}
                            onPress={() => setLeftSidebarExpanded(false)}
                            activeOpacity={1}
                        />
                        <View style={styles.mobileSidebar}>
                            <LeftSidebar
                                visible={true}
                                expanded={true}
                                onNavigate={(id) => {
                                    setActiveView(id);
                                    setLeftSidebarExpanded(false);
                                }}
                                onBodyMapPress={() => {
                                    setBodyMapVisible(true);
                                    setLeftSidebarExpanded(false);
                                }}
                                onProfilePress={() => {
                                    setProfileVisible(true);
                                    setLeftSidebarExpanded(false);
                                }}
                                onNewChat={() => {
                                    handleNewChat();
                                    setLeftSidebarExpanded(false);
                                }}
                                onNotificationPress={() => {
                                    handleNotificationPress();
                                    setLeftSidebarExpanded(false);
                                }}
                                activeView={activeView}
                                userProfile={userProfile}
                                isMobileOverlay={true}
                                onClose={() => setLeftSidebarExpanded(false)}
                            />
                        </View>
                    </View>
                )}

                {/* Main Content Area */}
                <View style={styles.mainArea}>
                    {/* Mobile Header with hamburger */}
                    {isMobile && (
                        <Header
                            onMenuPress={() => setLeftSidebarExpanded(true)}
                            onNewChat={handleNewChat}
                            onProfilePress={() => setProfileVisible(true)}
                            activeView={activeView}
                            userProfile={userProfile}
                            showMenuButton={true}
                        />
                    )}

                    {/* Main Content - Chat, Contacts, Reminders, Routines, or Docs */}
                    {activeView === 'contacts' ? (
                        <ContactsTab visible={activeView === 'contacts'} />
                    ) : activeView === 'routines' ? (
                        <RoutinesPanel />
                    ) : activeView === 'reminders' ? (
                        <RemindersPanel />
                    ) : activeView === 'gym' ? (
                        <GymPanel />
                    ) : activeView === 'api_map' ? (
                        <ApiDocsPanel docType="map" />
                    ) : activeView === 'api_arch' ? (
                        <ApiDocsPanel docType="arch" />
                    ) : (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.flex}
                            keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}
                        >
                            <View style={styles.chatArea}>
                                {/* Messages */}
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    renderItem={({ item }) => <MessageBubble item={item} />}
                                    keyExtractor={(item) => item.id}
                                    style={styles.flex}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                                    onContentSizeChange={() => {
                                        if (isLoading) {
                                            flatListRef.current?.scrollToEnd({ animated: false });
                                        }
                                    }}
                                    ListFooterComponent={
                                        isLoading ? (
                                            <MessageBubble 
                                                item={{
                                                    id: 'streaming',
                                                    sender: 'chaetra',
                                                    text: streamingContent,
                                                    trace: performanceSteps,
                                                    thinkingContent: thinkingContent,
                                                    sources: [] // Sources come at the end
                                                }}
                                            />
                                        ) : null
                                    }
                                />

                                {/* Cognitive trace */}
                                {isLoading && traceSteps.length > 0 && (
                                    <View style={styles.traceWrapper}>
                                        <TraceList steps={traceSteps} />
                                    </View>
                                )}

                                {/* Input */}
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
                    )}

                    {/* Mobile Bottom Navigation */}
                    {isMobile && (
                        <MobileBottomNav
                            activeTab={activeView}
                            onTabPress={(tab) => {
                                if (tab === 'connections') {
                                    setMobileRightPanelVisible(true);
                                } else if (tab === 'notifications') {
                                    // TODO: Open notifications panel/modal
                                    console.log('Notifications tapped - to be implemented');
                                } else {
                                    setActiveView(tab);
                                }
                            }}
                            isConnected={isConnected}
                        />
                    )}
                </View>

                {/* Right Panel */}
                {(isDesktop || isTablet) && (
                    <RightPanel
                        visible={true}
                        expanded={rightPanelExpanded}
                        onToggle={() => setRightPanelExpanded(!rightPanelExpanded)}
                        conversationSources={conversationSources}
                    />
                )}
            </View>

            {/* Body Map Modal */}
            <BodyMapModal
                visible={bodyMapVisible}
                onClose={() => setBodyMapVisible(false)}
            />

            {/* Profile Modal */}
            <ProfileModal
                visible={profileVisible}
                onClose={() => {
                    setProfileVisible(false);
                    fetch(`${API_BASE_URL}/user/profile`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => data && setUserProfile(data));
                }}
            />

            {/* Mobile Right Panel Sheet */}
            <MobileRightPanelSheet
                visible={mobileRightPanelVisible}
                onClose={() => setMobileRightPanelVisible(false)}
                conversationSources={conversationSources}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#212121"
    },

    flex: {
        flex: 1
    },

    appLayout: {
        flex: 1,
        flexDirection: 'row',
    },

    mainArea: {
        flex: 1,
        flexDirection: 'column',
    },

    chatArea: {
        flex: 1,
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },

    listContent: {
        paddingBottom: 10,
        paddingTop: 10
    },

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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        backgroundColor: "#2f2f2f",
        borderRadius: 16,
        borderBottomLeftRadius: 4,
    },

    thinkingText: {
        color: '#10a37f',
        fontSize: 14,
        fontWeight: '500',
    },

    // Thinking stream text (typewriter effect)
    thinkingStream: {
        color: '#b4b4b4',
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'monospace',
    },

    thinkingCursor: {
        color: '#10a37f',
        fontSize: 14,
    },

    // Understanding phase - initial state
    understandingPhase: {
        marginBottom: 8,
    },

    understandingLabel: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
        marginBottom: 4,
    },

    thinkingTokensBox: {
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#444',
        marginTop: 4,
    },

    thinkingTokens: {
        fontSize: 13,
        color: '#999',
        lineHeight: 20,
    },

    thoughtSummary: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },

    // Cursor-style: Action steps
    actionStep: {
        marginVertical: 2,
    },

    actionRunning: {
        fontSize: 13,
        color: '#888',
        lineHeight: 20,
    },

    actionComplete: {
        fontSize: 13,
        color: '#10a37f',
        lineHeight: 20,
    },

    arrowMark: {
        color: '#888',
        marginRight: 4,
    },

    tickMark: {
        color: '#10a37f',
        marginRight: 4,
    },
    
    // Step container
    stepContainer: {
        marginBottom: 4,
    },
    
    // Expand icon for clickable thinking
    expandIcon: {
        color: '#666',
        fontSize: 10,
        marginLeft: 4,
    },

    // Response content
    responseContent: {
        marginTop: 8,
    },

    // Blinking cursor for typewriter effect
    blinkingCursor: {
        color: '#10a37f',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 2,
    },
    
    // WhatsApp-style typing dots
    typingDot: {
        color: '#10a37f',
        fontSize: 10,
        marginHorizontal: 1,
    },

    traceWrapper: {
        padding: 12,
        backgroundColor: "#2f2f2f",
        borderTopWidth: 1,
        borderColor: "#4444",
    },

    // Premium streaming container - MUST match MessageBubble.messageRow style exactly
    streamingContainer: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    // Progress timeline (horizontal steps)
    progressTimeline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 16,
        paddingHorizontal: 8,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginBottom: 8,
    },

    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    progressDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },

    progressDotCompleted: {
        backgroundColor: '#10a37f',
    },

    progressDotActive: {
        backgroundColor: '#10a37f',
        shadowColor: '#10a37f',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },

    progressCheck: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },

    progressLabel: {
        marginLeft: 6,
        marginRight: 4,
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },

    progressLabelActive: {
        color: '#10a37f',
    },

    progressLine: {
        width: 20,
        height: 2,
        backgroundColor: '#444',
        marginHorizontal: 4,
    },

    progressLineCompleted: {
        backgroundColor: '#10a37f',
    },

    // Streaming content (markdown rendered)
    streamingContent: {
        maxWidth: '100%',
    },

    streamingCursor: {
        color: '#10a37f',
        fontSize: 16,
        fontWeight: '300',
        opacity: 0.9,
    },

    // Fallback thinking row
    thinkingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        backgroundColor: '#2f2f2f',
        borderRadius: 12,
    },

    thinkingLabel: {
        color: '#10a37f',
        fontSize: 14,
        fontWeight: '500',
    },


    // Mobile overlay styles
    mobileOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
    },

    overlayBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    mobileSidebar: {
        width: 280,
        height: '100%',
        zIndex: 1001,
    },
});
