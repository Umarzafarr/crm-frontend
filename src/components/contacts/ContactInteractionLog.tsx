import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Person as PersonIcon,
  MoreHoriz as OtherIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { contactService } from '../../services/contact.service';
import { userService } from '../../services/user.service';
import { format, addDays } from 'date-fns';
import { Contact, FollowupSettings, InteractionType } from '../../types';

interface ContactInteractionLogProps {
  contactId: number;
  contactCategory: string;
  onInteractionLogged: () => void;
}

interface InteractionFormValues {
  type: InteractionType;
  notes: string;
}

const ContactInteractionLog: React.FC<ContactInteractionLogProps> = ({
  contactId,
  contactCategory,
  onInteractionLogged
}) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextContactDate, setNextContactDate] = useState<Date | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [followupSettings, setFollowupSettings] = useState<FollowupSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Load followup settings when component mounts
  useEffect(() => {
    const loadFollowupSettings = async () => {
      setLoadingSettings(true);
      try {
        const settings = await userService.getFollowupSettings();
        setFollowupSettings(settings);
      } catch (error) {
        console.error('Failed to load followup settings:', error);
        // Fallback to default values
        setFollowupSettings({
          followupHotlist: 30,
          followupAList: 60,
          followupBList: 90,
          followupCList: 120,
          followupDList: 150,
          followupStandard: 180,
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadFollowupSettings();
  }, []);

  const getFollowupDays = (): number => {
    if (!followupSettings) return 180; // fallback
    switch (contactCategory) {
      case 'HOTLIST':
        return followupSettings.followupHotlist;
      case 'A_LIST':
        return followupSettings.followupAList;
      case 'B_LIST':
        return followupSettings.followupBList;
      case 'C_LIST':
        return followupSettings.followupCList;
      default:
        return followupSettings.followupStandard;
    }
  };

  const handleOpen = (interactionType: InteractionType) => {
    formik.setFieldValue('type', interactionType);

    // Calculate the next contact date based on user's custom settings
    const followupDays = getFollowupDays();
    const calculatedNextDate = addDays(new Date(), followupDays);
    setNextContactDate(calculatedNextDate);

    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const formik = useFormik<InteractionFormValues>({
    initialValues: {
      type: 'CALL',
      notes: '',
    },
    validationSchema: Yup.object({
      type: Yup.string().required('Interaction type is required'),
      notes: Yup.string().max(500, 'Notes cannot exceed 500 characters'),
      useCustomDate: Yup.boolean(),
      customNextContactDate: Yup.date().nullable().when(['useCustomDate'], (useCustomDate, schema) => {
        return useCustomDate[0]
          ? schema.required('Custom date is required when using custom scheduling')
          : schema;
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError(null);
      try {
        // Log the interaction and update the lastContacted date
        // The backend will automatically set the nextContactDate based on the contact's category
        const updatedContact = await contactService.logContactInteraction(contactId, {
          type: values.type,
          notes: values.notes,
        });

        setContact(updatedContact);

        // Close the dialog and notify parent component
        resetForm();
        handleClose();
        onInteractionLogged();
      } catch (error) {
        console.error('Failed to log interaction:', error);
        setError(error instanceof Error ? error.message : 'Failed to log interaction');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'CALL':
        return <PhoneIcon />;
      case 'EMAIL':
        return <EmailIcon />;
      case 'TEXT':
        return <SmsIcon />;
      case 'IN_PERSON':
        return <PersonIcon />;
      case 'OTHER':
        return <OtherIcon />;
      case 'NOTE':
        return <OtherIcon />;
      default:
        return null;
    }
  };

  const getInteractionButtonColor = (type: InteractionType) => {
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
        return 'inherit';
      case 'NOTE':
        return 'inherit';
      default:
        return 'primary';
    }
  };

  const getInteractionLabel = (type: InteractionType) => {
    switch (type) {
      case 'CALL':
        return 'Call';
      case 'EMAIL':
        return 'Email';
      case 'TEXT':
        return 'Text';
      case 'IN_PERSON':
        return 'In Person';
      case 'OTHER':
        return 'Other';
      case 'NOTE':
        return 'Note';
      default:
        return type;
    }
  };

  return (
    <>
      <Box display="flex" gap={1} flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          startIcon={<PhoneIcon />}
          onClick={() => handleOpen('CALL')}
        >
          Log Call
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<EmailIcon />}
          onClick={() => handleOpen('EMAIL')}
        >
          Log Email
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SmsIcon />}
          onClick={() => handleOpen('TEXT')}
        >
          Log Text
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<PersonIcon />}
          onClick={() => handleOpen('IN_PERSON')}
        >
          In Person
        </Button>
        <Button
          variant="outlined"
          startIcon={<OtherIcon />}
          onClick={() => handleOpen('OTHER')}
        >
          Other
        </Button>
        {/* <Button 
          variant="outlined" 
          startIcon={<OtherIcon />}
          onClick={() => handleOpen('NOTE')}
          sx={{ marginLeft: 'auto' }} // Pushes the button to the right
        >
          Note
        </Button> */}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              {getInteractionIcon(formik.values.type)}
              <Typography>
                Log {getInteractionLabel(formik.values.type)} Interaction
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel id="interaction-type-label">Interaction Type</InputLabel>
              <Select
                labelId="interaction-type-label"
                id="type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                label="Interaction Type"
                disabled
              >
                <MenuItem value="CALL">Call</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="TEXT">Text</MenuItem>
                <MenuItem value="IN_PERSON">In Person</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
                {/* <MenuItem value="NOTE">Note</MenuItem> */}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              id="notes"
              name="notes"
              label="Notes"
              multiline
              rows={4}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={formik.touched.notes && formik.errors.notes}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon color="info" />
                <Typography variant="body2">
                  Logging this interaction will mark this contact as contacted today and update their follow-up schedule.
                </Typography>
              </Stack>

              {nextContactDate && (
                <Box mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    Based on their <strong>{contactCategory.replace('_', ' ')}</strong> category,
                    the next follow-up will be scheduled for:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" mt={0.5}>
                    {format(nextContactDate, 'MMMM d, yyyy')}
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({getFollowupDays()} days from today)
                    </Typography>
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color={getInteractionButtonColor(formik.values.type)}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                'Save'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ContactInteractionLog; 
