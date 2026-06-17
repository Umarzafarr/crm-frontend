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
import { Tag } from '../../types';
import { tagService } from '../../services/tag.service';

const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTags = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await tagService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
      setError('Failed to load tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Tag name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await tagService.createTag({ name: newName.trim() });
      setNewName('');
      setSuccess('Tag created successfully');
      await loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleTagNameChange = (id: number, value: string) => {
    setTags((current) =>
      current.map((tag) => (tag.id === id ? { ...tag, name: value } : tag))
    );
  };

  const handleUpdate = async (tag: Tag) => {
    if (!tag.name.trim()) {
      setError('Tag name is required');
      return;
    }

    setSavingId(tag.id);
    setError(null);
    setSuccess(null);

    try {
      await tagService.updateTag(tag.id, { name: tag.name.trim(), color: tag.color });
      setSuccess('Tag updated successfully');
      await loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      setError(error instanceof Error ? error.message : 'Failed to update tag');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (tag: Tag) => {
    const confirmed = window.confirm(
      `Delete "${tag.name}"? This will remove the tag from all contacts using it.`
    );

    if (!confirmed) return;

    setSavingId(tag.id);
    setError(null);
    setSuccess(null);

    try {
      await tagService.deleteTag(tag.id);
      setSuccess('Tag deleted successfully');
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete tag');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Tags" />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add, rename, and delete tags. Contacts can have multiple tags.
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
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              label="New Tag Name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" onClick={handleCreate} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Add Tag'}
            </Button>
          </Grid>
        </Grid>

        {loading && tags.length === 0 ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {tags.map((tag) => (
              <Grid item xs={12} key={tag.id}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={9}>
                    <TextField
                      fullWidth
                      label="Tag Name"
                      value={tag.name}
                      onChange={(event) => handleTagNameChange(tag.id, event.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box display="flex" gap={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={savingId === tag.id ? <CircularProgress size={16} /> : <SaveIcon />}
                        onClick={() => handleUpdate(tag)}
                        disabled={savingId === tag.id}
                      >
                        Save
                      </Button>

                      <IconButton
                        color="error"
                        onClick={() => handleDelete(tag)}
                        disabled={savingId === tag.id}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default TagManager;
