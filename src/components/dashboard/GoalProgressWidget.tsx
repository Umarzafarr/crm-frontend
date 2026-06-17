import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { reminderService } from '../../services/reminder.service';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const GoalProgressWidget: React.FC = () => {
  const [goalProgress, setGoalProgress] = useState<{
    dailyGoal: number;
    contacted: number;
    remaining: number;
    dueToday: number;
  }>({
    dailyGoal: 0,
    contacted: 0,
    remaining: 0,
    dueToday: 0,
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchGoalProgress = async () => {
      setLoading(true);
      try {
        // This will get the current goal progress: dailyGoal, contacted today, remaining, and due today
        const result = await reminderService.getGoalProgress();
        if (result) {
          setGoalProgress({
            dailyGoal: result.dailyGoal || 0,
            contacted: result.contacted || 0,
            remaining: result.remaining || 0,
            dueToday: result.dueToday || 0
          });
        } else {
          // Handle case where result is undefined
          setGoalProgress({
            dailyGoal: 0,
            contacted: 0,
            remaining: 0,
            dueToday: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch goal progress:', error);
        // Set default values on error
        setGoalProgress({
          dailyGoal: 0,
          contacted: 0,
          remaining: 0,
          dueToday: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGoalProgress();

    // Set up a refresh interval (every 5 minutes) to keep the dashboard updated
    const intervalId = setInterval(fetchGoalProgress, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const calculatePercentage = () => {
    if (!goalProgress || goalProgress.dailyGoal === 0) return 0;
    const contacted = goalProgress.contacted || 0;
    const dailyGoal = goalProgress.dailyGoal || 1; // Avoid division by zero
    return Math.min(100, Math.round((contacted / dailyGoal) * 100));
  };

  const formik = useFormik({
    initialValues: {
      dailyGoal: goalProgress.dailyGoal,
    },
    validationSchema: Yup.object({
      dailyGoal: Yup.number()
        .required('Daily goal is required')
        .positive('Must be a positive number')
        .integer('Must be a whole number'),
    }),
    onSubmit: async (values) => {
      try {
        await reminderService.updateDailyGoal(values.dailyGoal);
        
        // Update local state
        setGoalProgress(prev => ({
          ...prev,
          dailyGoal: values.dailyGoal,
          remaining: Math.max(0, values.dailyGoal - prev.contacted),
        }));
        
        handleCloseSettings();
      } catch (error) {
        console.error('Failed to update daily goal:', error);
      }
    },
  });

  // When goalProgress updates, update the formik values
  useEffect(() => {
    formik.setValues({
      dailyGoal: goalProgress.dailyGoal,
    });
  }, [goalProgress.dailyGoal]);

  return (
    <>
     
    </>
  );
};

export default GoalProgressWidget; 