import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://shoppeappnow.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for regular requests
});

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 Token added to request:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No token found in localStorage');
    console.log('💡 Available localStorage keys:', Object.keys(localStorage));
  }
  
  // Increase timeout for requests with large payloads (like images)
  if (config.data && typeof config.data === 'object' && config.data.image) {
    config.timeout = 120000; // 2 minutes for image uploads
    console.log('📸 Image upload detected, extending timeout to 2 minutes');
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
  response => {
    console.log('✅ API Response successful:', response.config.url);
    return response;
  },
  error => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      hasToken: !!localStorage.getItem('token')
    });
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('⏰ Request timed out:', error.config?.url);
      console.log('💡 Consider compressing images or checking network connection');
    }
    
    if (error.response && error.response.status === 401) {
      console.warn('🔄 Authentication failed, clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
