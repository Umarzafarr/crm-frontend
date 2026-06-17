import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardHeader,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { formatRelativeDate } from '../utils/format';
import { reminderService } from '../services/reminder.service';
import { Reminder } from '../types';
import api from '../services/api';
import { contactService } from '../services/contact.service';

const ReminderTabs = {
  ALL: 0,
  TODAY: 1,
  COMPLETED: 2,
  PENDING: 3,
};

const Reminders: React.FC = () => {
  // State for reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for summary
  const [summary, setSummary] = useState({
    completed: 0,
    pending: 0,
    total: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState(ReminderTabs.TODAY);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  // Add state for goal progress
  const [goalProgress, setGoalProgress] = useState<{
    dailyGoal: number;
    contacted: number;
    remaining: number;
    dueToday: number;
  }>({
    dailyGoal: 0,
    contacted: 0,
    remaining: 0,
    dueToday: 0
  });
  const [goalLoading, setGoalLoading] = useState(true);

  // Fetch reminders
  const fetchReminders = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetchedReminders: Reminder[] = [];

      switch (activeTab) {
        case ReminderTabs.TODAY:
          fetchedReminders = await reminderService.getDailyReminders() || [];
          break;
        case ReminderTabs.COMPLETED:
          const completedResult = await reminderService.getReminders({ completed: true });
          fetchedReminders = completedResult?.reminders || [];
          break;
        case ReminderTabs.PENDING:
          const pendingResult = await reminderService.getReminders({ completed: false });
          fetchedReminders = pendingResult?.reminders || [];
          break;
        case ReminderTabs.ALL:
        default:
          const allResult = await reminderService.getReminders();
          fetchedReminders = allResult?.reminders || [];
          break;
      }

      console.log('Fetched reminders:', fetchedReminders);
      setReminders(fetchedReminders);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      setError('Failed to load reminders. Please try again.');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reminder summary
  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const summaryResult = await reminderService.getReminderSummary();
      setSummary(summaryResult || { completed: 0, pending: 0, total: 0 });
    } catch (error) {
      console.error('Failed to fetch reminder summary:', error);
      // Ensure we set default values on error
      setSummary({ completed: 0, pending: 0, total: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch goal progress
  const fetchGoalProgress = async () => {
    setGoalLoading(true);
    try {
      console.log('Fetching data for notification preview');

      // Get due contacts using the same service as the dashboard
      const dueContactsResult = await contactService.getDueContacts();
      console.log('Due contacts result from service:', dueContactsResult);

      // Get goal progress using the service
      const goalProgressResult = await reminderService.getGoalProgress();
      console.log('Goal progress result from service:', goalProgressResult);

      // Set the state using the service results
      setGoalProgress({
        dailyGoal: goalProgressResult?.dailyGoal || 0,
        contacted: goalProgressResult?.contacted || 0,
        remaining: goalProgressResult?.remaining || 0,
        dueToday: dueContactsResult?.total || 0  // Use due contacts total
      });

      console.log('Updated goal progress state:', {
        dailyGoal: goalProgressResult?.dailyGoal || 0,
        contacted: goalProgressResult?.contacted || 0,
        remaining: goalProgressResult?.remaining || 0,
        dueToday: dueContactsResult?.total || 0
      });
    } catch (error) {
      console.error('Failed to fetch goal progress:', error);
      // Don't update the state on error to preserve any existing values
    } finally {
      setGoalLoading(false);
    }
  };

  // Load reminders, summary, and goal progress on initial render and when tab changes
  useEffect(() => {
    fetchReminders();
    fetchSummary();
  }, [activeTab]);

  // Separate effect for goal progress to ensure consistent updates
  useEffect(() => {
    fetchGoalProgress();

    // Set up a refresh interval every 30 seconds
    const intervalId = setInterval(fetchGoalProgress, 30 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle reminder completion toggle with improved error handling
  const handleToggleComplete = async (reminder: Reminder) => {
    if (!reminder || reminder.id === undefined) {
      console.error('Invalid reminder object');
      return;
    }

    try {
      if (!reminder.completed) {
        await reminderService.completeReminder(reminder.id);
      } else {
        // If you want to allow uncompleting, you'd need a backend endpoint for this
        await reminderService.updateReminder(reminder.id, { completed: false });
      }

      // Update local state to reflect change
      setReminders(reminders.map(r =>
        r.id === reminder.id ? { ...r, completed: !r.completed } : r
      ));

      // Refetch summary to update counts
      fetchSummary();
    } catch (error) {
      console.error('Failed to update reminder completion status:', error);
      setError('Failed to update reminder. Please try again.');
    }
  };

  // Form dialog handlers
  const handleFormOpen = (reminder: Reminder | null = null) => {
    setCurrentReminder(reminder);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setCurrentReminder(null);
  };

  const handleFormSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      console.log("Submitting reminder:", values);

      // Ensure time is properly formatted
      const reminderData = {
        ...values,
        time: values.time instanceof Date ? values.time.toISOString() : new Date(values.time).toISOString(),
      };

      console.log("Formatted reminder data:", reminderData);

      if (currentReminder) {
        // Update existing reminder
        const updatedReminder = await reminderService.updateReminder(currentReminder.id, reminderData);
        console.log("Updated reminder:", updatedReminder);
      } else {
        // Create new reminder
        const newReminder = await reminderService.createReminder(reminderData);
        console.log("Created reminder:", newReminder);
      }

      // Refresh data
      fetchReminders();
      fetchSummary();
      handleFormClose();
    } catch (error) {
      console.error('Failed to save reminder:', error);
      setError('Failed to save reminder. Please try again.');
      setSubmitting(false);
    }
  };

  // Delete dialog handlers with improved error handling
  const handleDeleteDialogOpen = (reminder: Reminder) => {
    if (!reminder) {
      console.error('Attempted to delete undefined reminder');
      return;
    }
    setReminderToDelete(reminder);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setReminderToDelete(null);
  };

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return;

    try {
      await reminderService.deleteReminder(reminderToDelete.id);

      // Refresh data
      fetchReminders();
      fetchSummary();
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      setError('Failed to delete reminder. Please try again.');
    }
  };

  // Reminder form using Formik with safer defaults
  const ReminderForm = () => {
    const initialValues = {
      message: currentReminder?.message || '',
      time: currentReminder?.time ? new Date(currentReminder.time) : new Date(),
      sentViaText: Boolean(currentReminder?.sentViaText),
      sentViaEmail: Boolean(currentReminder?.sentViaEmail),
    };

    const validationSchema = Yup.object({
      message: Yup.string().required('Message is required'),
      time: Yup.date().required('Time is required'),
    });

    const formik = useFormik({
      initialValues,
      validationSchema,
      onSubmit: handleFormSubmit,
    });

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="message"
                  name="message"
                  label="Reminder Message"
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.message && Boolean(formik.errors.message)}
                  helperText={formik.touched.message && formik.errors.message}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <DateTimePicker
                  label="Reminder Time"
                  value={formik.values.time}
                  onChange={(newValue) => {
                    formik.setFieldValue('time', newValue);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.time && Boolean(formik.errors.time),
                      helperText: formik.touched.time && formik.errors.time as string,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.sentViaText}
                      onChange={formik.handleChange}
                      name="sentViaText"
                      color="primary"
                    />
                  }
                  label="Send via text message"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.sentViaEmail}
                      onChange={formik.handleChange}
                      name="sentViaEmail"
                      color="primary"
                    />
                  }
                  label="Send via email"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleFormClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ?
                <CircularProgress size={24} /> :
                currentReminder ? 'Update Reminder' : 'Add Reminder'
              }
            </Button>
          </DialogActions>
        </form>
      </LocalizationProvider>
    );
  };

  // Notification preview component
  const NotificationPreview = () => {
    console.log("GoalProgress:", goalProgress)
    const morningMessage = `You need to reach out to ${goalProgress?.dueToday || 0} people today`;
    const afternoonMessage = `You have ${goalProgress?.dueToday || 0} people left to reach out to today`;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom>
            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Daily Notification Preview
          </Typography>
          <Button
            size="small"
            onClick={fetchGoalProgress}
            disabled={goalLoading}
          >
            Refresh Data
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          These are the automated notifications you will receive each day based on your follow-up dates.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Morning Reminder (10:00 AM CST)" />
              <CardContent>
                {goalLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="body1" fontWeight="medium">
                    {morningMessage}
                  </Typography>
                )}
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Delivery methods:
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    <Chip icon={<EmailIcon />} label="Email" size="small" />
                    <Chip icon={<SmsIcon />} label="SMS" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Afternoon Reminder (3:00 PM CST)" />
              <CardContent>
                {goalLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="body1" fontWeight="medium">
                    {afternoonMessage}
                  </Typography>
                )}
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Delivery methods:
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    <Chip icon={<EmailIcon />} label="Email" size="small" />
                    <Chip icon={<SmsIcon />} label="SMS" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reminders</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleFormOpen()}
        >
          Add Reminder
        </Button>
      </Box>

      {/* Notification Preview Section */}
      <NotificationPreview />

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Reminders
              </Typography>
              <Typography variant="h4">
                {summaryLoading ? <CircularProgress size={24} /> : (summary?.total || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {summaryLoading ? <CircularProgress size={24} /> : (summary?.completed || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summaryLoading ? <CircularProgress size={24} /> : (summary?.pending || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Reminders" />
          <Tab label="Today" />
          <Tab label="Completed" />
          <Tab label="Pending" />
        </Tabs>
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading spinner */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Reminders list with improved error handling */}
      {!loading && (!reminders || reminders.length === 0) ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No reminders found for the selected filter.
        </Alert>
      ) : !loading && reminders && (
        <Paper>
          <List>
            {reminders.map((reminder) => {
              // Ensure reminder is valid
              if (!reminder) return null;

              // Parse date strings if needed
              const reminderTime = reminder.time instanceof Date
                ? reminder.time
                : new Date(reminder.time);

              return (
                <React.Fragment key={reminder.id || 'temp-key'}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleToggleComplete(reminder)}
                          color={reminder.completed ? 'success' : 'default'}
                        >
                          {reminder.completed ? <CheckIcon /> : <UncheckedIcon />}
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleFormOpen(reminder)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteDialogOpen(reminder)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                    sx={{
                      opacity: reminder.completed ? 0.6 : 1,
                      textDecoration: reminder.completed ? 'line-through' : 'none',
                    }}
                  >
                    <ListItemText
                      primary={reminder.message || 'No message'}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {reminderTime ? formatRelativeDate(reminderTime) : 'No date'}
                          </Typography>
                          {reminder.sentViaText && ' • Text'}
                          {reminder.sentViaEmail && ' • Email'}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Reminder form dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentReminder ? 'Edit Reminder' : 'Add New Reminder'}
        </DialogTitle>
        <ReminderForm />
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this reminder? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            onClick={handleDeleteReminder}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reminders; 