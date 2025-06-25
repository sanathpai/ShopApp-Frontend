import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { jwtDecode } from 'jwt-decode';

const theme = createTheme();

// Helper function to decode and display JWT token contents
const decodeAndLogToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    console.log('=== JWT Token Contents ===');
    console.log('Full decoded token:', decoded);
    console.log('Available fields:', Object.keys(decoded));
    console.log('Username:', decoded.username);
    console.log('User ID:', decoded.id || decoded.userId || decoded.user_id);
    console.log('Role:', decoded.role);
    console.log('Issued at:', decoded.iat ? new Date(decoded.iat * 1000) : 'Not available');
    console.log('Expires at:', decoded.exp ? new Date(decoded.exp * 1000) : 'Not available');
    console.log('=== END JWT Contents ===');
    
    // Check if password is in token (it shouldn't be!)
    if (decoded.password) {
      console.error('⚠️ WARNING: Password found in JWT token! This is a security issue!');
    } else {
      console.log('✅ Good: No password found in JWT token');
    }
    
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', { username, password });
      const { token, role } = response.data; // Get token and role from response
      console.log(response);
      console.log(response.data);
      console.log(response.data.token);
      console.log(response.data.role);
      
      // Decode and log token contents for debugging
      decodeAndLogToken(token);
      
      // Store token in local storage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('isLoggedIn', 'true');

      // Check role and route to appropriate dashboard
      if (role === 'admin') {
        navigate('/admin/dashboard'); // Admin dashboard route
      } else {
        navigate('/dashboard'); // Normal user dashboard route
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
    }
  };

  // const handleGoogleLogin = () => {
  //   window.location.href = 'https://shoppeappnow.com/api/auth/google';
  // };

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
            Sign in
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography color="error" variant="body2" align="center">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            {/* <Button
              fullWidth
              variant="contained"
              color="secondary"
              sx={{ mt: 1, mb: 2 }}
              onClick={handleGoogleLogin}
            >
              Sign in with Google
            </Button> */}
            <Grid container>
              <Grid item xs>
                <Link href="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ mt: 8, mb: 4 }} align="center">
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} UCSC (Version: 8.6.6)
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
