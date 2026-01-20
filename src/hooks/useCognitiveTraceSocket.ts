// File: aetcanvas/hooks/useCognitiveTraceSocket.ts
// DD-013: Progressive Thinking UI - Real-time streaming via WebSocket

import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE, DEFAULT_USER_ID } from '../services/api';

// Use the same base URL as the API client for consistency
const WEBSOCKET_BASE = API_BASE;

export interface TraceStep {
    id: string;
    type: 'PLANNING' | 'EXECUTING' | 'FINALIZING' | 'UNKNOWN';
    message: string;
    duration_ms?: number;
}

export interface PerformanceStep {
    step: string;
    status: 'start' | 'complete';
    duration_ms?: number;
    elapsed_ms?: number;
    metadata?: any;
    thinking_content?: string;
}

export interface ToolStep {
    tool: string;
    label: string;
    status: 'running' | 'complete';
    summary?: string;
    duration_ms?: number;
}

// DD-013: Streaming event with sequence number
export interface StreamEvent {
    type: string;
    seq: number;
    data: any;
}

export const useCognitiveTraceSocket = () => {
    const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
    const [performanceSteps, setPerformanceSteps] = useState<PerformanceStep[]>([]);
    const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
    
    // Thinking stream (ephemeral - not saved to history)
    const [thinkingContent, setThinkingContent] = useState<string>('');
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const thinkingStartTime = useRef<number>(0);
    const [thinkingDuration, setThinkingDuration] = useState<number>(0);
    
    // Ref to preserve thinkingContent for saving to messages (state gets cleared)
    const thinkingContentRef = useRef<string>('');
    
    // Response stream (saved to history)
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    
    // DD-013: Sequence tracking for gap detection
    const lastSeq = useRef<number>(0);
    const [missedEvents, setMissedEvents] = useState<number>(0);
    
    // Timing for delayed reveal pattern
    const [requestStartTime, setRequestStartTime] = useState<number>(0);
    const [firstResponseTime, setFirstResponseTime] = useState<number>(0);
    
    // DD-013: Two WebSocket connections
    const legacySocketRef = useRef<WebSocket | null>(null);  // /ws/chaetra-updates
    const thinkingSocketRef = useRef<WebSocket | null>(null);  // /ws/thinking/{session}
    const lastTimestamp = useRef<number>(Date.now());
    const performanceStepsRef = useRef<PerformanceStep[]>([]);
    
    // Current session/conversation ID for thinking socket
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    
    // Typewriter queues - separate for thinking and response
    const thinkingQueue = useRef<string[]>([]);
    const responseQueue = useRef<string[]>([]);
    const queueInterval = useRef<NodeJS.Timeout | null>(null);
    
    const TYPING_DELAY_MS = 5; // Fast word emission for smooth streaming

    const processQueues = useCallback(() => {
        // Process thinking queue - emit whole token per tick
        if (thinkingQueue.current.length > 0) {
            const token = thinkingQueue.current.shift() || '';
            if (token) {
                // 1. Update global thinking content (legacy/backup)
                setThinkingContent(prev => {
                    const newContent = prev + token;
                    thinkingContentRef.current = newContent;
                    return newContent;
                });
                
                // 2. Append to current running step's thinking_content
                setPerformanceSteps(prev => {
                    const steps = [...prev];
                    // Find the last running step (most recent one receiving tokens)
                    let runningIndex = -1;
                    for (let i = steps.length - 1; i >= 0; i--) {
                        if (steps[i].status === 'start') {
                            runningIndex = i;
                            break;
                        }
                    }
                    
                    if (runningIndex >= 0) {
                        const step = steps[runningIndex];
                        steps[runningIndex] = {
                            ...step,
                            thinking_content: (step.thinking_content || '') + token
                        };
                        performanceStepsRef.current = steps;
                        return steps;
                    }
                    return prev;
                });
            }
        }
        
        // Process response queue - emit whole token per tick (word-by-word feel)
        if (responseQueue.current.length > 0) {
            const token = responseQueue.current.shift() || '';
            if (token) {
                setStreamingContent(prev => prev + token);
            }
        }
    }, []);

    const startQueue = useCallback(() => {
        if (queueInterval.current) clearInterval(queueInterval.current);
        queueInterval.current = setInterval(processQueues, TYPING_DELAY_MS);
    }, [processQueues]);

    const stopQueue = useCallback(() => {
        if (queueInterval.current) {
            clearInterval(queueInterval.current);
            queueInterval.current = null;
        }
        thinkingQueue.current = [];
        responseQueue.current = [];
    }, []);

    // DD-013: Handle new thinking socket events
    const handleThinkingEvent = useCallback((event: StreamEvent) => {
        const { type, seq, data } = event;
        
        // Track sequence numbers for gap detection
        if (seq && lastSeq.current > 0 && seq !== lastSeq.current + 1) {
            console.warn(`[WS] Missed events: expected seq ${lastSeq.current + 1}, got ${seq}`);
            setMissedEvents(prev => prev + (seq - lastSeq.current - 1));
        }
        lastSeq.current = seq || 0;
        
        switch (type) {
            case 'thinking_token':
                // LLM reasoning streamed word-by-word
                // DD-014: Detect when thinking_token actually contains answer content
                const content = data?.content || '';
                const isAnswerContent = content.includes('ANSWER:') || 
                    /^(Here are|1\.|##|\*\*Subject|\*\*From|Your (emails|messages|rooms))/.test(content.trim()) ||
                    thinkingQueue.current.some(t => t.includes('ANSWER:'));
                
                if (isAnswerContent) {
                    // This is actually response content, route to response queue
                    // Strip ANSWER: prefix if present
                    const cleanContent = content.replace(/^ANSWER:\s*/i, '');
                    if (cleanContent) {
                        if (firstResponseTime === 0) {
                            setFirstResponseTime(Date.now());
                        }
                        setIsStreaming(true);
                        // Split into words for word-by-word streaming
                        const words = cleanContent.match(/\S+\s*|\s+/g) || [cleanContent];
                        words.forEach((word: string) => responseQueue.current.push(word));
                    }
                } else {
                    // Genuine thinking content
                    if (!isThinking && !thinkingStartTime.current) {
                        thinkingStartTime.current = Date.now();
                        setIsThinking(true);
                    }
                    if (content) {
                        thinkingQueue.current.push(content);
                    }
                }
                break;
                
            case 'step_start':
                // Tool execution starting - update performanceSteps for UI display
                const stepId = data?.step || 'unknown';
                const newStep: PerformanceStep = {
                    step: stepId,
                    status: 'start',
                    duration_ms: undefined,
                    metadata: { label: data?.label || data?.step, icon: data?.icon, seq: seq }
                };
                setPerformanceSteps(prev => {
                    // DD-015: Use seq for deduplication - allow multiple instances of same step type
                    if (prev.some(s => s.metadata?.seq === seq)) {
                        return prev;
                    }
                    const newState = [...prev, newStep];
                    performanceStepsRef.current = newState;
                    return newState;
                });
                // Also track in toolSteps for legacy support
                const newTool: ToolStep = {
                    tool: data?.step || 'unknown',
                    label: data?.label || data?.step || 'Processing...',
                    status: 'running',
                };
                setToolSteps(prev => [...prev, newTool]);
                break;
                
            case 'step_end':
                // Tool execution complete - update performanceSteps in place
                // DD-015: Match only the MOST RECENT unfinished step of this type
                const stepName = data?.step;
                setPerformanceSteps(prev => {
                    // Find the index of the last 'start' step with this name
                    let targetIndex = -1;
                    for (let i = prev.length - 1; i >= 0; i--) {
                        if (prev[i].step === stepName && prev[i].status === 'start') {
                            targetIndex = i;
                            break;
                        }
                    }
                    if (targetIndex === -1) {
                        // No matching start found, return unchanged
                        return prev;
                    }
                    const updated = prev.map((s, i) => 
                        i === targetIndex
                            ? { 
                                ...s, 
                                status: 'complete' as const, 
                                duration_ms: data?.duration_ms,
                                result: data?.result  // Copy result for UI display
                            }
                            : s
                    );
                    performanceStepsRef.current = updated;
                    return updated;
                });
                // Also update toolSteps for legacy support (just update the last matching one)
                setToolSteps(prev => {
                    let targetIndex = -1;
                    for (let i = prev.length - 1; i >= 0; i--) {
                        if (prev[i].tool === stepName && prev[i].status === 'running') {
                            targetIndex = i;
                            break;
                        }
                    }
                    if (targetIndex === -1) return prev;
                    return prev.map((t, i) => 
                        i === targetIndex
                            ? { ...t, status: 'complete', summary: data?.result, duration_ms: data?.duration_ms }
                            : t
                    );
                });
                break;
                
            case 'response_token':
                // Final response streamed word-by-word
                // First response token = end of thinking
                if (isThinking || thinkingStartTime.current) {
                    const duration = Date.now() - thinkingStartTime.current;
                    setThinkingDuration(duration);
                    setIsThinking(false);
                }
                if (firstResponseTime === 0) {
                    setFirstResponseTime(Date.now());
                }
                setIsStreaming(true);
                if (data?.content) {
                    // Split into words for word-by-word streaming
                    const words = data.content.match(/\S+\s*|\s+/g) || [data.content];
                    words.forEach((word: string) => responseQueue.current.push(word));
                }
                break;
                
            case 'keepalive':
                // Connection keepalive, ignore
                break;
                
            default:
                console.log('[WS] Unknown event type:', type, data);
        }
    }, [isThinking, firstResponseTime]);

    // DD-013: Connect to thinking WebSocket for a specific session
    const connectThinkingSocket = useCallback((sessionId: string) => {
        if (thinkingSocketRef.current && thinkingSocketRef.current.readyState < 2) {
            thinkingSocketRef.current.close();
        }
        
        setCurrentSessionId(sessionId);
        lastSeq.current = 0;
        setMissedEvents(0);
        
        const wsUrl = `${WEBSOCKET_BASE.replace('http', 'ws')}/ws/thinking/${sessionId}`;
        console.log('[WS] Connecting to thinking socket:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        thinkingSocketRef.current = ws;
        
        ws.onopen = () => console.log('[WS] Thinking socket connected!');
        ws.onclose = () => console.log('[WS] Thinking socket disconnected.');
        ws.onerror = (error) => console.error('[WS] Thinking socket error:', error);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleThinkingEvent(data as StreamEvent);
            } catch (e) {
                console.error('[WS] Failed to parse thinking event:', e);
            }
        };
        
        // Keepalive ping every 30s
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send('ping');
            }
        }, 30000);
        
        ws.onclose = () => {
            clearInterval(pingInterval);
            console.log('[WS] Thinking socket disconnected.');
        };
        
        return ws;
    }, [handleThinkingEvent]);

    // Connect to legacy socket (existing behavior) + prepare for thinking socket
    const connect = useCallback((sessionId?: string) => {
        if (legacySocketRef.current && legacySocketRef.current.readyState < 2) return;

        // Reset all state
        setTraceSteps([]);
        setPerformanceSteps([]);
        setToolSteps([]);
        performanceStepsRef.current = [];
        setThinkingContent('');
        setStreamingContent('');
        setIsThinking(false);
        setIsStreaming(false);
        setThinkingDuration(0);
        thinkingStartTime.current = 0;
        lastSeq.current = 0;
        setMissedEvents(0);
        
        // Set request start time for delayed reveal
        setRequestStartTime(Date.now());
        setFirstResponseTime(0);
        
        stopQueue();
        startQueue();

        lastTimestamp.current = Date.now();
        
        // DD-013: Connect to thinking socket if session ID provided
        if (sessionId) {
            connectThinkingSocket(sessionId);
        }
        
        // Also connect to legacy updates socket for backward compatibility
        const wsUrl = `${WEBSOCKET_BASE.replace('http', 'ws')}/ws/chaetra-updates/${DEFAULT_USER_ID}`;
        const ws = new WebSocket(wsUrl);
        legacySocketRef.current = ws;

        ws.onopen = () => console.log('[WS] Legacy socket connected!');
        ws.onclose = () => {
            console.log('[WS] Legacy socket disconnected.');
            stopQueue();
        };
        ws.onerror = (error) => console.error('[WS] Legacy socket error:', error);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // === THINKING TOKENS (legacy) ===
                if (data.type === 'thinking_token') {
                    if (!isThinking && !thinkingStartTime.current) {
                        thinkingStartTime.current = Date.now();
                        setIsThinking(true);
                    }
                    if (!data.is_final) {
                        thinkingQueue.current.push(data.token);
                    }
                }
                
                // === TOOL STATUS (legacy) ===
                else if (data.type === 'tool_start') {
                    const newTool: ToolStep = {
                        tool: data.tool,
                        label: data.label || data.tool,
                        status: 'running',
                    };
                    setToolSteps(prev => [...prev, newTool]);
                    thinkingQueue.current.push(`\n→ ${data.label || data.tool}`);
                }
                else if (data.type === 'tool_result') {
                    setToolSteps(prev => prev.map(t => 
                        t.tool === data.tool 
                            ? { ...t, status: 'complete', summary: data.summary }
                            : t
                    ));
                    thinkingQueue.current.push(`\n✓ ${data.summary || data.tool}`);
                }
                
                // === RESPONSE TOKENS (legacy) ===
                else if (data.type === 'streaming_token') {
                    if (firstResponseTime === 0) {
                        setFirstResponseTime(Date.now());
                    }
                    if (isThinking || thinkingStartTime.current) {
                        const duration = Date.now() - thinkingStartTime.current;
                        setThinkingDuration(duration);
                        setIsThinking(false);
                    }
                    setIsStreaming(true);
                    if (!data.is_final && data.token) {
                        const words = data.token.match(/\S+\s*|\s+/g) || [data.token];
                        words.forEach((word: string) => responseQueue.current.push(word));
                    }
                }
                
                // === STREAMING REPLACE (correction) ===
                else if (data.type === 'streaming_replace') {
                    responseQueue.current = [];
                    setStreamingContent(data.content);
                }
                
                // === PERFORMANCE TRACE (DISABLED) ===
                // DD-015: We now use thinking socket exclusively for step events.
                // Legacy socket was adding duplicate steps with different labels.
                else if (data.type === 'performance_trace') {
                    // NO-OP: Thinking socket handles all step_start/step_end events
                    // This prevents duplicates with conflicting labels
                }

                
                // === LEGACY TRACE ===
                else if (data.event === 'cognitive_trace' && data.data) {
                    const now = Date.now();
                    const duration = now - lastTimestamp.current;
                    lastTimestamp.current = now;

                    const traceData = data.data;
                    const newStep: TraceStep = {
                        id: `trace-${now}-${Math.random()}`,
                        type: traceData.stage || 'UNKNOWN',
                        message: traceData.message,
                        duration_ms: duration,
                    };
                    setTraceSteps(prev => [...prev, newStep]);
                }
            } catch (e) { 
                console.error("[WS] Failed to parse legacy message:", e); 
            }
        };
    }, [startQueue, stopQueue, connectThinkingSocket, isThinking, firstResponseTime]);

    const disconnect = useCallback(() => {
        if (legacySocketRef.current) {
            legacySocketRef.current.close();
            legacySocketRef.current = null;
        }
        if (thinkingSocketRef.current) {
            thinkingSocketRef.current.close();
            thinkingSocketRef.current = null;
        }
    }, []);

    const clearStreaming = useCallback(() => {
        setThinkingContent('');
        setStreamingContent('');
        setIsThinking(false);
        setIsStreaming(false);
        setToolSteps([]);
        stopQueue();
    }, [stopQueue]);
    
    const getTokenQueueLength = useCallback(() => 
        thinkingQueue.current.length + responseQueue.current.length, 
    []);

    return { 
        traceSteps, 
        performanceSteps,
        performanceStepsRef,
        toolSteps,
        thinkingContent,
        thinkingContentRef,  // Ref for preserving content when saving to messages
        thinkingDuration,
        isThinking,
        streamingContent, 
        isStreaming,
        requestStartTime,
        firstResponseTime,
        currentSessionId,
        missedEvents,
        connect, 
        connectThinkingSocket,
        disconnect,
        clearStreaming,
        getTokenQueueLength,
    };
};