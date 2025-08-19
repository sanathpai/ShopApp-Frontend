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
  
  // CLIP suggestions states - COMMENTED OUT
  // const [clipSuggestions, setClipSuggestions] = useState([]);
  // const [clipLoading, setClipLoading] = useState(false);
  // const [clipError, setClipError] = useState('');
  // const [showClipSuggestions, setShowClipSuggestions] = useState(false);
  
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

  // Check for available cameras on component load
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

    checkCameraDevices();
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
  //   
  //   // Clear suggestions after selection
  //   setShowClipSuggestions(false);
  //   
  //   // Show confirmation message
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
      
      // Trigger CLIP search for similar products - COMMENTED OUT
      // searchSimilarProducts(imageDataUrl);
    } else {
      console.error('❌ Video or canvas ref is null');
      setCameraError('Unable to capture photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImagePreview(null);
    
    // Clear CLIP suggestions when retaking photo - COMMENTED OUT
    // setClipSuggestions([]);
    // setShowClipSuggestions(false);
    // setClipError('');
    
    startCamera();
  };

  const removePhoto = () => {
    setCapturedImage(null);
    setImagePreview(null);
    stopCamera();
    
    // Clear CLIP suggestions when photo is removed - COMMENTED OUT
    // setClipSuggestions([]);
    // setShowClipSuggestions(false);
    // setClipError('');
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

  // New function to compress images before upload
  // CLIP search functionality - COMMENTED OUT
  // const searchSimilarProducts = async (imageData) => {
  //   if (!isOnline) {
  //     console.log('📱 Offline - skipping CLIP search');
  //     return;
  //   }

  //   try {
  //     setClipLoading(true);
  //     setClipError('');
  //     setClipSuggestions([]);
      
  //     console.log('🔍 Starting CLIP search for similar products...');
      
  //     const response = await axiosInstance.post('/clip/search', {
  //       image: imageData
  //     }, {
  //       timeout: 30000 // 30 second timeout for CLIP processing
  //     });

  //     if (response.data.success && response.data.results) {
  //       setClipSuggestions(response.data.results);
  //       setShowClipSuggestions(true);
  //       console.log(`✅ Found ${response.data.results.length} similar products`);
        
  //       // Show success message
  //       setSnackbarMessage(`Found ${response.data.results.length} similar products! Check suggestions below.`);
  //       setSnackbarSeverity('success');
  //       setSnackbarOpen(true);
  //     } else {
  //       setClipError('No similar products found');
  //     }
  //   } catch (error) {
  //     console.error('❌ CLIP search error:', error);
  //     let errorMessage = 'Failed to find similar products';
      
  //     if (error.response?.status === 408 || error.code === 'ETIMEDOUT') {
  //       errorMessage = 'Search timed out. The image analysis is taking longer than expected.';
  //     } else if (error.response?.data?.error) {
  //       errorMessage = error.response.data.error;
  //     } else if (error.message.includes('Network Error')) {
  //       errorMessage = 'Network error. Please check your connection.';
  //     }
      
  //     setClipError(errorMessage);
  //     setSnackbarMessage(errorMessage);
  //     setSnackbarSeverity('warning');
  //     setSnackbarOpen(true);
  //   } finally {
  //     setClipLoading(false);
  //   }
  // };

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
      
      // Trigger CLIP search for similar products - COMMENTED OUT
      // searchSimilarProducts(compressedImageDataUrl);
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

            {/* CLIP Suggestions Section - COMMENTED OUT */}
            {/* {(clipLoading || showClipSuggestions || clipError) && (
              <Card sx={{ mb: 3, bgcolor: 'blue.50', border: '2px solid', borderColor: 'blue.200' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎯 AI Product Suggestions
                    {clipLoading && <CircularProgress size={20} />}
                  </Typography>
                  
                  {clipLoading && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        🔍 Analyzing your image to find similar products...
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        This may take up to 30 seconds
                      </Typography>
                    </Box>
                  )}

                  {clipError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {clipError}
                    </Alert>
                  )}

                  {showClipSuggestions && clipSuggestions.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Found {clipSuggestions.length} similar products. Click any suggestion to auto-fill the form:
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {clipSuggestions.map((suggestion, index) => (
                          <Grid item xs={12} sm={6} md={4} key={suggestion.product_id}>
                            <Paper
                              component={ButtonBase}
                              onClick={() => handleClipSuggestionSelect(suggestion)}
                              sx={{
                                width: '100%',
                                p: 2,
                                textAlign: 'left',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'primary.50',
                                  transform: 'translateY(-2px)',
                                  boxShadow: 2
                                }
                              }}
                            >
                              <Box>
                                {/* Product Image */}
                                {/* {suggestion.image_url && (
                                  <Box sx={{ mb: 1, position: 'relative' }}>
                                    <img
                                      src={suggestion.image_url}
                                      alt={suggestion.product_name}
                                      style={{
                                        width: '100%',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <Badge
                                      badgeContent={`${suggestion.similarity_percentage}%`}
                                      color="primary"
                                      sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        '& .MuiBadge-badge': {
                                          fontSize: '0.7rem',
                                          fontWeight: 'bold'
                                        }
                                      }}
                                    />
                                  </Box>
                                )} */}
                                
                                {/* Product Details */}
                                {/* <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {suggestion.product_name}
                                </Typography>
                                
                                {suggestion.brand && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Brand: {suggestion.brand}
                                  </Typography>
                                )}
                                
                                {suggestion.variety && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Variety: {suggestion.variety}
                                  </Typography>
                                )}
                                
                                {suggestion.size && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Size: {suggestion.size}
                                  </Typography>
                                )}
                                
                                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                                  🎯 {suggestion.similarity_percentage}% match
                                </Typography> */}
                              {/* </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowClipSuggestions(false)}
                        >
                          ✕ Hide Suggestions
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Not the right product? Continue filling the form manually below.
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {showClipSuggestions && clipSuggestions.length === 0 && !clipLoading && (
                    <Alert severity="info">
                      No similar products found in the database. You can still add this as a new product using the form below.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )} */}

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
