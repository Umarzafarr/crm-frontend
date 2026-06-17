import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Stack,
  Collapse,
  IconButton,
  Button,
  CardHeader,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Person as PersonIcon,
  MoreHoriz as OtherIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { contactService } from '../../services/contact.service';
import { ContactInteraction, InteractionType } from '../../types';

interface ContactInteractionHistoryProps {
  contactId: number;
  title: string;
  interactionType?: InteractionType;
  except?: boolean;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

const ContactInteractionHistory: React.FC<ContactInteractionHistoryProps> = ({
  contactId,
  title,
  interactionType,
  except,
  refreshTrigger
}) => {
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // New state for toggle

  const fetchInteractions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactService.getContactInteractions(contactId);

      // Apply filtering based on interactionType and except props
      let filteredData = data;
      if (interactionType) {
        filteredData = except
          ? data.filter((interaction) => interaction.type !== interactionType)
          : data.filter((interaction) => interaction.type === interactionType);
      }
      filteredData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setInteractions(filteredData);
    } catch (err) {
      setError('Failed to load interaction history');
      console.error('Error fetching interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when history is shown and component mounts or refreshTrigger changes
    if (showHistory) {
      fetchInteractions();
    }
  }, [contactId, refreshTrigger, showHistory]);

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
    // Reset expanded state when hiding
    if (showHistory) {
      setExpanded(false);
    }
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'CALL':
        return <PhoneIcon color="primary" />;
      case 'EMAIL':
        return <EmailIcon color="secondary" />;
      case 'TEXT':
        return <SmsIcon color="success" />;
      case 'IN_PERSON':
        return <PersonIcon color="info" />;
      case 'OTHER':
        return <OtherIcon color="action" />;
      case 'NOTE':
        return <OtherIcon color="action" />;
      default:
        return <HistoryIcon color="action" />;
    }
  };

  const getInteractionChipColor = (type: InteractionType): "primary" | "secondary" | "success" | "info" | "default" => {
    switch (type) {
      case 'CALL':
        return 'primary';
      case 'EMAIL':
        return 'secondary';
      case 'TEXT':
        return 'success';
      case 'IN_PERSON':
        return 'info';
      case 'OTHER':
        return 'default';
      case 'NOTE':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatInteractionType = (type: InteractionType) => {
    switch (type) {
      case 'IN_PERSON':
        return 'In Person';
      default:
        return type.charAt(0) + type.slice(1).toLowerCase();
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const recentInteractions = interactions.slice(0, 3);
  const hasMoreInteractions = interactions.length > 3;

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={<HistoryIcon color="primary" />}
        title={
          <Box display="flex" alignItems="center">
            <Typography variant="h6" component="span">
              {title}
            </Typography>
            {interactions.length > 0 && (
              <Chip
                label={interactions.length}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        action={
          <Box display="flex" alignItems="center">
            {showHistory && (
              <IconButton
                size="small"
                onClick={fetchInteractions}
                title="Refresh"
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={showHistory ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={handleToggleHistory}
              sx={{ ml: 1 }}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </Button>
          </Box>
        }
        sx={{ pb: 0 }}
      />

      <Collapse in={showHistory}>
        <CardContent sx={{ pt: 1 }}>
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" py={2}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Loading interaction history...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" action={
              <Button size="small" onClick={fetchInteractions} startIcon={<RefreshIcon />}>
                Retry
              </Button>
            }>
              {error}
            </Alert>
          ) : interactions.length === 0 ? (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No interactions logged yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Use the buttons above to log your first interaction
              </Typography>
            </Box>
          ) : (
            <>
              <List disablePadding>
                {recentInteractions.map((interaction, index) => (
                  <React.Fragment key={interaction.id}>
                    {index > 0 && <Divider variant="inset" component="li" />}
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getInteractionIcon(interaction.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={formatInteractionType(interaction.type)}
                              size="small"
                              color={getInteractionChipColor(interaction.type)}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Box mt={0.5}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(interaction.createdAt), 'MMM d, yyyy h:mm a')}
                            </Typography>
                            {interaction.notes && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {interaction.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>

              {hasMoreInteractions && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box textAlign="center">
                    <Button
                      size="small"
                      onClick={handleToggleExpand}
                      startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {expanded ? 'Show Less' : `Show ${interactions.length - 3} More`}
                    </Button>
                  </Box>

                  <Collapse in={expanded}>
                    <List disablePadding>
                      {interactions.slice(3).map((interaction, index) => (
                        <React.Fragment key={interaction.id}>
                          <Divider variant="inset" component="li" />
                          <ListItem disablePadding sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {getInteractionIcon(interaction.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={formatInteractionType(interaction.type)}
                                    size="small"
                                    color={getInteractionChipColor(interaction.type)}
                                    variant="outlined"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Box mt={0.5}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {format(new Date(interaction.createdAt), 'MMM d, yyyy h:mm a')}
                                  </Typography>
                                  {interaction.notes && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                      {interaction.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}
            </>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ContactInteractionHistory; 
