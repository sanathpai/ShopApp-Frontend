import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Fade,
  Chip,
} from '@mui/material';
import {
  Lightbulb,
  TrendingUp,
  Close,
  ArrowForward,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axiosInstance from '../AxiosInstance';
import { jwtDecode } from 'jwt-decode';

const NotificationButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minWidth: 0,
  minHeight: 0,
  padding: theme.spacing(1.2, 2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  backgroundColor: theme.palette.info.main,
  color: theme.palette.common.white,
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  marginBottom: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.info.dark,
    boxShadow: theme.shadows[4],
  },
}));

const InsightsNotificationBox = () => {
  const [hasNewInsights, setHasNewInsights] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const extractedUserId = decoded.id || decoded.userId || decoded.user_id;
        setUserId(extractedUserId);
      } catch (error) {
        console.error('Invalid token in InsightsNotificationBox:', error);
      }
    }
  }, []);

  const checkForNewInsights = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/insights/${userId}/check-new`);
      const { hasNew, lastUpdated: updatedDate } = response.data;
      setHasNewInsights(hasNew);
      if (updatedDate) {
        setLastUpdated(new Date(updatedDate));
      }
      setIsVisible(hasNew);
    } catch (error) {
      console.error('Error checking for new insights:', error);
      setHasNewInsights(false);
      setIsVisible(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      checkForNewInsights();
    }
  }, [userId, checkForNewInsights]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !hasNewInsights || !isVisible) {
    return null;
  }

  return (
    <Fade in={isVisible} timeout={400}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <NotificationButton
          component={Link}
          to="/dashboard/insights"
          variant="contained"
          color="info"
          startIcon={<TrendingUp />}
          endIcon={<ArrowForward />}
          sx={{ flex: 1, justifyContent: 'flex-start', position: 'relative' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'inherit', mr: 1 }}>
              New Business Insights Available!
            </Typography>
            <Chip 
              label="NEW" 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.95)',
                color: 'info.main',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                ml: 1
              }} 
            />
            <Typography variant="caption" sx={{ opacity: 0.8, ml: 2 }}>
              {lastUpdated && `Updated ${formatDate(lastUpdated)}`}
            </Typography>
          </Box>
        </NotificationButton>
        <IconButton
          onClick={handleDismiss}
          size="small"
          sx={{ ml: 1, color: 'info.main', background: 'white', '&:hover': { background: '#f0f0f0' } }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
    </Fade>
  );
};

export default InsightsNotificationBox; 