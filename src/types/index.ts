// File: chaetra-universal/types/index.ts

import { TraceStep } from '../hooks/useCognitiveTraceSocket';

// Re-export TraceStep for convenience
export type { TraceStep };

export interface Source {
    source_id?: string;
    document_title?: string;
    snippet: string;
    relevance_score?: number;
    mime_type?: string;
    preview_url?: string;
}

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'chaetra';
    sources?: Source[];
    attachmentName?: string;
    trace?: TraceStep[];
}