// File: chaetra-universal/hooks/useCognitiveTraceSocket.ts

import { useState, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'http://aet-mac.badger-corn.ts.net:8000';
const MOCK_USER_ID = 'test_user';

export interface TraceStep {
    id: string;
    type: 'PLANNING' | 'EXECUTING' | 'FINALIZING' | 'UNKNOWN';
    message: string;
    duration_ms?: number;
}

export const useCognitiveTraceSocket = () => {
    const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const lastTimestamp = useRef<number>(Date.now());

    const connect = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState < 2) return;

        setTraceSteps([]);
        lastTimestamp.current = Date.now();
        const wsUrl = `${WEBSOCKET_URL.replace('http', 'ws')}/ws/chaetra-updates/${MOCK_USER_ID}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => console.log('Cognitive Trace WebSocket Connected!');
        ws.onclose = () => console.log('Cognitive Trace WebSocket Disconnected.');
        ws.onerror = (error) => console.error('WebSocket Error:', error);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'cognitive_trace' && data.data) {
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

    return { traceSteps, connect, disconnect };
};