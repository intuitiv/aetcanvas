// File: chaetra-universal/hooks/useCognitiveTraceSocket.ts

import { useState, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'http://localhost:8000';
const DEFAULT_USER_ID = 'sainathm';  // Default user (auth will be added later)

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

export const useCognitiveTraceSocket = () => {
    const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
    const [performanceSteps, setPerformanceSteps] = useState<PerformanceStep[]>([]);
    const [streamingContent, setStreamingContent] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const socketRef = useRef<WebSocket | null>(null);
    const lastTimestamp = useRef<number>(Date.now());
    const performanceStepsRef = useRef<PerformanceStep[]>([]); // Ref for async access
    
    // Typing effect queue
    const tokenQueue = useRef<string[]>([]);
    const queueInterval = useRef<NodeJS.Timeout | null>(null);

    // Initial delay before showing typing (solves "too fast" start)
    const TYPING_DELAY_MS = 30;

    const processQueue = useCallback(() => {
        if (tokenQueue.current.length > 0) {
            // Adaptive speed: If queue is backing up, consume more per tick to catch up smoothly
            const queueLen = tokenQueue.current.length;
            let count = 1;
            if (queueLen > 100) count = 5;
            else if (queueLen > 50) count = 2;
            
            let chunk = '';
            for (let i = 0; i < count && tokenQueue.current.length > 0; i++) {
                chunk += tokenQueue.current.shift() || '';
            }
            
            if (chunk) {
                setStreamingContent(prev => prev + chunk);
            }
        }
    }, []);

    // Start consuming queue on connect
    const startQueue = useCallback(() => {
        if (queueInterval.current) clearInterval(queueInterval.current);
        queueInterval.current = setInterval(processQueue, TYPING_DELAY_MS);
    }, [processQueue]);

    const stopQueue = useCallback(() => {
        if (queueInterval.current) {
            clearInterval(queueInterval.current);
            queueInterval.current = null;
        }
        tokenQueue.current = [];
    }, []);

    const connect = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState < 2) return;

        setTraceSteps([]);
        setPerformanceSteps([]);
        performanceStepsRef.current = []; // Clear ref
        setStreamingContent('');
        setIsStreaming(false);
        stopQueue(); // Reset queue
        startQueue(); // Start consumer

        lastTimestamp.current = Date.now();
        const wsUrl = `${WEBSOCKET_URL.replace('http', 'ws')}/ws/chaetra-updates/${DEFAULT_USER_ID}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log('Cognitive Trace WebSocket Connected!');
        ws.onclose = () => {
             console.log('Cognitive Trace WebSocket Disconnected.');
             stopQueue();
        };
        ws.onerror = (error) => console.error('WebSocket Error:', error);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle streaming tokens (typing effect)
                if (data.type === 'streaming_token') {
                    setIsStreaming(true);
                    if (!data.is_final) {
                        // Push to queue instead of setting directly
                        tokenQueue.current.push(data.token);
                    }
                }
                
                // Handle streaming replacement (Option A - deep thinking correction)
                else if (data.type === 'streaming_replace') {
                    // Current Option A implementation replaces EVERYTHING
                    tokenQueue.current = [];
                    setStreamingContent(data.content);
                }
                
                // Handle performance trace events (progress indicator)
                else if (data.type === 'performance_trace') {
                    const perfData = data.data || data;
                    const newStep: PerformanceStep = {
                        step: perfData.step,
                        status: perfData.event === 'step_start' ? 'start' : 'complete',
                        duration_ms: perfData.duration_ms,
                        elapsed_ms: perfData.elapsed_ms,
                        metadata: perfData.metadata,
                    };
                    
                    // Only add completed steps to avoid duplicates
                    if (newStep.status === 'complete') {
                        setPerformanceSteps(prev => {
                            const newState = [...prev, newStep];
                            // Sync ref immediately for async access
                            performanceStepsRef.current = newState;
                            return newState;
                        });
                    }
                }
                
                // Handle legacy cognitive_trace events
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
            } catch (e) { console.error("Failed to parse WebSocket message:", e); }
        };
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    const clearStreaming = useCallback(() => {
        setStreamingContent('');
        setIsStreaming(false);
        stopQueue();
    }, [stopQueue]);
    
    // Expose queue length getter strictly for drain checking
    const getTokenQueueLength = useCallback(() => tokenQueue.current.length, []);

    return { 
        traceSteps, 
        performanceSteps,
        performanceStepsRef,
        streamingContent, 
        isStreaming,
        connect, 
        disconnect,
        clearStreaming,
        getTokenQueueLength,
    };
};