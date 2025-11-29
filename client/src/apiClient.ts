import axios from 'axios';

const apiClient = axios.create({
  // This should be the correct baseURL based on your server/index.js file
  //baseURL: 'http://localhost:5000/api',
baseURL: import.meta.env.VITE_API_URL + '/api', // Use a Vite-compatible environment variable
// ... 
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor runs BEFORE every request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // --- THIS IS THE NEW DEBUGGING LOG ---
    // It will print the full request URL to your browser's console.
    console.log(`[API Client] Making request to: ${config.baseURL}${config.url}`);

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

