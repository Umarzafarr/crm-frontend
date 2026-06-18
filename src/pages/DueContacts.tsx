import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Person as PersonIcon,
  MoreHoriz as OtherIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { contactService } from '../services/contact.service';
import { formatDate, formatContactCategory, formatPhoneNumber } from '../utils/format';
import { Contact, CustomCategory } from '../types';
import { customCategoryService } from '../services/customCategory.service';
import { getContrastText, resolveContactCategoryColor, resolveContactCategoryName } from '../utils/categoryColors';
import ContactInteractionLog from '../components/contacts/ContactInteractionLog';

// Function to get category priority for sorting
const getCategoryPriority = (category: string): number => {
  switch (category) {
    case 'HOTLIST': return 1;
    case 'A_LIST': return 2;
    case 'B_LIST': return 3;
    case 'C_LIST': return 4;
    default: return 5;
  }
};

const DueContacts: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [dueContacts, setDueContacts] = useState<Contact[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [interactionModalOpen, setInteractionModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await customCategoryService.getCustomCategories();
        setCustomCategories(categories);
      } catch (error) {
        console.error('Failed to load custom categories:', error);
      }
    };

    const fetchDueContacts = async () => {
      setLoading(true);
      try {
        const result = await contactService.getDueContacts();

        // Sort contacts by priority category
        const sortedContacts = [...result.contacts].sort((a, b) => {
          return getCategoryPriority(a.category) - getCategoryPriority(b.category);
        });

        setDueContacts(sortedContacts);
      } catch (error) {
        console.error('Failed to fetch due contacts:', error);
        setError('Failed to load contacts due for follow-up. Please try again.');
        setDueContacts([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
    fetchDueContacts();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContactClick = (contact: Contact) => {
    navigate(`/contacts/${contact.id}`);
  };

  const handleOpenInteraction = (contact: Contact) => {
    setSelectedContact(contact);
    setInteractionModalOpen(true);
  };

  const handleInteractionLogged = () => {
    setInteractionModalOpen(false);
    setSelectedContact(null);

    // Refresh the list of due contacts
    const fetchDueContacts = async () => {
      try {
        const result = await contactService.getDueContacts();

        // Sort contacts by priority category
        const sortedContacts = [...result.contacts].sort((a, b) => {
          return getCategoryPriority(a.category) - getCategoryPriority(b.category);
        });

        setDueContacts(sortedContacts);
      } catch (error) {
        console.error('Failed to refresh due contacts:', error);
      }
    };

    fetchDueContacts();
  };

  // Render a contact card for mobile view
  const renderContactCard = (contact: Contact) => (
    <Card key={contact.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" component="div">
              {contact.fullName}
            </Typography>
            <Chip
              label={resolveContactCategoryName(contact, customCategories)}
              size="small"
              sx={{
                bgcolor: resolveContactCategoryColor(contact, customCategories),
                color: getContrastText(resolveContactCategoryColor(contact, customCategories)),
                fontWeight: 500,
                mt: 0.5
              }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleContactClick(contact)}
          >
            View
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Last contacted: {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
        </Typography>

        {contact.phone && (
          <Typography variant="body2" color="text.secondary">
            <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {formatPhoneNumber(contact.phone)}
          </Typography>
        )}

        {contact.email && (
          <Typography variant="body2" color="text.secondary">
            <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {contact.email}
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" sx={{ mb: 1 }}>Log Interaction:</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenInteraction(contact)}
            sx={{ border: 1, borderColor: 'primary.main' }}
          >
            <PhoneIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="secondary"
            onClick={() => handleOpenInteraction(contact)}
            sx={{ border: 1, borderColor: 'secondary.main' }}
          >
            <EmailIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            onClick={() => handleOpenInteraction(contact)}
            sx={{ border: 1, borderColor: 'success.main' }}
          >
            <SmsIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            onClick={() => handleOpenInteraction(contact)}
            sx={{ border: 1, borderColor: 'info.main' }}
          >
            <PersonIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Contacts Due Today</Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : dueContacts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No contacts are due for follow-up today. Great job staying on top of your outreach!
        </Alert>
      ) : (
        <>
          {isMobile ? (
            // Mobile view: cards
            <Box>
              {dueContacts.map(contact => renderContactCard(contact))}
            </Box>
          ) : (
            // Desktop view: table
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Last Contacted</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dueContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        hover
                        onClick={() => handleContactClick(contact)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{contact.fullName}</TableCell>
                        <TableCell>
                           <Chip
                             label={resolveContactCategoryName(contact, customCategories)}
                             size="small"
                             sx={{
                               bgcolor: resolveContactCategoryColor(contact, customCategories),
                               color: getContrastText(resolveContactCategoryColor(contact, customCategories)),
                               fontWeight: 500,
                             }}
                           />
                        </TableCell>
                        <TableCell>{formatPhoneNumber(contact.phone)}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>
                          {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            display="flex"
                            justifyContent="center"
                            gap={1}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenInteraction(contact)}
                              sx={{ border: 1, borderColor: 'primary.main' }}
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenInteraction(contact)}
                              sx={{ border: 1, borderColor: 'secondary.main' }}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenInteraction(contact)}
                              sx={{ border: 1, borderColor: 'success.main' }}
                            >
                              <SmsIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenInteraction(contact)}
                              sx={{ border: 1, borderColor: 'info.main' }}
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* Interaction Modal */}
      {selectedContact && (
        <Dialog
          open={interactionModalOpen}
          onClose={() => setInteractionModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Log Interaction with {selectedContact.fullName}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <ContactInteractionLog
              contactId={selectedContact.id}
              contactCategory={selectedContact.category}
              onInteractionLogged={handleInteractionLogged}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default DueContacts; 