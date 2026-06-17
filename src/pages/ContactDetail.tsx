import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Notes as NotesIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { contactService } from '../services/contact.service';
import { formatDate, formatContactCategory, formatPhoneNumber } from '../utils/format';
import { getCategoryColor, getContrastText } from '../utils/categoryColors';
import { Contact, CustomCategory } from '../types';
import ContactForm from '../components/contacts/ContactForm';
import ContactInteractionLog from '../components/contacts/ContactInteractionLog';
import ContactInteractionHistory from '../components/contacts/ContactInteractionHistory';
import api from '../services/api';
import { customCategoryService } from '../services/customCategory.service';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for contact
  const [contact, setContact] = useState<Contact | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // State for interaction refresh trigger
  const [interactionRefreshTrigger, setInteractionRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await customCategoryService.getCustomCategories();
        setCustomCategories(categories);
      } catch (error) {
        console.error('Failed to load custom categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Fetch contact data
  useEffect(() => {
    const fetchContact = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching contact with ID:', id);
        const contactId = parseInt(id);

        // Direct API call with axios instead of using the service
        const response = await api.get(`/contacts/${contactId}`);
        console.log('API response for contact:', response.data);

        if (response.data && response.data.id) {
          // If the response contains a contact directly
          setContact(response.data);
        } else if (response.data && response.data.data && response.data.data.id) {
          // If the response is wrapped in a data property
          setContact(response.data.data);
        } else {
          throw new Error('Invalid contact data received');
        }
      } catch (error) {
        console.error('Failed to fetch contact:', error);
        setError('Failed to load contact. Please try again.');
        setContact(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  // Handle form open/close
  const handleFormOpen = () => {
    setFormOpen(true);
  };

  const handleFormClose = (refreshData: boolean = false) => {
    setFormOpen(false);

    if (refreshData && id) {
      // Reload contact data after update
      const fetchContact = async () => {
        try {
          const contactId = parseInt(id);
          const response = await api.get(`/contacts/${contactId}`);
          if (response.data && response.data.id) {
            setContact(response.data);
          } else if (response.data && response.data.data && response.data.data.id) {
            setContact(response.data.data);
          }
        } catch (error) {
          console.error('Failed to refresh contact:', error);
        } finally {
          setInteractionRefreshTrigger(prev => prev + 1);
        }
      };

      fetchContact();
    }
  };

  // Handle delete dialog
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!contact) return;

    try {
      await api.delete(`/contacts/${contact.id}`);
      navigate('/contacts');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setError('Failed to delete contact. Please try again.');
      handleDeleteDialogClose();
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate('/contacts');
  };


  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${Number(price).toLocaleString()}`;
  };

  const getContactCustomCategory = () => {
    if (!contact) return undefined;
    return contact.customCategory || customCategories.find((category) => category.id === Number(contact.customCategoryId));
  };

  const getCategoryName = () => {
    const category = getContactCustomCategory();
    return category?.name || (contact ? formatContactCategory(contact.category) : '');
  };

  const getCurrentCategoryColor = () => {
    const category = getContactCustomCategory();
    return getCategoryColor(category?.color || contact?.category);
  };

  const getTags = () => contact?.tags?.map((contactTag) => contactTag.tag).filter(Boolean) || [];

  // Handle updating last contacted date
  const handleUpdateLastContacted = async () => {
    if (!contact) return;

    try {
      await api.patch(`/contacts/${contact.id}`, { lastContacted: new Date() });
      // Reload contact data
      const response = await api.get(`/contacts/${contact.id}`);
      if (response.data && response.data.id) {
        setContact(response.data);
      } else if (response.data && response.data.data && response.data.data.id) {
        setContact(response.data.data);
      }
    } catch (error) {
      console.error('Failed to update last contacted date:', error);
      setError('Failed to update contact. Please try again.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error || !contact) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Contacts
        </Button>
        <Alert severity="error">
          {error || 'Contact not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Contacts
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<NotificationsIcon />}
            sx={{ mr: 1 }}
          >
            Add Reminder
          </Button>
          <IconButton
            color="primary"
            onClick={handleFormOpen}
            sx={{ mr: 1 }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={handleDeleteDialogOpen}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4">{contact.fullName}</Typography>
            {contact.jobTitle && contact.company && (
              <Typography variant="subtitle1" color="text.secondary">
                {contact.jobTitle} at {contact.company}
              </Typography>
            )}
          </Box>
          <Chip
            label={getCategoryName()}
            sx={{
              bgcolor: getCurrentCategoryColor(),
              color: getContrastText(getCurrentCategoryColor()),
              fontWeight: 500,
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Last contacted: {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
          {contact.nextContactDate && (
            <>
              <br />
              Next follow-up: {formatDate(contact.nextContactDate)}
            </>
          )}
        </Typography>
        <Typography variant="h3" color="text.secondary" mb={2} mt={2}>
          Notes
        </Typography>
        <Box mb={3}>
          <ContactInteractionLog
            contactId={contact.id}
            contactCategory={contact.category}
            onInteractionLogged={() => {
              // Reload contact data to get updated lastContacted date
              const fetchContact = async () => {
                try {
                  const response = await api.get(`/contacts/${contact.id}`);
                  if (response.data && response.data.id) {
                    setContact(response.data);
                  } else if (response.data && response.data.data && response.data.data.id) {
                    setContact(response.data.data);
                  }
                } catch (error) {
                  console.error('Failed to refresh contact:', error);
                }
              };

              fetchContact();
              // Trigger refresh of interaction history
              setInteractionRefreshTrigger(prev => prev + 1);
            }}
          />
        </Box>


        <Box mb={3}>
          <ContactInteractionHistory
            contactId={contact.id}
            title='Log History'
            interactionType='NOTE'
            except={true}
            refreshTrigger={interactionRefreshTrigger}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>

                {contact.phone && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <PhoneIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <Typography component="span" fontWeight="bold">Phone: </Typography>
                      {formatPhoneNumber(contact.phone)}
                    </Typography>
                  </Box>
                )}

                {contact.email && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <EmailIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <Typography component="span" fontWeight="bold">Email: </Typography>
                      {contact.email}
                    </Typography>
                  </Box>
                )}

                {contact.address && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <HomeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <Typography component="span" fontWeight="bold">Address: </Typography>
                      {contact.address}
                    </Typography>
                  </Box>
                )}

                {contact.spouseFullName && (
                  <Box mb={2}>
                    <Typography>
                      <Typography component="span" fontWeight="bold">Spouse: </Typography>
                      {contact.spouseFullName}
                    </Typography>

                    {contact.spouseEmail && (
                      <Box display="flex" alignItems="center" mt={1} ml={2}>
                        <EmailIcon color="secondary" sx={{ mr: 1, fontSize: '1rem' }} />
                        <Typography variant="body2">
                          {contact.spouseEmail}
                        </Typography>
                      </Box>
                    )}

                    {contact.spousePhone && (
                      <Box display="flex" alignItems="center" mt={1} ml={2}>
                        <PhoneIcon color="secondary" sx={{ mr: 1, fontSize: '1rem' }} />
                        <Typography variant="body2">
                          {formatPhoneNumber(contact.spousePhone)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography>
                    <Typography component="span" fontWeight="bold">Added On: </Typography>
                    {formatDate(contact.createdAt, 'PPP')}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <Typography>
                    <Typography component="span" fontWeight="bold">Price / Budget: </Typography>
                    {formatPrice(contact.price)}
                  </Typography>
                </Box>

                {getTags().length > 0 && (
                  <Box mb={2}>
                    <Typography component="span" fontWeight="bold">Tags: </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                      {getTags().map((tag) => (
                        <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {(contact.company || contact.jobTitle) && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <BusinessIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      <Typography component="span" fontWeight="bold">Work: </Typography>
                      {contact.jobTitle} {contact.company && contact.jobTitle && 'at'} {contact.company}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {contact.notes && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <NotesIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Notes</Typography>
                  </Box>
                  <Typography variant="body1">{contact.notes}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Box mb={3} mt={3}>
          <ContactInteractionHistory
            contactId={contact.id}
            title='Notes History'
            interactionType='NOTE'
            refreshTrigger={interactionRefreshTrigger}
          />
        </Box>
      </Paper>

      {/* Contact form dialog */}
      {formOpen && (
        <ContactForm
          open={formOpen}
          contact={contact}
          onClose={handleFormClose}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {contact.fullName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteContact} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactDetail; 
