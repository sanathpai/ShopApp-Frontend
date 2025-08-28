import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, List, ListItem, ListItemText, Chip, Stack, IconButton, Paper, CircularProgress, Divider, ButtonBase, Badge } from '@mui/material';
import { PhotoCamera, FlipCameraIos, CheckCircle, Cancel } from '@mui/icons-material';
import axiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [productName, setProductName] = useState('');
  const [variety, setVariety] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchResults, setSearchResults] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status
  
  // Beta feature toggle state
  const [clipBetaEnabled, setClipBetaEnabled] = useState(false);
  
  // Enhanced CLIP suggestions states with cropping algorithms
  const [clipSuggestions, setClipSuggestions] = useState([]);
  const [enhancedClipSuggestions, setEnhancedClipSuggestions] = useState([]);
  // const [optimizedClipSuggestions, setOptimizedClipSuggestions] = useState([]);
  const [clipLoading, setClipLoading] = useState(false);
  const [enhancedClipLoading, setEnhancedClipLoading] = useState(false);
  // const [optimizedClipLoading, setOptimizedClipLoading] = useState(false);
  const [clipError, setClipError] = useState('');
  const [showClipSuggestions, setShowClipSuggestions] = useState(false);
  const [cropAnalysis, setCropAnalysis] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  
  // Image capture states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [hasCamera, setHasCamera] = useState(true); // Track if device has camera
  const [cameraDevices, setCameraDevices] = useState([]); // Store available cameras
  
  const justSelectedRef = useRef(false); // Track if we just selected a product
  const blurTimeoutRef = useRef(null); // Track blur timeout
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // Load beta settings from localStorage on component mount
  useEffect(() => {
    const savedBetaSetting = localStorage.getItem('clipBetaEnabled');
    if (savedBetaSetting !== null) {
      setClipBetaEnabled(JSON.parse(savedBetaSetting));
    }
  }, []);

  // Check for available cameras and CLIP service health on component load
  useEffect(() => {
    const checkCameraDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(videoDevices);
        
        // Always assume camera is available initially, let getUserMedia determine if it actually works
        setHasCamera(true);
        
        console.log('📹 Available camera devices:', videoDevices.length);
        if (videoDevices.length === 0) {
          console.log('🚫 No camera devices found during enumeration');
          // Don't set hasCamera to false yet - some mobile browsers don't enumerate devices properly
        }
      } catch (error) {
        console.error('❌ Error checking camera devices:', error);
        // Don't disable camera - let the actual camera access attempt determine availability
        console.log('⚠️ Device enumeration failed, but camera might still work');
      }
    };

    // const checkClipServiceHealth = async () => {
    //   try {
    //     console.log('🔍 Checking CLIP service health...');
    //     const response = await axiosInstance.get('/optimized-clip/service-health');
    //     setServiceHealth(response.data);
    //     
    //     if (response.data.status === 'healthy') {
    //       console.log('✅ Optimized CLIP service is healthy and ready');
    //     } else {
    //       console.log('⚠️ CLIP service status:', response.data.status);
    //     }
    //   } catch (error) {
    //     console.error('❌ Error checking CLIP service health:', error);
    //     setServiceHealth({ status: 'unavailable', error: error.message });
    //   }
    // };

    checkCameraDevices();
    // checkClipServiceHealth();
  }, []);

  useEffect(() => {
    // Fetch search results if product name length > 2
    if (productName.length > 2 && isOnline && !justSelectedRef.current) {
      axiosInstance.get(`/products/search/global?q=${productName}`)
        .then(response => {
          const uniqueResults = response.data.reduce((acc, product) => {
            const key = `${product.product_name}-${product.variety || ''}-${product.brand || ''}`;
            if (!acc[key]) {
              acc[key] = product;
            }
            return acc;
          }, {});
          setSearchResults(Object.values(uniqueResults));
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          setSnackbarMessage('Error fetching search results. ' + (error.response ? error.response.data.error : error.message));
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    } else {
      setSearchResults([]); // Clear results when input is too short or offline
    }
    
    // Reset the justSelected flag after the effect runs
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
    }
  }, [productName, isOnline]);

  // Fetch brand suggestions when product name changes
  useEffect(() => {
    if (productName.length > 1 && isOnline) {
      axiosInstance.get(`/products/brands/${encodeURIComponent(productName)}`)
        .then(response => {
          setBrandSuggestions(response.data.brands || []);
        })
        .catch(error => {
          console.error('Error fetching brand suggestions:', error);
          setBrandSuggestions([]);
        });
    } else {
      setBrandSuggestions([]);
    }
  }, [productName, isOnline]);

  useEffect(() => {
    // Handle network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbarMessage('You are back online.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSnackbarMessage('You are offline. Please check your network connection.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    };

    // Add event listeners for network status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Clear any pending blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectProduct = (product) => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    justSelectedRef.current = true; // Set flag to prevent immediate search
    setProductName(product.product_name);
    setVariety(product.variety);
    setBrand(product.brand || '');
    setSize(product.size || product.description || ''); // Handle both old and new field names
    setSearchResults([]);
  };

  const handleProductNameBlur = () => {
    // Clear search results after a small delay to allow clicking on results
    blurTimeoutRef.current = setTimeout(() => {
      setSearchResults([]);
    }, 150);
  };

  const handleProductNameFocus = () => {
    // Clear any pending blur timeout when field gets focus again
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleBrandSuggestionClick = (selectedBrand) => {
    setBrand(selectedBrand);
  };

  // CLIP suggestion selection handler - COMMENTED OUT
  // const handleClipSuggestionSelect = (suggestion) => {
  //   // Auto-fill form with selected suggestion
  //   setProductName(suggestion.product_name);
  //   setBrand(suggestion.brand || '');
  //   setVariety(suggestion.variety || '');
  //   setSize(suggestion.size || '');
  const handleSuggestionSelect = (suggestion, source = 'enhanced') => {
    console.log(`🎯 Selected suggestion from ${source} CLIP:`, suggestion);
    
    // Auto-fill form with suggestion data
    setProductName(suggestion.product_name || '');
    setBrand(suggestion.brand || '');
    setVariety(suggestion.variety || '');
    setSize(suggestion.size || '');
    
    // Clear suggestions after selection
    setShowClipSuggestions(false);
    setShowComparison(false);
    
    // Show confirmation message
    setSnackbarMessage(`✅ Auto-filled form with ${source} CLIP suggestion: ${suggestion.product_name}`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };
  //   setSnackbarMessage(`Product details filled from suggestion: ${suggestion.product_name}`);
  //   setSnackbarSeverity('success');
  //   setSnackbarOpen(true);
  //   
  //   console.log('📝 Form auto-filled from CLIP suggestion:', suggestion);
  // };

  // Camera functionality
  const startCamera = async () => {
    console.log('🎥 Starting camera function...');
    
    try {
      setCameraError('');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia is not supported in this browser');
        setCameraError('Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }
      
      console.log('📱 Requesting camera access with facingMode:', facingMode);
      
      // First, open the camera UI (this will render the video element)
      setIsCameraOpen(true);
      
      // Try with facingMode first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        console.log('✅ Camera access granted with facingMode');
      } catch (facingModeError) {
        console.warn('⚠️ Failed with facingMode, trying without constraint:', facingModeError);
        // Fallback: try without facingMode constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          console.log('✅ Camera access granted without facingMode');
        } catch (fallbackError) {
          console.warn('⚠️ Failed with quality constraints, trying basic video only:', fallbackError);
          // Final fallback: just ask for basic video
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('✅ Camera access granted with basic video');
        }
      }
      
      // Store the stream for later use
      streamRef.current = stream;
      console.log('🎥 Stream stored, waiting for video element...');
      
      // The video element will be set up via useEffect below
      
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Close camera UI on error
      setIsCameraOpen(false);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
        setHasCamera(false); // Only disable camera after confirmed no device
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera access was denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera constraints could not be satisfied.';
      } else {
        errorMessage += 'Please check permissions and try again.';
      }
      
      setCameraError(errorMessage);
    }
  };

  // Effect to handle video element setup when camera opens
  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      console.log('📺 Setting up video element...');
      videoRef.current.srcObject = streamRef.current;
      console.log('✅ Camera stream assigned to video element');
      
      // Add multiple event listeners for better Mac compatibility
      videoRef.current.onloadedmetadata = () => {
        console.log('📹 Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
      };
      
      videoRef.current.oncanplay = () => {
        console.log('📹 Video can play, ready state:', videoRef.current.readyState);
      };
      
      videoRef.current.onplaying = () => {
        console.log('📹 Video is playing');
      };
      
      // Force video to load and play (especially important on Mac)
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.warn('⚠️ Video autoplay prevented:', error);
        // This is normal on some browsers/devices
      });
      
    } else if (isCameraOpen && streamRef.current && !videoRef.current) {
      // If video element isn't ready yet, try again after a short delay
      console.log('⏳ Video element not ready, retrying in 100ms...');
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          console.log('📺 Retry: Setting up video element...');
          videoRef.current.srcObject = streamRef.current;
          console.log('✅ Camera stream assigned to video element (retry)');
          
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          };
          
          videoRef.current.oncanplay = () => {
            console.log('📹 Video can play, ready state:', videoRef.current.readyState);
          };
          
          videoRef.current.onplaying = () => {
            console.log('📹 Video is playing');
          };
          
          // Force video to load and play
          videoRef.current.load();
          videoRef.current.play().catch(error => {
            console.warn('⚠️ Video autoplay prevented:', error);
          });
        }
      }, 100);
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    console.log('📸 Attempting to capture photo...');
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('📹 Video ready state:', video.readyState);
      
      // Check if video dimensions are available (better check for Mac)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('⚠️ Video dimensions not available, waiting for video to load...');
        setCameraError('Video is loading, please wait a moment and try again.');
        
        // Try to wait for video to load
        setTimeout(() => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('🔄 Video loaded, trying capture again...');
            setCameraError(''); // Clear error
            capturePhoto(); // Retry
          } else {
            console.error('❌ Video still not loaded after waiting');
            setCameraError('Video failed to load. Please close and reopen the camera.');
          }
        }, 1000);
        return;
      }
      
      // Additional check for ready state
      if (video.readyState < 2) {
        console.warn('⚠️ Video not ready for capture, ready state:', video.readyState);
        setCameraError('Video not ready. Please wait a moment and try again.');
        return;
      }
      
      // Limit capture size to prevent large images
      const maxCaptureSize = 1024;
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      
      let canvasWidth = originalWidth;
      let canvasHeight = originalHeight;
      
      // Scale down if too large
      if (originalWidth > maxCaptureSize || originalHeight > maxCaptureSize) {
        const scale = Math.min(maxCaptureSize / originalWidth, maxCaptureSize / originalHeight);
        canvasWidth = Math.round(originalWidth * scale);
        canvasHeight = Math.round(originalHeight * scale);
      }
      
      // Set canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Draw video frame to canvas with scaling
      context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
      
      // Convert to base64 with compression
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(imageDataUrl);
      setImagePreview(imageDataUrl);
      
      console.log('✅ Photo captured successfully');
      console.log(`📸 Final image size: ${(imageDataUrl.length / (1024 * 1024)).toFixed(2)}MB`);
      
      // Clear any previous error
      setCameraError('');
      
      // Stop camera after capture
      stopCamera();
      
      // Trigger CLIP search for similar products only if beta feature is enabled
      if (clipBetaEnabled) {
        searchSimilarProducts(imageDataUrl);
      }
    } else {
      console.error('❌ Video or canvas ref is null');
      setCameraError('Unable to capture photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImagePreview(null);
    
    // Clear CLIP suggestions when retaking photo
    setClipSuggestions([]);
    setEnhancedClipSuggestions([]);
    // setOptimizedClipSuggestions([]);
    setPerformanceMetrics(null);
    setShowClipSuggestions(false);
    setShowComparison(false);
    setCropAnalysis(null);
    setClipError('');
    
    startCamera();
  };

  const removePhoto = () => {
    setCapturedImage(null);
    setImagePreview(null);
    stopCamera();
    
    // Clear CLIP suggestions when photo is removed
    setClipSuggestions([]);
    setEnhancedClipSuggestions([]);
    // setOptimizedClipSuggestions([]);
    setPerformanceMetrics(null);
    setShowClipSuggestions(false);
    setShowComparison(false);
    setCropAnalysis(null);
    setClipError('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('📁 File selected:', file.name);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setCameraError('Please select a valid image file (jpg, png, etc.)');
        return;
      }
      
      // Validate file size (max 5MB original file size)
      if (file.size > 5 * 1024 * 1024) {
        setCameraError('Image file is too large. Please select a file smaller than 5MB.');
        return;
      }
      
      // Compress and convert the image
      compressAndConvertImage(file);
    }
  };

  // Enhanced CLIP search with all available algorithms
  const searchSimilarProducts = async (imageData) => {
    if (!isOnline) {
      console.log('📱 Offline - skipping CLIP search');
      return;
    }

    console.log('🎯 Starting CLIP search with all available algorithms...');
    
    // Start with enhanced search, then run comparison
    const startTime = Date.now();
    
    // Run optimized search first (fastest) - COMMENTED OUT
    // await searchWithOptimizedCLIP(imageData);
    
    // Run legacy searches for performance comparison (can be disabled in production)
    await Promise.all([
      searchWithOriginalCLIP(imageData),
      searchWithEnhancedCLIP(imageData)
    ]);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Total search time: ${totalTime}ms`);
  };

  const searchWithOriginalCLIP = async (imageData) => {
    try {
      setClipLoading(true);
      setClipError('');
      setClipSuggestions([]);
      
      console.log('🔍 Original CLIP search...');
      
      const response = await axiosInstance.post('/clip/search', {
        image: imageData
      }, {
        timeout: 30000
      });

      if (response.data.success && response.data.results) {
        setClipSuggestions(response.data.results);
        console.log(`✅ Original CLIP: Found ${response.data.results.length} similar products`);
      } else {
        console.log('⚠️ Original CLIP: No similar products found');
      }
    } catch (error) {
      console.error('❌ Original CLIP search error:', error);
      setClipError('Original CLIP search failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setClipLoading(false);
    }
  };

  const searchWithEnhancedCLIP = async (imageData) => {
    try {
      setEnhancedClipLoading(true);
      setEnhancedClipSuggestions([]);
      
      console.log('🎯 Enhanced CLIP search with cropping...');
      
      const response = await axiosInstance.post('/enhanced-clip/enhanced-search', {
        image: imageData,
        strategies: ['center_crop', 'object_detection', 'saliency_crop', 'text_aware', 'multi_region']
      }, {
        timeout: 45000 // Longer timeout for enhanced processing
      });

      if (response.data.success && response.data.results) {
        setEnhancedClipSuggestions(response.data.results);
        setShowClipSuggestions(true);
        setShowComparison(true);
        console.log(`✅ Enhanced CLIP: Found ${response.data.results.length} similar products`);
        
        // Show success message
        setSnackbarMessage(`🎯 Enhanced CLIP found ${response.data.results.length} products using smart cropping! Check comparison below.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Get cropping analysis
        await analyzeCroppingEffectiveness(imageData);
      } else {
        console.log('⚠️ Enhanced CLIP: No similar products found');
      }
    } catch (error) {
      console.error('❌ Enhanced CLIP search error:', error);
      let errorMessage = 'Enhanced CLIP search failed';
      
      if (error.response?.status === 408 || error.code === 'ETIMEDOUT') {
        errorMessage = 'Enhanced search timed out. The cropping analysis is taking longer than expected.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setClipError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } finally {
      setEnhancedClipLoading(false);
    }
  };

  // const searchWithOptimizedCLIP = async (imageData) => {
  //   try {
  //     setOptimizedClipLoading(true);
  //     setOptimizedClipSuggestions([]);
  //     setClipError('');
  //     
  //     console.log('⚡ Optimized CLIP search (persistent service)...');
  //     const startTime = Date.now();
  //     
  //     const response = await axiosInstance.post('/optimized-clip/optimized-search', {
  //       image: imageData
  //     }, {
  //       timeout: 30000 // Give more time for first request
  //     });

  //     const endTime = Date.now();
  //     const requestTime = endTime - startTime;

  //     if (response.data.success && response.data.results) {
  //       setOptimizedClipSuggestions(response.data.results);
  //       setShowClipSuggestions(true);
  //       
  //       // Store performance metrics
  //       const metrics = {
  //         request_time_ms: requestTime,
  //         server_performance: response.data.performance,
  //         timestamp: new Date().toISOString()
  //       };
  //       setPerformanceMetrics(metrics);
  //       
  //       console.log(`⚡ Optimized CLIP: Found ${response.data.results.length} products in ${requestTime}ms`);
  //       console.log('📊 Server breakdown:', response.data.performance);
  //       
  //       // Show success message with performance info
  //       const serverTime = response.data.performance?.total_time_ms || 'N/A';
  //       setSnackbarMessage(`⚡ Fast search completed! ${response.data.results.length} products found in ${requestTime}ms (server: ${serverTime}ms)`);
  //       setSnackbarSeverity('success');
  //       setSnackbarOpen(true);
  //       
  //     } else {
  //       console.log('⚠️ Optimized CLIP: No similar products found');
  //       setSnackbarMessage('No similar products found with optimized search');
  //       setSnackbarSeverity('info');
  //       setSnackbarOpen(true);
  //     }
  //   } catch (error) {
  //     console.error('❌ Optimized CLIP search error:', error);
  //     let errorMessage = 'Optimized CLIP search failed';
  //     
  //     if (error.response?.status === 503) {
  //       errorMessage = 'CLIP service is starting up. Please try again in a few moments.';
  //     } else if (error.response?.status === 408 || error.code === 'ETIMEDOUT') {
  //       errorMessage = 'Search timed out. The service may be overloaded.';
  //     } else if (error.response?.data?.error) {
  //       errorMessage = error.response.data.error;
  //     } else if (error.message.includes('Network Error')) {
  //       errorMessage = 'Network error. Please check your connection.';
  //     }
  //     
  //     setClipError(errorMessage);
  //     setSnackbarMessage(errorMessage);
  //     setSnackbarSeverity('error');
  //     setSnackbarOpen(true);
  //   } finally {
  //     setOptimizedClipLoading(false);
  //   }
  // };

  const analyzeCroppingEffectiveness = async (imageData) => {
    try {
      console.log('📊 Analyzing cropping effectiveness...');
      
      const response = await axiosInstance.post('/enhanced-clip/analyze-cropping', {
        image: imageData
      }, {
        timeout: 30000
      });

      if (response.data.success && response.data.analysis) {
        setCropAnalysis(response.data);
        console.log('✅ Cropping analysis completed');
      }
    } catch (error) {
      console.error('⚠️ Cropping analysis failed:', error);
    }
  };

  const compressAndConvertImage = (file) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1024x1024)
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression (quality 0.7 = 70%)
      const compressedImageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // Check final size (should be much smaller now)
      const finalSizeMB = (compressedImageDataUrl.length / (1024 * 1024));
      console.log(`📸 Compressed image size: ${finalSizeMB.toFixed(2)}MB`);
      
      if (finalSizeMB > 10) {
        // If still too large, compress more
        const veryCompressedImageDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setCapturedImage(veryCompressedImageDataUrl);
        setImagePreview(veryCompressedImageDataUrl);
        console.log('⚠️ Used extra compression due to large size');
      } else {
        setCapturedImage(compressedImageDataUrl);
        setImagePreview(compressedImageDataUrl);
      }
      
      setCameraError(''); // Clear any previous errors
      console.log('✅ Image compressed and uploaded successfully');
      
      // Trigger Enhanced CLIP search for similar products with cropping only if beta feature is enabled
      if (clipBetaEnabled) {
        searchSimilarProducts(compressedImageDataUrl);
      }
    };
    
    img.onerror = () => {
      setCameraError('Failed to process the selected image. Please try another image.');
    };
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
    if (isCameraOpen) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the app is offline
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot add product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const productData = {
        product_name: productName.trim(),
        variety: variety.trim(),
        brand: brand?.trim() || null, // Send null if brand is empty
        size: size.trim(),
      };

      // Include image data if captured
      if (capturedImage) {
        console.log('📸 IMAGE DEBUG - Adding image to product data');
        console.log('📸 Image data length:', capturedImage.length);
        console.log('📸 Image data type:', typeof capturedImage);
        console.log('📸 Image data preview (first 100 chars):', capturedImage.substring(0, 100));
        
        // Reduced size limit for better reliability (10MB instead of 16MB)
        if (capturedImage.length > 10 * 1024 * 1024) {
          console.warn('⚠️ IMAGE WARNING - Image is large:', (capturedImage.length / (1024 * 1024)).toFixed(2) + 'MB');
          setSnackbarMessage('Image is still too large after compression. Please try a smaller image or retake the photo.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          return;
        }
        
        productData.image = capturedImage;
        console.log('📸 Image added to productData successfully');
      } else {
        console.log('📸 No image captured, proceeding without image');
      }

      console.log('📤 Sending product data to backend:', {
        ...productData,
        image: productData.image ? `[IMAGE_DATA_${productData.image.length}_CHARS]` : 'NO_IMAGE'
      });

      const response = await axiosInstance.post('/products', productData);

      console.log('✅ Product creation response:', response.data);

      setSnackbarMessage('Product added successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      const newProductId = response.data.product_id;
      
      // Automatically navigate to Add Unit page with current product selected
      navigate(`/dashboard/units/add?product_id=${newProductId}&from_product=true`);

    } catch (error) {
      console.error('❌ Product creation error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Error adding product';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 413) {
        errorMessage = 'Image too large. Please try a smaller image.';
      } else if (error.response?.status === 408 || error.code === 'ETIMEDOUT') {
        errorMessage = 'Upload timed out. Please try a smaller image or check your connection.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = errorMessage + ': ' + (error.response?.data?.error || error.message);
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Add Product
            </Typography>

            {/* Image Capture Section */}
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📸 Add Product Photo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Take a picture with your camera or upload an image from your device.
                </Typography>

                {cameraError && (
                  <Alert severity={hasCamera ? "error" : "warning"} sx={{ mb: 2 }}>
                    {cameraError}
                  </Alert>
                )}

                {!capturedImage && !isCameraOpen && (
                  <Box sx={{ textAlign: 'center' }}>
                    {/* Camera Option - Always show unless confirmed no camera */}
                    {/* {hasCamera && (
                      // <Button
                      //   variant="contained"
                      //   startIcon={<PhotoCamera />}
                      //   onClick={startCamera}
                      //   size="large"
                      //   sx={{ mb: 2, mr: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
                      // >
                      //   📱 Open Camera
                      // </Button>
                    )} */}
                    
                    {/* File Upload Option - Always available */}
                    <Button
                      variant={hasCamera ? "outlined" : "contained"}
                      component="label"
                      startIcon={<PhotoCamera />}
                      size="large"
                      sx={{ 
                        mb: 2, 
                        width: { xs: '100%', sm: 'auto' },
                        mt: { xs: hasCamera ? 1 : 0, sm: 0 }
                      }}
                    >
                      📱 Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </Button>
                    
                    {/* Mobile-specific tip */}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: { xs: 'block', md: 'none' } }}>
                      📱 "Take Photo" opens your camera to capture a new photo
                    </Typography>
                    
                    {/* Desktop-specific tip when no camera */}
                    {!hasCamera && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: { xs: 'none', md: 'block' } }}>
                        💡 Tip: Take photos on your phone, then AirDrop/transfer them to upload here
                      </Typography>
                    )}
                    
                    {/* Troubleshooting for camera issues */}
                    {hasCamera && cameraError && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          🔧 Camera Troubleshooting:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 1 }}>
                          • Close other camera apps (FaceTime, Zoom, etc.)<br/>
                          • Allow camera permissions when prompted<br/>
                          • Try refreshing the page<br/>
                          • Use "Upload from Gallery" as alternative
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {isCameraOpen && (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      controls={false}
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 8, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 1
                    }}>
                      <IconButton
                        onClick={capturePhoto}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                        size="large"
                      >
                        <PhotoCamera />
                      </IconButton>
                      <IconButton
                        onClick={toggleCamera}
                        sx={{
                          bgcolor: 'secondary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'secondary.dark' }
                        }}
                      >
                        <FlipCameraIos />
                      </IconButton>
                      <IconButton
                        onClick={stopCamera}
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {capturedImage && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Paper sx={{ p: 2, mb: 2, display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Captured product"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </Paper>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'center',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center'
                    }}>
                      {hasCamera && (
                        <Button
                          variant="outlined"
                          startIcon={<PhotoCamera />}
                          onClick={retakePhoto}
                          sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                          📱 Retake Photo
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<PhotoCamera />}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        📱 Take Different Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={removePhoto}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Remove
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        disabled
                        sx={{ cursor: 'default', width: { xs: '100%', sm: 'auto' } }}
                      >
                        ✅ Photo Ready
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </CardContent>
            </Card>

            {/* Beta Feature Notice */}
            {!clipBetaEnabled && capturedImage && (
              <Card sx={{ mb: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⚡ Fast Mode Active
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    AI product suggestions are disabled for faster performance. Your photo has been saved and you can manually fill in the product details below.
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                    💡 To enable AI suggestions: Go to Dashboard → Enable "AI Product Suggestions (CLIP)" in Beta Features
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Beta Feature Status for CLIP */}
            {clipBetaEnabled && capturedImage && !(/* optimizedClipLoading || */ clipLoading || enhancedClipLoading || showClipSuggestions || clipError) && (
              <Card sx={{ mb: 3, bgcolor: 'blue.50', border: '1px solid', borderColor: 'blue.200' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🧪 Beta Feature Active: AI Analysis Ready
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CLIP AI suggestions are enabled. Image analysis will start automatically. This may take 10-30 seconds to process.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Enhanced CLIP Suggestions Section with Performance Optimization */}
            {clipBetaEnabled && (/* optimizedClipLoading || */ clipLoading || enhancedClipLoading || showClipSuggestions || clipError) && (
              <Card sx={{ mb: 3, bgcolor: /* optimizedClipLoading ? 'purple.50' : */ 'blue.50', border: '2px solid', borderColor: /* optimizedClipLoading ? 'purple.200' : */ 'blue.200' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* optimizedClipLoading ? '⚡ AI Product Suggestions (Optimized Fast Search)' : */ '🎯 AI Product Suggestions (Enhanced with Smart Cropping) 🧪'}
                    {(/* optimizedClipLoading || */ clipLoading || enhancedClipLoading) && <CircularProgress size={20} />}
                  </Typography>
                  
                  {(/* optimizedClipLoading || */ clipLoading || enhancedClipLoading) && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {/* optimizedClipLoading && '⚡ Running optimized CLIP search...' */}
                        {clipLoading && '🔍 Running original CLIP analysis...'}
                        {enhancedClipLoading && '🎯 Processing with smart cropping algorithms...'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {/* optimizedClipLoading && 'Optimized search with persistent service (<5s expected)' */}
                        {clipLoading && 'Original CLIP processing (up to 30s)'}
                        {enhancedClipLoading && 'Enhanced processing: Object Detection, Text-Aware, Saliency, Center Crop, Multi-Region (up to 45s)'}
                      </Typography>
                    </Box>
                  )}

                  {clipError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {clipError}
                    </Alert>
                  )}

                  {showClipSuggestions && showComparison && (
                    <Box>
                      {/* Accuracy Comparison Header */}
                      <Box sx={{ mb: 3, p: 2, bgcolor: 'green.50', borderRadius: 1, border: '1px solid', borderColor: 'green.200' }}>
                        <Typography variant="h6" sx={{ color: 'purple.800', mb: 1 }}>
                          ⚡ CLIP Performance Comparison
                        </Typography>
                        <Grid container spacing={2}>
                          {/* <Grid item xs={4}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'purple.700' }}>
                              ⚡ Optimized: {optimizedClipSuggestions.length} results
                              {performanceMetrics && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'purple.600' }}>
                                  {performanceMetrics.request_time_ms}ms total
                                </Typography>
                              )}
                            </Typography>
                          </Grid> */}
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'blue.700' }}>
                              📊 Original: {clipSuggestions.length} results
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'green.700' }}>
                              🎯 Enhanced: {enhancedClipSuggestions.length} results
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        {/* Performance Metrics Display - COMMENTED OUT */}
                        {/* {performanceMetrics && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'purple.50', borderRadius: 1, border: '1px solid', borderColor: 'purple.200' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: 'purple.800' }}>
                              ⚡ Optimized CLIP Performance:
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  Total Request: {performanceMetrics.request_time_ms}ms
                                </Typography>
                                {performanceMetrics.server_performance && (
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    Server Processing: {performanceMetrics.server_performance.total_time_ms}ms
                                  </Typography>
                                )}
                              </Grid>
                              <Grid item xs={6}>
                                {performanceMetrics.server_performance && (
                                  <>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      Embedding: {performanceMetrics.server_performance.embedding_time_ms}ms
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      Search: {performanceMetrics.server_performance.search_time_ms}ms
                                    </Typography>
                                  </>
                                )}
                              </Grid>
                            </Grid>
                          </Box>
                        )} */}
                        
                        {/* Service Health Status - COMMENTED OUT */}
                        {/* {serviceHealth && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: serviceHealth.status === 'healthy' ? 'green.50' : 'orange.50', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ 
                              color: serviceHealth.status === 'healthy' ? 'green.700' : 'orange.700',
                              fontWeight: 'bold'
                            }}>
                              🔧 CLIP Service: {serviceHealth.status === 'healthy' ? '✅ Ready' : '⚠️ ' + serviceHealth.status}
                            </Typography>
                          </Box>
                        )} */}
                        
                        {/* Cropping Analysis */}
                        {cropAnalysis && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                              📈 Best Cropping Strategies:
                            </Typography>
                            {cropAnalysis.analysis && cropAnalysis.analysis.slice(0, 3).map((strategy, idx) => (
                              <Typography key={idx} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                {idx + 1}. {strategy.strategy}: {(strategy.effectiveness_score * 100).toFixed(1)}% effective
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Optimized CLIP Results - COMMENTED OUT */}
                      {/* {optimizedClipSuggestions.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'purple.700', mb: 2 }}>
                            ⚡ Optimized CLIP Results (Fast Performance):
                          </Typography>
                      
                          <Grid container spacing={2}>
                            {optimizedClipSuggestions.map((suggestion, index) => (
                              <Grid item xs={12} sm={6} md={4} key={suggestion.product_id}>
                                <Paper
                                  component={ButtonBase}
                                  onClick={() => handleSuggestionSelect(suggestion, 'optimized')}
                                  sx={{
                                    width: '100%',
                                    p: 2,
                                    textAlign: 'left',
                                    border: '2px solid',
                                    borderColor: 'purple.300',
                                    borderRadius: 2,
                                    bgcolor: 'purple.50',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: 'purple.500',
                                      bgcolor: 'purple.100',
                                      transform: 'translateY(-2px)',
                                      boxShadow: 3
                                    }
                                  }}
                                >
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'purple.800', mb: 0.5 }}>
                                      ⚡ #{index + 1} {suggestion.product_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                      Brand: {suggestion.brand || 'N/A'} | Variety: {suggestion.variety || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      Size: {suggestion.size || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      bgcolor: 'purple.200', 
                                      px: 1, 
                                      py: 0.25, 
                                      borderRadius: 1,
                                      fontWeight: 'bold',
                                      color: 'purple.800'
                                    }}>
                                      Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                                    </Typography>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )} */}

                      {/* Enhanced CLIP Results */}
                      {enhancedClipSuggestions.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'green.700', mb: 2 }}>
                            🎯 Enhanced CLIP Results (with Smart Cropping):
                          </Typography>
                      
                          <Grid container spacing={2}>
                            {enhancedClipSuggestions.map((suggestion, index) => (
                              <Grid item xs={12} sm={6} md={4} key={suggestion.product_id}>
                                <Paper
                                  component={ButtonBase}
                                  onClick={() => handleSuggestionSelect(suggestion, 'enhanced')}
                                  sx={{
                                    width: '100%',
                                    p: 2,
                                    textAlign: 'left',
                                    border: '2px solid',
                                    borderColor: 'green.300',
                                    borderRadius: 2,
                                    bgcolor: 'green.50',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: 'green.500',
                                      bgcolor: 'green.100',
                                      transform: 'translateY(-2px)',
                                      boxShadow: 3
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    {/* Product Image */}
                                    <Box sx={{ flexShrink: 0 }}>
                                      {suggestion.image_url ? (
                                        <img
                                          src={suggestion.image_url}
                                          alt={suggestion.product_name}
                                          style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '2px solid #4caf50'
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <Box sx={{
                                          width: 80,
                                          height: 80,
                                          bgcolor: 'green.100',
                                          borderRadius: 1,
                                          border: '2px solid',
                                          borderColor: 'green.300',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}>
                                          <Typography variant="caption" color="green.600">
                                            📦
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                    
                                    {/* Product Details */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'green.800', mb: 0.5 }}>
                                        🎯 #{index + 1} {suggestion.product_name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {suggestion.brand && `Brand: ${suggestion.brand}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {suggestion.variety && `Variety: ${suggestion.variety}`} {suggestion.size && `• Size: ${suggestion.size}`}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        bgcolor: 'green.200', 
                                        px: 1, 
                                        py: 0.25, 
                                        borderRadius: 1,
                                        fontWeight: 'bold',
                                        color: 'green.800'
                                      }}>
                                        Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      {/* Original CLIP Results */}
                      {clipSuggestions.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'blue.700', mb: 2 }}>
                            📊 Original CLIP Results (for comparison):
                          </Typography>
                          <Grid container spacing={2}>
                            {clipSuggestions.map((suggestion, index) => (
                              <Grid item xs={12} sm={6} md={4} key={suggestion.product_id}>
                                <Paper
                                  component={ButtonBase}
                                  onClick={() => handleSuggestionSelect(suggestion, 'original')}
                                  sx={{
                                    width: '100%',
                                    p: 2,
                                    textAlign: 'left',
                                    border: '1px solid',
                                    borderColor: 'blue.300',
                                    borderRadius: 2,
                                    bgcolor: 'blue.50',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: 'blue.500',
                                      bgcolor: 'blue.100',
                                      transform: 'translateY(-2px)',
                                      boxShadow: 2
                                    }
                                  }}
                            >
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    {/* Product Image */}
                                    <Box sx={{ flexShrink: 0 }}>
                                      {suggestion.image_url ? (
                                        <img
                                          src={suggestion.image_url}
                                          alt={suggestion.product_name}
                                          style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '2px solid #2196f3'
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <Box sx={{
                                          width: 80,
                                          height: 80,
                                          bgcolor: 'blue.100',
                                          borderRadius: 1,
                                          border: '2px solid',
                                          borderColor: 'blue.300',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}>
                                          <Typography variant="caption" color="blue.600">
                                            📦
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                    
                                    {/* Product Details */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'blue.800', mb: 0.5 }}>
                                        📊 #{index + 1} {suggestion.product_name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {suggestion.brand && `Brand: ${suggestion.brand}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {suggestion.variety && `Variety: ${suggestion.variety}`} {suggestion.size && `• Size: ${suggestion.size}`}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        bgcolor: 'blue.200', 
                                        px: 1, 
                                        py: 0.25, 
                                        borderRadius: 1,
                                        fontWeight: 'bold',
                                        color: 'blue.800'
                                      }}>
                                        Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                      
                      {/* Hide Suggestions Button */}
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setShowClipSuggestions(false);
                            setShowComparison(false);
                          }}
                          sx={{ mr: 2 }}
                        >
                          ✕ Hide Comparison
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Click any suggestion above to auto-fill the form • Enhanced results show improved accuracy with smart cropping
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {showClipSuggestions && !showComparison && (/* optimizedClipSuggestions.length > 0 || */ clipSuggestions.length > 0 || enhancedClipSuggestions.length > 0) && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Found {Math.max(/* optimizedClipSuggestions.length, */ enhancedClipSuggestions.length, clipSuggestions.length)} similar products. Click any suggestion to auto-fill the form:
                        {/* optimizedClipSuggestions.length > 0 && performanceMetrics && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'purple.600', fontWeight: 'bold', mt: 0.5 }}>
                            ⚡ Results from optimized search ({performanceMetrics.request_time_ms}ms)
                          </Typography>
                        ) */}
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Prioritize enhanced results, then original */}
                        {(/* optimizedClipSuggestions.length > 0 ? optimizedClipSuggestions : */ 
                          enhancedClipSuggestions.length > 0 ? enhancedClipSuggestions : clipSuggestions).map((suggestion, index) => {
                          
                          const isOptimized = false; // optimizedClipSuggestions.length > 0;
                          const isEnhanced = /* !isOptimized && */ enhancedClipSuggestions.length > 0;
                          const searchType = /* isOptimized ? 'optimized' : */ isEnhanced ? 'enhanced' : 'original';
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={suggestion.product_id}>
                              <Paper
                                component={ButtonBase}
                                onClick={() => handleSuggestionSelect(suggestion, searchType)}
                                sx={{
                                  width: '100%',
                                  p: 2,
                                  textAlign: 'left',
                                  border: '2px solid',
                                  borderColor: /* isOptimized ? 'purple.300' : */ isEnhanced ? 'green.300' : 'blue.300',
                                  borderRadius: 2,
                                  bgcolor: /* isOptimized ? 'purple.50' : */ isEnhanced ? 'green.50' : 'blue.50',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: /* isOptimized ? 'purple.500' : */ isEnhanced ? 'green.500' : 'blue.500',
                                    bgcolor: /* isOptimized ? 'purple.100' : */ isEnhanced ? 'green.100' : 'blue.100',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                  }
                                }}
                              >
                                <Box>
                                  <Typography variant="subtitle1" sx={{ 
                                    fontWeight: 'bold', 
                                    color: /* isOptimized ? 'purple.800' : */ isEnhanced ? 'green.800' : 'blue.800', 
                                    mb: 0.5 
                                  }}>
                                    {/* isOptimized ? '⚡' : */ isEnhanced ? '🎯' : '📊'} #{index + 1} {suggestion.product_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {suggestion.brand && `Brand: ${suggestion.brand}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {suggestion.variety && `Variety: ${suggestion.variety}`} {suggestion.size && `• Size: ${suggestion.size}`}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    bgcolor: /* isOptimized ? 'purple.200' : */ isEnhanced ? 'green.200' : 'blue.200', 
                                    px: 1, 
                                    py: 0.25, 
                                    borderRadius: 1,
                                    fontWeight: 'bold',
                                    color: /* isOptimized ? 'purple.800' : */ isEnhanced ? 'green.800' : 'blue.800'
                                  }}>
                                    Similarity: {(suggestion.similarity * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}

                  {showClipSuggestions && /* optimizedClipSuggestions.length === 0 && */ clipSuggestions.length === 0 && enhancedClipSuggestions.length === 0 && /* !optimizedClipLoading && */ !clipLoading && !enhancedClipLoading && (
                    <Alert severity="info">
                      No similar products found with any CLIP method (original or enhanced). You can still add this as a new product using the form below.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Product name"
                    variant="outlined"
                    fullWidth
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    onBlur={handleProductNameBlur}
                    onFocus={handleProductNameFocus}
                    required
                  />
                  <List>
                    {searchResults.map((product, index) => (
                      <ListItem button key={index} onClick={() => handleSelectProduct(product)}>
                        <ListItemText 
                          primary={product.product_name}
                          secondary={`${product.brand ? `Brand: ${product.brand}` : 'No brand'}${product.variety ? ` | Variety: ${product.variety}` : ' | No variety'}${product.size ? ` | Size: ${product.size}` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Brand (Optional)"
                    variant="outlined"
                    fullWidth
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    helperText="Leave blank if product doesn't have a brand (e.g., apples, onions)"
                  />
                  {brandSuggestions.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Existing brands for "{productName}":
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {brandSuggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            variant="outlined"
                            size="small"
                            onClick={() => handleBrandSuggestionClick(suggestion)}
                            sx={{ mb: 0.5, cursor: 'pointer' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Variety [Gala, Granny Smith etc] (Optional)"
                    variant="outlined"
                    fullWidth
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Size (Optional)"
                    variant="outlined"
                    fullWidth
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    helperText="e.g., 300ml, 500ml, 1L, Small, Medium, Large"
                  />
                </Grid>
              </Grid>
              <CardActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" size="large">
                  Add Product
                </Button>
              </CardActions>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddProduct;
