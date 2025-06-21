// Configuration for different environments
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Determine the API base URL based on the environment
const getApiBaseUrl = () => {
  if (isDevelopment) {
    // If accessing from localhost, use localhost
    if (isLocalhost) {
      return 'http://localhost:8000/api';
    }
    // If accessing from mobile/other device on same network, use local IP
    return 'http://192.168.0.101:8000/api';
  }
  

  return 'https://shoppeappnow.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Alternative method: You can also detect mobile devices
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

console.log('🔧 API Configuration:', {
  hostname: window.location.hostname,
  isDevelopment,
  isLocalhost,
  isMobile,
  apiBaseUrl: API_BASE_URL
}); 