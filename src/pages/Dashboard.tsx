import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ContactPhone as ContactIcon,
  Notifications as ReminderIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { contactService } from '../services/contact.service';
import { reminderService } from '../services/reminder.service';
import { customCategoryService } from '../services/customCategory.service';
import { formatRelativeDate } from '../utils/format';
import { getCategoryColor } from '../utils/categoryColors';
import { Reminder, GoalProgress, CustomCategory } from '../types';
import DueContactsWidget from '../components/dashboard/DueContactsWidget';

ChartJS.register(ArcElement, ChartTooltip, Legend);

type CategoryStat = {
  id: number;
  name: string;
  color?: string;
  count: number;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [contactStats, setContactStats] = useState<CategoryStat[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);

  const [goalProgress, setGoalProgress] = useState<GoalProgress>({
    dailyGoal: 0,
    contacted: 0,
    remaining: 0,
    dueToday: 0,
  });
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactStats = async () => {
      setContactsLoading(true);
      setContactsError(null);

      try {
        const categories: CustomCategory[] = await customCategoryService.getCustomCategories();

        if (!categories.length) {
          setContactStats([]);
          return;
        }

        const stats = await Promise.all(
          categories.map(async (category) => {
            const result = await contactService.getContacts({
              skip: 0,
              take: 1,
              customCategoryId: category.id,
            });

            return {
              id: category.id,
              name: category.name,
              color: category.color,
              count: result.total || 0,
            };
          })
        );

        setContactStats(stats);
      } catch (error) {
        console.error('Failed to fetch contact stats:', error);
        setContactsError('Failed to load custom category statistics');
        setContactStats([]);
      } finally {
        setContactsLoading(false);
      }
    };

    fetchContactStats();
  }, []);

  useEffect(() => {
    const fetchTodayReminders = async () => {
      setRemindersLoading(true);
      setRemindersError(null);

      try {
        const reminders = await reminderService.getDailyReminders();
        setTodayReminders(Array.isArray(reminders) ? reminders : []);
      } catch (error) {
        console.error('Failed to fetch today reminders:', error);
        setRemindersError('Failed to load today\'s reminders');
        setTodayReminders([]);
      } finally {
        setRemindersLoading(false);
      }
    };

    fetchTodayReminders();
  }, []);

  useEffect(() => {
    const fetchGoalProgress = async () => {
      setGoalLoading(true);
      setGoalError(null);

      try {
        const progress = await reminderService.getGoalProgress();
        setGoalProgress({
          dailyGoal: progress?.dailyGoal || 0,
          contacted: progress?.contacted || 0,
          remaining: progress?.remaining || 0,
          dueToday: progress?.dueToday || 0,
        });
      } catch (error) {
        console.error('Failed to fetch goal progress:', error);
        setGoalError('Failed to load goal progress');
        setGoalProgress({ dailyGoal: 0, contacted: 0, remaining: 0, dueToday: 0 });
      } finally {
        setGoalLoading(false);
      }
    };

    fetchGoalProgress();
  }, []);

  const handleCompleteReminder = async (id: number) => {
    try {
      await reminderService.completeReminder(id);
      setTodayReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id ? { ...reminder, completed: true } : reminder
        )
      );
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const totalCategoryContacts = contactStats.reduce((sum, stat) => sum + stat.count, 0);

  const chartData = {
    labels: contactStats.map((stat) => stat.name),
    datasets: [
      {
        data: totalCategoryContacts > 0 ? contactStats.map((stat) => stat.count) : contactStats.map(() => 1),
        backgroundColor: contactStats.map((stat, index) => {
          if (stat.color && stat.color.startsWith('#')) return stat.color;
          return getCategoryColor(stat.color || stat.name, index);
        }),
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <DueContactsWidget />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <ContactIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Contact Categories
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/settings')}
                  sx={{ mr: 1 }}
                >
                  Settings
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/contacts')}
                >
                  Add Contact
                </Button>
              </Box>
            </Box>

            {contactsLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : contactsError ? (
              <Alert severity="error">{contactsError}</Alert>
            ) : contactStats.length === 0 ? (
              <Alert severity="info">
                No custom categories found. Go to Settings to create your categories.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
                <Box sx={{ height: 200, width: { xs: '100%', sm: '50%' } }}>
                  <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, mt: { xs: 2, sm: 0 } }}>
                  <List dense>
                    {contactStats.map((stat, index) => (
                      <ListItem key={stat.id}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: getCategoryColor(stat.color, index),
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        />
                        <ListItemText primary={stat.name} />
                        <ListItemSecondaryAction>
                          <Typography variant="body2">
                            {stat.count} contacts
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <ReminderIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Today's Reminders
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/reminders')}
              >
                Add Reminder
              </Button>
            </Box>

            {remindersLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : remindersError ? (
              <Alert severity="error">{remindersError}</Alert>
            ) : todayReminders.length === 0 ? (
              <Alert severity="info">No reminders scheduled for today.</Alert>
            ) : (
              <List>
                {todayReminders.map((reminder) => (
                  <ListItem
                    key={reminder.id}
                    sx={{
                      opacity: reminder.completed ? 0.6 : 1,
                      textDecoration: reminder.completed ? 'line-through' : 'none',
                    }}
                  >
                    <ListItemText
                      primary={reminder.message}
                      secondary={formatRelativeDate(reminder.time)}
                    />
                    <ListItemSecondaryAction>
                      <Checkbox
                        edge="end"
                        checked={reminder.completed}
                        disabled={reminder.completed}
                        onChange={() => handleCompleteReminder(reminder.id)}
                        icon={<CheckIcon />}
                        checkedIcon={<CheckIcon />}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button variant="text" onClick={() => navigate('/reminders')}>
                View All Reminders
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
