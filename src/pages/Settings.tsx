import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Divider,
  Slider,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Send as SendIcon,
  WbSunny as MorningIcon,
  Brightness3 as AfternoonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { reminderService } from '../services/reminder.service';
import CustomCategoryManager from '../components/settings/CustomCategoryManager';
import TagManager from '../components/settings/TagManager';

const Settings: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSuccess, setGoalSuccess] = useState<string | null>(null);

  // State for notifications
  const [notificationLoading, setNotificationLoading] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // State for current goal
  const [dailyGoal, setDailyGoal] = useState<number>(0);
  const [dueToday, setDueToday] = useState<number>(0);

  // Load current goal and due contacts on component mount
  useEffect(() => {
    // Fetch due contacts count
    const fetchDueContacts = async () => {
      try {
        const progress = await reminderService.getGoalProgress();
        setDueToday(progress.dueToday || 0);
      } catch (error) {
        console.error('Failed to fetch due contacts:', error);
      }
    };
    const fetchDailyGoal = async () => {
      try {
        const goal = await reminderService.getDailyGoal();
        setDailyGoal(goal.dailyGoal);
      } catch (error) {
        console.error('Failed to fetch daily goal:', error);
      }
    };

    fetchDueContacts();
    fetchDailyGoal();
  }, []);

  // Profile form using Formik
  const profileFormik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      // This would call a user update API endpoint
      console.log('Update user profile:', values);
      // Since we don't have a specific endpoint for this in the requirements,
      // we're just logging the values for now
      alert('Profile update feature would be implemented here');
    },
  });

  // Handle daily goal change
  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // allow empty string as 0 or ignore depending on desired behavior
    const parsed = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(parsed)) {
      // ignore or set an error state
      setGoalError("Please enter a valid number");
      return;
    }
    setGoalError(null);
    setDailyGoal(parsed);
  };

  // Handle daily goal save
  const handleGoalSave = async (e?: React.FormEvent) => {
    e?.preventDefault(); // prevent full page reload
    setGoalLoading(true);
    setGoalError(null);
    setGoalSuccess(null);

    // optional quick client-side validation
    if (dailyGoal < 0) {
      setGoalError("Goal must be 0 or greater");
      setGoalLoading(false);
      return;
    }

    try {
      await reminderService.updateDailyGoal(dailyGoal); // ensure this accepts number
      setGoalSuccess("Daily contact goal updated successfully");
    } catch (error) {
      console.error("Failed to update daily goal:", error);
      setGoalError("Failed to update daily goal. Please try again.");
    } finally {
      setGoalLoading(false);
    }
  };

  // Handle sending immediate notifications
  const handleSendNotification = async (type: 'morning' | 'afternoon') => {
    setNotificationLoading(type);
    setNotificationError(null);
    setNotificationSuccess(null);

    try {
      const result = await reminderService.sendNotificationNow(type);

      if (result.success) {
        setNotificationSuccess(result.message);
      } else {
        setNotificationError(result.message);
      }
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
      setNotificationError(`Failed to send ${type} notification. Please try again.`);
    } finally {
      setNotificationLoading(null);
    }
  };

  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Profile Settings"
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getUserInitials()}
                </Avatar>
              }
            />
            <CardContent>
              <form onSubmit={profileFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      value={profileFormik.values.firstName}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.firstName && Boolean(profileFormik.errors.firstName)}
                      helperText={profileFormik.touched.firstName && profileFormik.errors.firstName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      value={profileFormik.values.lastName}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                      helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                      helperText={profileFormik.touched.email && profileFormik.errors.email}
                      disabled // Email can't be changed
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      Save Profile
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Goal Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Daily Goal Settings"
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getUserInitials()}
                </Avatar>
              }
            />
            <CardContent>
              <form onSubmit={handleGoalSave}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="goal"
                      name="goal"
                      label="Goal"
                      type="number"
                      value={dailyGoal}
                      onChange={handleGoalChange}
                      error={Boolean(goalError)}
                      helperText={goalError ?? undefined}
                      inputProps={{ min: 0, step: 1 }}
                      disabled={goalLoading}
                    />
                  </Grid>

                  {goalSuccess && (
                    <Grid item xs={12}>
                      <Alert severity="success">{goalSuccess}</Alert>
                    </Grid>
                  )}

                  {goalError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{goalError}</Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      disabled={goalLoading}
                    >
                      {goalLoading ? <CircularProgress size={20} color="inherit" /> : "Save Goal"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>


        {/* Custom Categories */}
        <Grid item xs={12}>
          <CustomCategoryManager />
        </Grid>

        {/* Tags */}
        <Grid item xs={12}>
          <TagManager />
        </Grid>

        {/* Test Notifications */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Test Notifications"
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><NotificationsIcon /></Avatar>}
            />
            <CardContent>
              {notificationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {notificationError}
                </Alert>
              )}

              {notificationSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {notificationSuccess}
                </Alert>
              )}

              <Typography variant="body1" paragraph>
                Send yourself a test notification immediately instead of waiting for the scheduled times.
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={notificationLoading === 'morning' ? <CircularProgress size={20} /> : <MorningIcon />}
                  onClick={() => handleSendNotification('morning')}
                  disabled={!!notificationLoading}
                >
                  Send Morning Notification (10 AM)
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={notificationLoading === 'afternoon' ? <CircularProgress size={20} /> : <AfternoonIcon />}
                  onClick={() => handleSendNotification('afternoon')}
                  disabled={!!notificationLoading}
                >
                  Send Afternoon Notification (3 PM)
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary" mt={2}>
                These notifications will be sent via email and SMS based on your notification settings.
                The content will reflect your current goal progress.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Notification Settings" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email Notifications"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Receive reminder notifications via email
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Text Message Notifications"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Receive reminder notifications via SMS
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Daily Summary"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Receive a daily summary of your upcoming reminders
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                  >
                    Save Notification Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 
