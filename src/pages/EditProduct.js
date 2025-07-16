import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, TextField, Button, Box, Typography, Grid, Snackbar, Alert, Card, CardContent, CardActions, Chip, Stack, IconButton, Paper } from '@mui/material';
import { PhotoCamera, FlipCameraIos, CheckCircle, Cancel, Image as ImageIcon } from '@mui/icons-material';
import axiosInstance from '../AxiosInstance'; 

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addImageMode = searchParams.get('addImage') === 'true';

  const [productName, setProductName] = useState('');
  const [variety, setVariety] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network status

  // Image-related states - simplified like AddProduct
  const [currentImage, setCurrentImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [imageChanged, setImageChanged] = useState(false);

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
    // Fetch the product details if the network is online
    const fetchProduct = async () => {
      if (!isOnline) {
        setSnackbarMessage('You are offline. Cannot fetch product data.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      try {
        const response = await axiosInstance.get(`/products/${id}`);
        const product = response.data;
        setProductName(product.product_name);
        setVariety(product.variety);
        setBrand(product.brand || '');
        setSize(product.size || product.description || ''); // Handle both old and new field names
        
        // Set current image if exists
        const imageUrl = getProductImageUrl(product);
        if (imageUrl) {
          setCurrentImage(imageUrl);
          setImagePreview(imageUrl);
        }

        // If addImage mode is enabled, show a message
        if (addImageMode && !imageUrl) {
          setSnackbarMessage('Add an image to this product using the "Take Photo" button below.');
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setSnackbarMessage('Error fetching product data: ' + (error.response ? error.response.data.error : error.message));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };

    fetchProduct();

    // Handle network status changes
    const handleOnline = () => {
      setIsOnline(true);
      setSnackbarMessage('You are back online.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchProduct(); // Fetch the product data again when back online
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSnackbarMessage('You are offline. Some actions may not be available.');
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
    };
  }, [id, isOnline, addImageMode]);

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    if (product.image_s3_url) {
      return product.image_s3_url;
    }
    if (product.image && product.image.startsWith('data:image/')) {
      return product.image;
    }
    return null;
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
      
      setImageChanged(true);
      setCameraError(''); // Clear any previous errors
      console.log('✅ Image compressed and uploaded successfully');
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

  const retakePhoto = () => {
    setCapturedImage(null);
    setImagePreview(currentImage); // Restore to current image
    setImageChanged(false);
  };

  const removePhoto = () => {
    setCapturedImage(null);
    setImagePreview(currentImage); // Restore to current image  
    setImageChanged(false);
  };

  const removeCurrentImage = () => {
    setCurrentImage(null);
    setCapturedImage(null);
    setImagePreview(null);
    setImageChanged(true); // Mark as changed to update backend
  };

  const handleBrandSuggestionClick = (selectedBrand) => {
    setBrand(selectedBrand);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if the app is offline
    if (!isOnline) {
      setSnackbarMessage('You are offline. Cannot update the product.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const productData = {
        product_name: productName,
        variety,
        brand: brand || null, // Send null if brand is empty
        size,
      };

      // Include image data if changed
      if (imageChanged) {
        if (capturedImage) {
          console.log('📸 IMAGE DEBUG - Adding new image to product data');
          console.log('📸 New image data length:', capturedImage.length);
          
          if (capturedImage.length > 10 * 1024 * 1024) {
            console.warn('⚠️ IMAGE WARNING - Image is large:', (capturedImage.length / (1024 * 1024)).toFixed(2) + 'MB');
            setSnackbarMessage('Image is still too large after compression. Please try a smaller image or retake the photo.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
          }
          
          productData.image = capturedImage;
        } else {
          // Image was removed
          productData.image = null;
        }
      }

      console.log('📤 Sending product update to backend:', {
        ...productData,
        image: productData.image ? `[IMAGE_DATA_${productData.image.length}_CHARS]` : (productData.image === null ? 'REMOVE_IMAGE' : 'NO_CHANGE')
      });

      await axiosInstance.put(`/products/${id}`, productData);
      setSnackbarMessage('Product updated successfully.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/dashboard/products/view'), 1500);
    } catch (error) {
      console.error('Error updating product:', error);
      let errorMessage = 'Error updating product';
      
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
              Edit Product
            </Typography>

            {/* Image Section */}
            <Card sx={{ mb: 3, bgcolor: addImageMode ? 'primary.50' : 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📸 Product Photo
                  {addImageMode && (
                    <Chip label="Add Image Mode" color="primary" size="small" sx={{ ml: 2 }} />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {currentImage ? 'Update or replace the current product photo.' : 'Add a photo to help identify this product.'}
                </Typography>

                {cameraError && (
                  <Alert severity={hasCamera ? "error" : "warning"} sx={{ mb: 2 }}>
                    {cameraError}
                  </Alert>
                )}

                {/* Current/Preview Image Display */}
                {imagePreview && (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Paper sx={{ p: 2, display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Product"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </Paper>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {capturedImage ? (imageChanged ? '✅ New image ready to save' : 'Current image') : 'Current image'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Take Photo Button - Simple like AddProduct */}
                {!capturedImage && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCamera />}
                      size="large"
                      sx={{ 
                        mb: 2, 
                        width: { xs: '100%', sm: 'auto' }
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
                          • Use "Take Photo" as alternative
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Show captured image with action buttons */}
                {capturedImage && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      justifyContent: 'center',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center'
                    }}>
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
                        Cancel Changes
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Remove Current Image Button */}
                {(currentImage || capturedImage) && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={removeCurrentImage}
                      size="small"
                    >
                      Remove Image Completely
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Product name"
                    variant="outlined"
                    fullWidth
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
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
                <Button 
                  type="button" 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard/products/view')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" size="large">
                  {imageChanged ? '💾 Update Product & Image' : 'Update Product'}
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

export default EditProduct;
