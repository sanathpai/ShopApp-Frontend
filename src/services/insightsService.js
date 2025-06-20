import axiosInstance from '../AxiosInstance';

class InsightsService {
  // Fetch insights for a specific user
  async fetchInsights(userId) {
    try {
      const response = await axiosInstance.get(`/insights/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      // If it's a 404, the backend API doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Insights API not implemented yet. Backend setup required.');
        return null;
      }
      throw error;
    }
  }

  // Check if there are new insights since last viewed
  async hasNewInsights(userId) {
    try {
      const response = await axiosInstance.get(`/insights/${userId}/check-new`);
      return response.data.hasNew;
    } catch (error) {
      console.error('Error checking for new insights:', error);
      // If it's a 404, the backend API doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Insights check-new API not implemented yet. Backend setup required.');
        return false;
      }
      return false;
    }
  }

  // Mark insights as viewed (updates UserInsightViews table)
  async markAsViewed(userId) {
    try {
      await axiosInstance.post(`/insights/${userId}/mark-viewed`);
    } catch (error) {
      console.error('Error marking insights as viewed:', error);
      // If it's a 404, the backend API doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('Insights mark-viewed API not implemented yet. Backend setup required.');
      }
    }
  }

  // Get notification badge count
  async getNotificationCount(userId) {
    try {
      const hasNew = await this.hasNewInsights(userId);
      return hasNew ? 1 : 0;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  // Create or update insights 
  async createOrUpdateInsights(insightData) {
    try {
      const response = await axiosInstance.post('/insights', insightData);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating insights:', error);
      if (error.response?.status === 404) {
        console.warn('Insights create API not implemented yet. Backend setup required.');
      }
      throw error;
    }
  }

  // Subscribe to insight notifications (for real-time updates)
  subscribeToUpdates(userId, callback) {
    // This uses polling to check for new insights
    const interval = setInterval(async () => {
      try {
        const hasNew = await this.hasNewInsights(userId);
        if (hasNew) {
          callback({ hasNewInsights: true });
        }
      } catch (error) {
        // Silently fail during polling to avoid console spam
        // console.error('Error checking for updates:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }

  // Get insights statistics for dashboard
  async getInsightsStats(userId) {
    try {
      const response = await axiosInstance.get(`/insights/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insights stats:', error);
      if (error.response?.status === 404) {
        console.warn('Insights stats API not implemented yet. Backend setup required.');
      }
      return null;
    }
  }
}

export default new InsightsService(); 