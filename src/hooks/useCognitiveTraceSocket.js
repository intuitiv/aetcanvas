import { useEffect, useRef } from 'react';
import RNEventSource from 'react-native-event-source';

export default function useCognitiveTraceSocket(onMessage, onError) {
    const esRef = useRef(null);

    useEffect(() => {
        const url = "http://localhost:3000/trace/stream"; // keep your original URL

        const es = new RNEventSource(url, {
            headers: {
                Accept: 'text/event-stream',
            },
            withCredentials: false,
        });

        esRef.current = es;

        es.addEventListener("message", (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage && onMessage(data);
            } catch (err) {
                console.warn("SSE parse error:", err);
            }
        });

        es.addEventListener("error", (event) => {
            console.warn("SSE stream error:", event);
            onError && onError(event);
        });

        return () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, []);

    return {
        close: () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        }
    };
}
