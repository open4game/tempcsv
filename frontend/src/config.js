/**
 * Application configuration
 * Uses environment variables with fallback values for development
 */

// API base URL - defaults to localhost:8787 for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Configuration object for easy imports
export default {
  API_BASE_URL
} 