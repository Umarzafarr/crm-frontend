import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { userService } from '../../services/user.service';
import { FollowupSettings } from '../../types';

interface FollowupSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (settings: FollowupSettings) => void;
}

const categoryLabels = {
  followupHotlist: { label: 'Hot List', color: 'error' as const, description: 'Your highest priority contacts' },
  followupAList: { label: 'A-List', color: 'primary' as const, description: 'Important contacts for regular follow-up' },
  followupBList: { label: 'B-List', color: 'secondary' as const, description: 'Moderate priority contacts' },
  followupCList: { label: 'C-List', color: 'info' as const, description: 'Lower priority contacts' },
  followupDList: { label: 'D-List', color: 'warning' as const, description: 'Lower priority contacts' },
  followupStandard: { label: 'Standard', color: 'default' as const, description: 'Default category for new contacts' },
};

const defaultSettings: FollowupSettings = {
  followupHotlist: 30,
  followupAList: 60,
  followupBList: 90,
  followupCList: 120,
  followupDList: 150,
  followupStandard: 180,
};

const FollowupSettingsDialog: React.FC<FollowupSettingsDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik<FollowupSettings>({
    initialValues: defaultSettings,
    validationSchema: Yup.object({
      followupHotlist: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
      followupAList: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
      followupBList: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
      followupCList: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
      followupDList: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
      followupStandard: Yup.number()
        .min(1, 'Must be at least 1 day')
        .max(365, 'Must be less than 365 days')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const updatedSettings = await userService.updateFollowupSettings(values);
        setSuccess('Follow-up settings updated successfully!');
        onSave?.(updatedSettings);

        // Close dialog after a brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setError('Failed to update follow-up settings. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Load current settings when dialog opens
  useEffect(() => {
    if (open) {
      const loadSettings = async () => {
        setLoadingInitial(true);
        setError(null);
        try {
          const settings = await userService.getFollowupSettings();
          formik.setValues(settings);
        } catch (err) {
          setError('Failed to load current settings');
        } finally {
          setLoadingInitial(false);
        }
      };

      loadSettings();
    }
  }, [open]);

  const handleResetToDefaults = () => {
    formik.setValues(defaultSettings);
    setSuccess(null);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      formik.resetForm();
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <ScheduleIcon sx={{ mr: 1 }} />
          Follow-up Settings
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Customize how many days to wait before following up with contacts in each category
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loadingInitial ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <Grid container spacing={3}>
              {Object.entries(categoryLabels).map(([key, config]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="subtitle2">
                        Follow-up Interval
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      name={key}
                      type="number"
                      value={formik.values[key as keyof FollowupSettings]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched[key as keyof FollowupSettings] && Boolean(formik.errors[key as keyof FollowupSettings])}
                      helperText={formik.touched[key as keyof FollowupSettings] && formik.errors[key as keyof FollowupSettings]}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">days</InputAdornment>,
                      }}
                      inputProps={{ min: 1, max: 365 }}
                    />

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {config.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>How it works:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When you log an interaction with a contact, the system will automatically schedule the next follow-up
                based on their category and your settings above. You can always override this with a custom date when logging interactions.
              </Typography>
            </Box>
          </form>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleResetToDefaults}
          startIcon={<RestoreIcon />}
          disabled={loading || loadingInitial}
        >
          Reset to Defaults
        </Button>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => formik.handleSubmit()}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading || loadingInitial || !formik.isValid}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowupSettingsDialog; 