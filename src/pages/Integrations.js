import React, { useEffect, useState } from 'react';
import { Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import api from '../services/api';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/integrations'); // Adjust the endpoint as necessary
        setIntegrations(response.data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Paper>
      <Typography variant="h4">Integrations</Typography>
      <List>
        {integrations.map((integration) => (
          <ListItem key={integration.id}>
            <ListItemText primary={integration.name} secondary={integration.description} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
