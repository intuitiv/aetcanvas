// File: chaetra-universal/services/api.ts

import axios, { AxiosInstance } from 'axios';

// --- Configuration ---
// Use environment variable for API URL (works on mobile with Expo)
export const API_BASE = process.env.EXPO_PUBLIC_DEFAULT_WORKSPACE_URL || 'http://localhost:8000';
export const API_BASE_URL = `${API_BASE}/api/v1`;
export const DEFAULT_USER_ID = 'sainathm';  // Default user (auth will be added later)
const DEV_TOKEN = 'YOUR_DEV_TOKEN_HERE'; // IMPORTANT: Replace with a valid token

// --- API Client Setup ---
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Set auth token immediately
apiClient.defaults.headers.common['Authorization'] = `Bearer ${DEV_TOKEN}`;