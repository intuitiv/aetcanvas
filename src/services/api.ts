// File: chaetra-universal/services/api.ts

import axios, { AxiosInstance } from 'axios';

// --- Configuration ---
export const API_BASE_URL = 'http://localhost:8000/api/v1';
export const DEFAULT_USER_ID = 'sainathm';  // Default user (auth will be added later)
const DEV_TOKEN = 'YOUR_DEV_TOKEN_HERE'; // IMPORTANT: Replace with a valid token

// --- API Client Setup ---
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Set auth token immediately
apiClient.defaults.headers.common['Authorization'] = `Bearer ${DEV_TOKEN}`;