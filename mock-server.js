const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json());

const PORT = 4000; // Using a different port to avoid conflicts

app.post("/api/v1/conversation", (req, res) => {
  const { user_id, message_text, conversation_id } = req.body;

  console.log("POST /api/v1/conversation", req.body);

  const response = {
    chaetra_message_id: crypto.randomUUID(),
    conversation_id: conversation_id || crypto.randomUUID(),
    reply_text: `You said: "${message_text}"`,
    detected_patterns: [],
    candidate_memory_updates: [],
    recommendations: [],
    suggestions_offers: [],
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

app.post("/api/v1/feedback", (req, res) => {
  const { user_id, chaetra_message_id_to_feedback_on, feedback_type } = req.body;

  console.log("POST /api/v1/feedback", req.body);

  const response = {
    feedback_id: crypto.randomUUID(),
    acknowledged_message_id: chaetra_message_id_to_feedback_on,
    status: "feedback_received",
    message: `Feedback of type "${feedback_type}" received.`,
  };

  res.json(response);
});

const memories = [];

app.get("/api/v1/memories", (req, res) => {
  const { user_id, fact_type, limit = 10, offset = 0 } = req.query;

  console.log("GET /api/v1/memories", req.query);

  let filteredMemories = memories;
  if (user_id) {
    filteredMemories = filteredMemories.filter((m) => m.user_id === user_id);
  }
  if (fact_type) {
    filteredMemories = filteredMemories.filter((m) => m.fact_type === fact_type);
  }

  const paginatedMemories = filteredMemories.slice(offset, offset + limit);

  const response = {
    items: paginatedMemories,
    total: filteredMemories.length,
    limit: limit,
    offset: offset,
  };

  res.json(response);
});

app.post("/api/v1/memories", (req, res) => {
  const { user_id, fact_type, content_text, content_json } = req.body;

  console.log("POST /api/v1/memories", req.body);

  const newMemory = {
    user_id,
    fact_type,
    content_text,
    content_json,
    memory_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memories.push(newMemory);

  res.status(201).json(newMemory);
});

const patterns = [];

app.get("/api/v1/patterns", (req, res) => {
  const { user_id, limit = 10, offset = 0 } = req.query;

  console.log("GET /api/v1/patterns", req.query);

  let filteredPatterns = patterns;
  if (user_id) {
    filteredPatterns = filteredPatterns.filter((p) => p.user_id === user_id);
  }

  const paginatedPatterns = filteredPatterns.slice(offset, offset + limit);

  const response = {
    items: paginatedPatterns,
    total: filteredPatterns.length,
    limit: limit,
    offset: offset,
  };

  res.json(response);
});

app.post("/api/v1/patterns", (req, res) => {
  const { user_id, name, description, trigger_conditions_json, actions_json } = req.body;

  console.log("POST /api/v1/patterns", req.body);

  const newPattern = {
    user_id,
    name,
    description,
    trigger_conditions_json,
    actions_json,
    pattern_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  patterns.push(newPattern);

  res.status(201).json(newPattern);
});

app.get("/api/v1/events", (req, res) => {
  const { user_id } = req.query;

  console.log("GET /api/v1/events", req.query);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const sendEvent = (index) => {
    if (index < 10) {
      const event = {
        id: crypto.randomUUID(),
        event_name: "trace",
        timestamp: new Date().toISOString(),
        user_id,
        payload_json: JSON.stringify({
          step: `Step ${index + 1}`,
          details: `Details for step ${index + 1}`,
        }),
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      setTimeout(() => sendEvent(index + 1), 1000);
    } else {
      res.write('data: {"type": "stream_end"}\n\n');
      res.end();
    }
  };

  sendEvent(0);
});

app.post("/api/v1/upload", upload.array("files"), (req, res) => {
  const { user_id, message } = req.body;
  const files = req.files;

  console.log("POST /api/v1/upload", { user_id, message, files });

  const file_infos = files.map((file) => ({
    assigned_file_id: crypto.randomUUID(),
    original_filename: file.originalname,
    content_type: file.mimetype,
    size_bytes: file.size,
  }));

  const response = {
    file_ledger_ids: file_infos.map((fi) => fi.assigned_file_id),
    file_infos,
    overall_status: "files_accepted_for_processing",
    message: "Files uploaded successfully.",
  };

  res.json(response);
});

app.post("/api/v1/upload", upload.array("files"), (req, res) => {
  const { user_id, message } = req.body;
  const files = req.files;

  console.log("POST /api/v1/upload", { user_id, message, files });

  const file_infos = files.map((file) => ({
    assigned_file_id: crypto.randomUUID(),
    original_filename: file.originalname,
    content_type: file.mimetype,
    size_bytes: file.size,
  }));

  const response = {
    file_ledger_ids: file_infos.map((fi) => fi.assigned_file_id),
    file_infos,
    overall_status: "files_accepted_for_processing",
    message: "Files uploaded successfully.",
  };

  res.json(response);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock server running at http://0.0.0.0:${PORT}/`);
});