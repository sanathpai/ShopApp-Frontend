import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Badge,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  NotificationsActive,
  Refresh,
  InfoOutlined,
  LightbulbOutlined,
  Analytics,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axiosInstance from '../AxiosInstance';
import { jwtDecode } from 'jwt-decode';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const InsightCard = styled(Card)(({ theme, variant }) => ({
  height: '100%',
  background: variant === 'primary' 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
    : variant === 'secondary'
    ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
    : variant === 'success'
    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
    : variant === 'warning'
    ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
    : `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
  color: theme.palette.common.white,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[12],
  },
}));

const ViewInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewInsights, setHasNewInsights] = useState(false);
  const [lastViewed, setLastViewed] = useState(null);
  const [userId, setUserId] = useState(null);

  // Extract userId from JWT token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded); // Debug log
        setUserId(decoded.id || decoded.userId || decoded.user_id); // Try different possible keys
      } catch (error) {
        console.error('Invalid token:', error);
        setError('Authentication error. Please log in again.');
      }
    } else {
      setError('No authentication token found. Please log in.');
    }
  }, []);

  // Fetch insights when userId is available
  useEffect(() => {
    if (userId) {
      fetchInsights();
      checkForNewInsights();
    }
  }, [userId]);

  const fetchInsights = async () => {
    if (!userId) {
      setError('User ID not available. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching insights for userId:', userId); // Debug log
      const response = await axiosInstance.get(`/insights/${userId}`);
      setInsights(response.data);
      
      // Mark insights as viewed
      await axiosInstance.post(`/insights/${userId}/mark-viewed`);
      setHasNewInsights(false);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError('Failed to load insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewInsights = async () => {
    if (!userId) return;

    try {
      console.log('Checking new insights for userId:', userId); // Debug log
      const response = await axiosInstance.get(`/insights/${userId}/check-new`);
      setHasNewInsights(response.data.hasNew);
      
      if (response.data.lastViewed) {
        setLastViewed(new Date(response.data.lastViewed));
      }
    } catch (error) {
      console.error('Error checking for new insights:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInsightIcon = (index) => {
    const icons = [TrendingUp, Assessment, Timeline, LightbulbOutlined, Analytics];
    const Icon = icons[index % icons.length];
    return <Icon />;
  };

  const getCardVariant = (index) => {
    const variants = ['primary', 'secondary', 'info', 'success', 'warning'];
    return variants[index % variants.length];
  };

  // Convert insights object to array format for rendering
  const getInsightsArray = () => {
    if (!insights) return [];
    
    const insightsArray = [];
    for (let i = 1; i <= 5; i++) {
      const insightText = insights[`insight${i}`];
      if (insightText && insightText.trim()) {
        insightsArray.push({
          id: i,
          text: insightText,
          title: `Business Insight ${i}`,
          updated_at: insights.last_updated,
          version: insights.version_number,
          isNew: hasNewInsights
        });
      }
    }
    return insightsArray;
  };

  const insightsArray = getInsightsArray();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Business Insights
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading your business insights...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Debug Section - Remove this after backend is implemented */}
      {/* <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Debug Information
        </Typography>
        <Typography variant="body2">
          <strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Extracted User ID:</strong> {userId || 'Not found'}
        </Typography>
        <Typography variant="body2">
          <strong>Status:</strong> {error ? 'Error' : 'OK'}
        </Typography>
        {error && (
          <Typography variant="body2" color="error">
            <strong>Error:</strong> {error}
          </Typography>
        )}
      </Paper> */}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <Badge badgeContent={hasNewInsights ? 'New' : 0} color="error">
              Business Insights
            </Badge>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {/* AI-powered insights to help grow your business */}
          </Typography>
          {insights && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Version {insights.version_number} • Last updated: {formatDate(insights.last_updated)}
            </Typography>
          )}
        </Box>
        <Box>
          <Tooltip title="Refresh insights">
            <IconButton onClick={fetchInsights} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* New Insights Alert */}
      {hasNewInsights && (
        <Alert 
          severity="info" 
          icon={<NotificationsActive />}
          sx={{ mb: 3 }}
        >
          New insights are available since your last visit
          {lastViewed && ` on ${formatDate(lastViewed)}`}
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && insightsArray.length === 0 && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No insights available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your professor will update insights remotely. Check back later!
          </Typography>
        </Paper>
      )}

      {/* Insights Grid */}
      {insightsArray.length > 0 && (
        <Grid container spacing={3}>
          {insightsArray.map((insight, index) => (
            <Grid item xs={12} md={6} lg={4} key={insight.id}>
              <InsightCard variant={getCardVariant(index)}>
                <CardHeader
                  avatar={getInsightIcon(index)}
                  title={
                    <Typography variant="h6" component="div">
                      {insight.title}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Version {insight.version}
                    </Typography>
                  }
                  action={
                    insight.isNew && (
                      <Chip 
                        label="New" 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }} 
                      />
                    )
                  }
                />
                <CardContent>
                  <Typography variant="body2">
                    {insight.text}
                  </Typography>
                </CardContent>
              </InsightCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary Cards */}
      {insightsArray.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Insights Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {insightsArray.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Insights
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {insights?.version_number || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Version
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {hasNewInsights ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updates Available
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            {/* <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    100%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Relevance Score
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid> */}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ViewInsights; 