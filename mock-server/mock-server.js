// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");

// --- Setup ---
const app = express();
const server = http.createServer(app); // Use http server to attach both Express and WebSocket
const wss = new WebSocket.Server({ server });
const upload = multer({ storage: multer.memoryStorage() });
const path = require('path');

const PORT = 8000; // CORRECTED: Match the port in your client's config

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Mock Data Factories ---
const createMockApiResponse = (requestBody, isFileUpload = false, fileName = "") => {
    const originalMessage = isFileUpload ? requestBody.message : requestBody.message_text;
    const conversationId = requestBody.conversation_id || crypto.randomUUID();

    let replyText = `This is a mock reply to: "${originalMessage}".`;
    if (isFileUpload) {
        replyText = `I have analyzed the file "${fileName}". ${replyText}`;
    }

    return {
        chaetra_message_id: crypto.randomUUID(),
        conversation_id: conversationId,
        reply_text: replyText,
        sources: [
            {
                source_id: 'doc-1',
                mime_type: 'application/pdf',
                document_title: 'Mock Annual Report.pdf',
                snippet: 'The company saw a 15% increase in revenue, driven by strong performance.',
                relevance_score: 0.92,
            },
            {
                source_id: 'img-1',
                mime_type: 'image/png',
                document_title: 'Mock Market Share Chart',
                snippet: 'A chart depicting market share growth.',
                relevance_score: 0.85,
                preview_url: 'http://aet-mac.badger-corn.ts.net:8000/images/market-chart.png',
            },
        ],
        timestamp: new Date().toISOString(),
    };
};

// --- WebSocket Server for Cognitive Trace ---
wss.on('connection', (ws, req) => {
    const userId = req.url.split('/').pop();
    console.log(`[WebSocket] Client connected for user: ${userId}`);

    const traceSteps = [
        { stage: 'PLANNING', message: 'Analyzing the user query.' },
        { stage: 'EXECUTING', message: 'Querying knowledge base.' },
        { stage: 'EXECUTING', message: 'Found 2 relevant sources.' },
        { stage: 'FINALIZING', message: 'Compiling the final response.' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < traceSteps.length) {
            const step = traceSteps[stepIndex];
            ws.send(JSON.stringify({
                event: 'cognitive_trace',
                data: { stage: step.stage, message: step.message },
            }));
            console.log(`[WebSocket] Sent trace step ${stepIndex + 1} to ${userId}`);
            stepIndex++;
        }
    }, 800); // Send a trace step every 800ms

    ws.on('close', () => {
        console.log(`[WebSocket] Client for user ${userId} disconnected.`);
        clearInterval(interval);
    });

    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        clearInterval(interval);
    });
});


// --- REST API Endpoints ---
const apiRouter = express.Router();

// CORRECTED: This endpoint now returns the expected response structure
apiRouter.post("/conversation", (req, res) => {
    console.log("POST /api/v1/conversation", req.body);
    const response = createMockApiResponse(req.body);

    // Simulate delay to allow trace to appear
    setTimeout(() => {
        res.json(response);
    }, 3500);
});

// CORRECTED: Fixed path, multer middleware, and response structure
apiRouter.post("/knowledge/upload", upload.single("file"), (req, res) => {
    console.log("POST /api/v1/knowledge/upload", { body: req.body, file: req.file });

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const response = createMockApiResponse(req.body, true, req.file.originalname);

    // Simulate longer delay for file processing
    setTimeout(() => {
        res.json(response);
    }, 4500);
});

// CORRECTED: All API routes are now correctly prefixed with /api/v1
app.use("/api/v1", apiRouter);

// --- Start the Server ---
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Chaetra Mock Server is running.`);
    console.log(`   - REST API listening on http://0.0.0.0:${PORT}/api/v1`);
    console.log(`   - WebSocket listening on ws://0.0.0.0:${PORT}`);
});