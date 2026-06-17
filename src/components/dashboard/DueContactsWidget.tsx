import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PeopleAlt as ContactsIcon } from '@mui/icons-material';
import { contactService } from '../../services/contact.service';

const DueContactsWidget: React.FC = () => {
  const [dueContactsCount, setDueContactsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDueContacts = async () => {
      setLoading(true);
      try {
        // This will get all contacts due today, including new ones and those with nextContactDate=today
        const result = await contactService.getDueContacts();
        setDueContactsCount(result.total || 0);
      } catch (error) {
        console.error('Failed to fetch due contacts:', error);
        setDueContactsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDueContacts();

    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchDueContacts, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleViewDueContacts = () => {
    navigate('/contacts/due');
  };

  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        backgroundColor: dueContactsCount > 0 ? 'primary.light' : 'background.paper',
        transition: 'background-color 0.3s ease',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Badge
            badgeContent={dueContactsCount > 0 ? dueContactsCount : null}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: '1.5rem', minWidth: '1.5rem' } }}
          >
            <ContactsIcon color="primary" fontSize="large" />
          </Badge>
          <Typography 
            variant="h6" 
            component="div" 
            color="text.primary" 
            sx={{ ml: 1 }}
          >
            Due For Follow-Up
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box textAlign="center" my={2}>
            <Typography variant="h3" component="div" color={dueContactsCount > 0 ? 'primary' : 'text.secondary'}>
              {dueContactsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dueContactsCount === 1 
                ? 'Contact due today' 
                : 'Contacts due today'}
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="center">
          <Button 
            variant="contained" 
            color="primary"
            disabled={dueContactsCount === 0}
            onClick={handleViewDueContacts}
            fullWidth
          >
            View Contacts
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DueContactsWidget; 