import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { CustomCategory } from '../../types';
import { customCategoryService } from '../../services/customCategory.service';
import { DEFAULT_CATEGORY_COLOR, getCategoryColor } from '../../utils/categoryColors';

const CustomCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [newFollowupDays, setNewFollowupDays] = useState<number>(180);
  const [newColor, setNewColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await customCategoryService.getCustomCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load custom categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await customCategoryService.createCustomCategory({
        name: newName.trim(),
        followupDays: Number(newFollowupDays) || 180,
        color: newColor,
      });

      setNewName('');
      setNewFollowupDays(180);
      setNewColor(DEFAULT_CATEGORY_COLOR);
      setSuccess('Category created successfully');
      await loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      setError(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (
    id: number,
    field: 'name' | 'followupDays' | 'color',
    value: string
  ) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id
          ? {
              ...category,
              [field]: field === 'followupDays' ? Number(value) : value,
            }
          : category
      )
    );
  };

  const handleUpdate = async (category: CustomCategory) => {
    if (!category.name.trim()) {
      setError('Category name is required');
      return;
    }

    setSavingId(category.id);
    setError(null);
    setSuccess(null);

    try {
      await customCategoryService.updateCustomCategory(category.id, {
        name: category.name.trim(),
        followupDays: Number(category.followupDays) || 180,
        color: category.color || DEFAULT_CATEGORY_COLOR,
      });

      setSuccess('Category updated successfully');
      await loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      setError(error instanceof Error ? error.message : 'Failed to update category');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (category: CustomCategory) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Contacts using this category will keep their contact info but will no longer have this custom category.`
    );

    if (!confirmed) return;

    setSavingId(category.id);
    setError(null);
    setSuccess(null);

    try {
      await customCategoryService.deleteCustomCategory(category.id);
      setSuccess('Category deleted successfully');
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Custom Categories" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add, rename, delete categories, pick a color, and set the follow-up interval shown when adding contacts.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="New Category Name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Follow-up Days"
              type="number"
              value={newFollowupDays}
              onChange={(event) => setNewFollowupDays(Number(event.target.value))}
              inputProps={{ min: 1, max: 365 }}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Add Category'}
            </Button>
          </Grid>
        </Grid>

        {loading && categories.length === 0 ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {categories.map((category, index) => {
              const categoryColor = getCategoryColor(category.color, index);

              return (
                <Grid item xs={12} key={category.id}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            bgcolor: categoryColor,
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Category Name"
                          value={category.name}
                          onChange={(event) =>
                            handleCategoryChange(category.id, 'name', event.target.value)
                          }
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Follow-up Days"
                        type="number"
                        value={category.followupDays}
                        onChange={(event) =>
                          handleCategoryChange(category.id, 'followupDays', event.target.value)
                        }
                        inputProps={{ min: 1, max: 365 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label="Color"
                        type="color"
                        value={categoryColor}
                        onChange={(event) =>
                          handleCategoryChange(category.id, 'color', event.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box display="flex" gap={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={savingId === category.id ? <CircularProgress size={16} /> : <SaveIcon />}
                          onClick={() => handleUpdate({ ...category, color: categoryColor })}
                          disabled={savingId === category.id}
                        >
                          Save
                        </Button>

                        <IconButton
                          color="error"
                          onClick={() => handleDelete(category)}
                          disabled={savingId === category.id}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomCategoryManager;
