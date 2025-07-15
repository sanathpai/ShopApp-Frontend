import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const theme = createTheme();

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Register = () => {
  const [formData, setFormData] = useState({
    shop_name: '',
    username: '',
    password: '',
    email: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: ''
  });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Debounce function to avoid too many API calls
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedEmail = useDebounce(formData.email, 500);

  // Check for duplicates when username or email changes
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length > 2) {
      checkDuplicates(debouncedUsername, null);
    } else {
      setFieldErrors(prev => ({ ...prev, username: '' }));
    }
  }, [debouncedUsername]);

  useEffect(() => {
    if (debouncedEmail && validateEmail(debouncedEmail)) {
      checkDuplicates(null, debouncedEmail);
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  }, [debouncedEmail]);

  const checkDuplicates = async (username, email) => {
    try {
      const params = new URLSearchParams();
      if (username) params.append('username', username);
      if (email) params.append('email', email);
      
      const response = await axios.get(`http://localhost:8000/api/auth/check-duplicates?${params}`);
      const duplicates = response.data;
      
      setFieldErrors(prev => ({
        ...prev,
        username: duplicates.username ? 'Username already exists' : '',
        email: duplicates.email ? 'Email already registered' : ''
      }));
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear general error when user starts typing
    if (error) setError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    // Check if there are any field errors
    if (fieldErrors.username || fieldErrors.email) {
      setError('Please fix the errors above before submitting');
      return;
    }
    
    // Validate required fields
    if (!formData.shop_name.trim()) {
      setError('Shop name is required');
      return;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }
    
    // Only validate email format if email is provided
    if (formData.email.trim() && !validateEmail(formData.email)) {
      setError('Invalid email address');
      return;
    }
    
    try {
      await axios.post('https://shoppeappnow.com/api/auth/register', formData);
      setOpen(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      // Improved error handling with specific messages
      if (error.response && error.response.data) {
        const { data } = error.response;
        if (data.message) {
          setError(data.message);
        } else if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError('Registration failed. Please check your inputs and try again.');
        }
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="shop_name"
              label="Shop Name"
              name="shop_name"
              autoComplete="shop_name"
              autoFocus
              value={formData.shop_name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="username"
              label="Username"
              id="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address (Optional)"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!fieldErrors.email || (!!error && (error.includes('email') || error.includes('Email')))}
              helperText={fieldErrors.email || ((error.includes('email') || error.includes('Email')) ? error : '')}
            />
            {error && !fieldErrors.username && !fieldErrors.email && (
              <Typography color="error" variant="body2" align="center">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!!fieldErrors.username || !!fieldErrors.email}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
          <Alert onClose={handleClose} severity="success">
            Registration successful!
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default Register;
