// File: chaetra-universal/hooks/useCognitiveTraceSocket.ts
// Progressive Thinking UI - Typewriter effect for thinking + response

import { useState, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'http://localhost:8000';
const DEFAULT_USER_ID = 'sainathm';

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
}

export interface ToolStep {
    tool: string;
    label: string;
    status: 'running' | 'complete';
    summary?: string;
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
    
    // Response stream (saved to history)
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    
    // Timing for delayed reveal pattern
    const [requestStartTime, setRequestStartTime] = useState<number>(0);
    const [firstResponseTime, setFirstResponseTime] = useState<number>(0);
    
    const socketRef = useRef<WebSocket | null>(null);
    const lastTimestamp = useRef<number>(Date.now());
    const performanceStepsRef = useRef<PerformanceStep[]>([]);
    
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
                setThinkingContent(prev => prev + token);
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

    const connect = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState < 2) return;

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
        
        // Set request start time for delayed reveal
        setRequestStartTime(Date.now());
        setFirstResponseTime(0);
        
        stopQueue();
        startQueue();

        lastTimestamp.current = Date.now();
        const wsUrl = `${WEBSOCKET_URL.replace('http', 'ws')}/ws/chaetra-updates/${DEFAULT_USER_ID}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log('WebSocket Connected!');
        ws.onclose = () => {
            console.log('WebSocket Disconnected.');
            stopQueue();
        };
        ws.onerror = (error) => console.error('WebSocket Error:', error);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // === THINKING TOKENS ===
                if (data.type === 'thinking_token') {
                    if (!isThinking && !thinkingStartTime.current) {
                        thinkingStartTime.current = Date.now();
                        setIsThinking(true);
                    }
                    if (!data.is_final) {
                        thinkingQueue.current.push(data.token);
                    }
                }
                
                // === TOOL STATUS ===
                else if (data.type === 'tool_start') {
                    const newTool: ToolStep = {
                        tool: data.tool,
                        label: data.label || data.tool,
                        status: 'running',
                    };
                    setToolSteps(prev => [...prev, newTool]);
                    // Also add to thinking stream with arrow
                    thinkingQueue.current.push(`\n→ ${data.label || data.tool}`);
                }
                else if (data.type === 'tool_result') {
                    setToolSteps(prev => prev.map(t => 
                        t.tool === data.tool 
                            ? { ...t, status: 'complete', summary: data.summary }
                            : t
                    ));
                    // Add to thinking stream with checkmark
                    thinkingQueue.current.push(`\n✓ ${data.summary || data.tool}`);
                }
                
                // === RESPONSE TOKENS ===
                else if (data.type === 'streaming_token') {
                    // Track first response time for delayed reveal
                    if (firstResponseTime === 0) {
                        setFirstResponseTime(Date.now());
                    }
                    
                    // First response token = end of thinking
                    if (isThinking || thinkingStartTime.current) {
                        const duration = Date.now() - thinkingStartTime.current;
                        setThinkingDuration(duration);
                        setIsThinking(false);
                    }
                    setIsStreaming(true);
                    if (!data.is_final && data.token) {
                        // Split token into words for word-by-word streaming
                        // Keep spaces attached to words for proper rendering
                        const words = data.token.match(/\S+\s*|\s+/g) || [data.token];
                        words.forEach((word: string) => responseQueue.current.push(word));
                    }
                }
                
                // === STREAMING REPLACE (correction) ===
                else if (data.type === 'streaming_replace') {
                    responseQueue.current = [];
                    setStreamingContent(data.content);
                }
                
                // === PERFORMANCE TRACE ===
                else if (data.type === 'performance_trace') {
                    const perfData = data.data || data;
                    const stepName = perfData.step;
                    const isStart = perfData.event === 'step_start';
                    
                    if (isStart) {
                        // Add new step with 'start' status (shows →)
                        const newStep: PerformanceStep = {
                            step: stepName,
                            status: 'start',
                            duration_ms: undefined,
                            elapsed_ms: perfData.elapsed_ms,
                            metadata: perfData.metadata,
                        };
                        setPerformanceSteps(prev => {
                            const newState = [...prev, newStep];
                            performanceStepsRef.current = newState;
                            return newState;
                        });
                    } else {
                        // Update existing step to 'complete' status (shows ✓)
                        setPerformanceSteps(prev => {
                            const updated = prev.map(s => 
                                s.step === stepName && s.status === 'start'
                                    ? { ...s, status: 'complete' as const, duration_ms: perfData.duration_ms }
                                    : s
                            );
                            performanceStepsRef.current = updated;
                            return updated;
                        });
                    }
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
                console.error("Failed to parse WebSocket message:", e); 
            }
        };
    }, [startQueue, stopQueue]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
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
        thinkingDuration,
        isThinking,
        streamingContent, 
        isStreaming,
        requestStartTime,
        firstResponseTime,
        connect, 
        disconnect,
        clearStreaming,
        getTokenQueueLength,
    };
};