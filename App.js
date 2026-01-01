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
import { MessageBubble } from "./src/components/MessageBubble";
import { TraceList } from "./src/components/Sources";
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
                                    onContentSizeChange={() =>
                                        flatListRef.current?.scrollToEnd({ animated: true })
                                    }
                                    ListFooterComponent={
                                        isLoading && traceSteps.length === 0 ? (
                                            <ThinkingBubble />
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
        maxWidth: "85%",
        padding: 12,
        backgroundColor: "#2f2f2f",
        borderRadius: 16,
        borderBottomLeftRadius: 4,
    },

    traceWrapper: {
        padding: 12,
        backgroundColor: "#2f2f2f",
        borderTopWidth: 1,
        borderColor: "#4444",
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
