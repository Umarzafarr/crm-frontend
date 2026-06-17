import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

// Notification service
const notificationService = {
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/notifications/settings');
      return response.data.data || {
        notificationsEnabled: true,
        smsEnabled: true,
        emailEnabled: true,
        phoneNumber: '',
      };
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return {
        notificationsEnabled: true,
        smsEnabled: true,
        emailEnabled: true,
        phoneNumber: '',
      };
    }
  },

  updateNotificationSettings: async (settings: any) => {
    try {
      const response = await api.post('/notifications/settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  sendTestSms: async (phoneNumber: string, message?: string) => {
    try {
      const response = await api.post('/notifications/test-sms', { phoneNumber, message });
      return response.data;
    } catch (error) {
      console.error('Error sending test SMS:', error);
      throw error;
    }
  },

  sendTestEmail: async (subject?: string, message?: string) => {
    try {
      const response = await api.post('/notifications/test-email', { subject, message });
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },

  triggerMorningReminder: async () => {
    try {
      const response = await api.post('/notifications/trigger-morning');
      return response.data;
    } catch (error) {
      console.error('Error triggering morning reminder:', error);
      throw error;
    }
  },

  triggerAfternoonReminder: async () => {
    try {
      const response = await api.post('/notifications/trigger-afternoon');
      return response.data;
    } catch (error) {
      console.error('Error triggering afternoon reminder:', error);
      throw error;
    }
  }
};

const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testMorningLoading, setTestMorningLoading] = useState(false);
  const [testAfternoonLoading, setTestAfternoonLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const formik = useFormik({
    initialValues: {
      notificationsEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      phoneNumber: '',
    },
    validationSchema: Yup.object({
      phoneNumber: Yup.string()
        .when(['smsEnabled'], (smsEnabled, schema) => {
          return smsEnabled[0]
            ? schema.required('Phone number is required when SMS notifications are enabled')
              .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +1234567890)')
            : schema;
        }),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);

      try {
        await notificationService.updateNotificationSettings(values);
        setSuccess('Notification settings updated successfully');
      } catch (err) {
        setError('Failed to update notification settings');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await notificationService.getNotificationSettings();
        formik.setValues(settings);
      } catch (err) {
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTestSms = async () => {
    setTestSmsLoading(true);
    setTestResult(null);

    try {
      const result = await notificationService.sendTestSms(
        formik.values.phoneNumber,
        'This is a test SMS from your CRM system!'
      );
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to send test SMS'
      });
    } finally {
      setTestSmsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestResult(null);

    try {
      const result = await notificationService.sendTestEmail(
        'Test Email from CRM',
        'This is a test email from your CRM system!'
      );
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to send test email'
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTriggerMorningReminder = async () => {
    setTestMorningLoading(true);
    setTestResult(null);

    try {
      const result = await notificationService.triggerMorningReminder();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to trigger morning reminder'
      });
    } finally {
      setTestMorningLoading(false);
    }
  };

  const handleTriggerAfternoonReminder = async () => {
    setTestAfternoonLoading(true);
    setTestResult(null);

    try {
      const result = await notificationService.triggerAfternoonReminder();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to trigger afternoon reminder'
      });
    } finally {
      setTestAfternoonLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notification Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <FormGroup>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Notification Preferences
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.notificationsEnabled}
                      onChange={formik.handleChange}
                      name="notificationsEnabled"
                      color="primary"
                    />
                  }
                  label="Enable Notifications"
                />

                {formik.values.notificationsEnabled && (
                  <Box ml={4} mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.emailEnabled}
                          onChange={formik.handleChange}
                          name="emailEnabled"
                          color="primary"
                          disabled={!formik.values.notificationsEnabled}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <EmailIcon sx={{ mr: 1 }} />
                          Email Notifications
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.smsEnabled}
                          onChange={formik.handleChange}
                          name="smsEnabled"
                          color="primary"
                          disabled={!formik.values.notificationsEnabled}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <SmsIcon sx={{ mr: 1 }} />
                          SMS Notifications
                        </Box>
                      }
                    />

                    {formik.values.smsEnabled && formik.values.notificationsEnabled && (
                      <Box mt={2} ml={4}>
                        <TextField
                          fullWidth
                          id="phoneNumber"
                          name="phoneNumber"
                          label="Phone Number"
                          placeholder="Enter 10 digit number"
                          value={formik.values.phoneNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                          helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">+1</InputAdornment>,
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </FormGroup>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>

      {/* Test Notifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Notifications
        </Typography>

        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
            onClose={() => setTestResult(null)}
          >
            {testResult.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Test Individual Notifications" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Send test notifications to verify your configuration is working correctly.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SmsIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={handleTestSms}
                  disabled={testSmsLoading || !formik.values.phoneNumber}
                >
                  {testSmsLoading ? <CircularProgress size={24} /> : 'Test SMS'}
                </Button>
                <Button
                  startIcon={<EmailIcon />}
                  variant="outlined"
                  color="secondary"
                  onClick={handleTestEmail}
                  disabled={testEmailLoading}
                >
                  {testEmailLoading ? <CircularProgress size={24} /> : 'Test Email'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="Test Daily Reminders" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manually trigger the daily reminder notifications to test the system.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  startIcon={<SendIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={handleTriggerMorningReminder}
                  disabled={testMorningLoading}
                >
                  {testMorningLoading ? <CircularProgress size={24} /> : 'Morning Reminder (10 AM)'}
                </Button>
                <Button
                  startIcon={<SendIcon />}
                  variant="outlined"
                  color="secondary"
                  onClick={handleTriggerAfternoonReminder}
                  disabled={testAfternoonLoading}
                >
                  {testAfternoonLoading ? <CircularProgress size={24} /> : 'Afternoon Reminder (3 PM)'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default NotificationSettings;