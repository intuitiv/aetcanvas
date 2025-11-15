// src/services/api.js

const BASE_URL = "http://localhost:3000"; // <-- change to your server URL

/**
 * Send message + optional attachment to backend
 * Expected by: useChatController.js
 *
 * @param {Object} params
 * @param {string} params.text
 * @param {Object|null} params.attachment
 * @returns {Promise<{text: string, attachment?: any}>}
 */
export async function sendMessageToAPI({ text, attachment }) {
    try {
        let response;

        // ---- If an attachment exists, send as multipart/form-data ----
        if (attachment) {
            const form = new FormData();
            form.append("text", text);

            form.append("file", {
                uri: attachment.uri,
                name: attachment.fileName || "attachment.jpg",
                type: attachment.mimeType || "image/jpeg",
            });

            response = await fetch(`${BASE_URL}/message/upload`, {
                method: "POST",
                body: form,
                headers: {
                    Accept: "application/json",
                },
            });
        } else {
            // ---- Normal JSON request ----
            response = await fetch(`${BASE_URL}/message`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            });
        }

        if (!response.ok) {
            throw new Error(`Server responded ${response.status}`);
        }

        const data = await response.json();

        return {
            text: data.text || "",
            attachment: data.attachment || null,
        };
    } catch (err) {
        console.log("API error:", err);
        throw err;
    }
}
