import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Autocomplete,
  Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Contact, CustomCategory, Tag } from '../../types';
import api from '../../services/api';
import { customCategoryService } from '../../services/customCategory.service';
import { tagService } from '../../services/tag.service';
import { getCategoryColor, getContrastText } from '../../utils/categoryColors';

interface ContactFormProps {
  open: boolean;
  contact: Contact | null;
  onClose: (refreshData?: boolean) => void;
}


const LEGACY_CATEGORY_BY_NAME: Record<string, Contact['category']> = {
  hotlist: 'HOTLIST',
  'hot list': 'HOTLIST',
  'a list': 'A_LIST',
  'a-list': 'A_LIST',
  a_list: 'A_LIST',
  'b list': 'B_LIST',
  'b-list': 'B_LIST',
  b_list: 'B_LIST',
  'c list': 'C_LIST',
  'c-list': 'C_LIST',
  c_list: 'C_LIST',
  'd list': 'D_LIST',
  'd-list': 'D_LIST',
  d_list: 'D_LIST',
  standard: 'STANDARD',
};

const getLegacyCategoryForCustomCategory = (category?: CustomCategory): Contact['category'] => {
  if (!category) return 'STANDARD';
  return LEGACY_CATEGORY_BY_NAME[category.name.trim().toLowerCase()] || 'STANDARD';
};

const getDefaultCustomCategoryIdForLegacyCategory = (
  contact: Contact | null,
  categories: CustomCategory[]
): number | undefined => {
  if (contact?.customCategoryId) return Number(contact.customCategoryId);
  if (contact?.customCategory?.id) return Number(contact.customCategory.id);

  if (!contact?.category || categories.length === 0) return undefined;

  const expectedNames: Record<Contact['category'], string[]> = {
    HOTLIST: ['hotlist', 'hot list'],
    A_LIST: ['a list', 'a-list', 'a_list'],
    B_LIST: ['b list', 'b-list', 'b_list'],
    C_LIST: ['c list', 'c-list', 'c_list'],
    D_LIST: ['d list', 'd-list', 'd_list'],
    STANDARD: ['standard'],
  };

  const names = expectedNames[contact.category] || ['standard'];
  const match = categories.find((category) =>
    names.includes(category.name.trim().toLowerCase())
  );

  return match?.id;
};

interface ContactFormValues {
  fullName: string;
  spouseFullName?: string;
  spouseEmail?: string;
  spousePhone?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  category: Contact['category'];
  customCategoryId?: number;
  price?: number | '';
  tagIds: number[];
}

const ContactForm: React.FC<ContactFormProps> = ({ open, contact, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoadingCategories(true);
      setLoadingTags(true);
      setError(null);

      try {
        const [categories, tagList] = await Promise.all([
          customCategoryService.getCustomCategories(),
          tagService.getTags(),
        ]);
        setCustomCategories(categories);
        setTags(tagList);
      } catch (error) {
        console.error('Failed to load contact form data:', error);
        setError('Failed to load categories or tags. Please try again.');
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    loadData();
  }, [open]);

  const initialValues: ContactFormValues = {
    fullName: contact?.fullName || '',
    spouseFullName: contact?.spouseFullName || '',
    spouseEmail: contact?.spouseEmail || '',
    spousePhone: contact?.spousePhone || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    company: contact?.company || '',
    jobTitle: contact?.jobTitle || '',
    notes: contact?.notes || '',
    category: contact?.category || 'STANDARD',
    customCategoryId: getDefaultCustomCategoryIdForLegacyCategory(contact, customCategories),
    price: contact?.price ?? '',
    tagIds: contact?.tags?.map((contactTag) => contactTag.tagId || contactTag.tag?.id).filter(Boolean) as number[] || [],
  };

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full name is required'),
    spouseEmail: Yup.string()
      .when('spouseFullName', {
        is: (spouseFullName: string) => spouseFullName && spouseFullName.trim().length > 0,
        then: (schema) => schema.email('Invalid email address').required('Spouse email is required when spouse name is provided'),
        otherwise: (schema) => schema.email('Invalid email address').optional(),
      }),
    spousePhone: Yup.string()
      .when('spouseFullName', {
        is: (spouseFullName: string) => spouseFullName && spouseFullName.trim().length > 0,
        then: (schema) => schema
          .required('Spouse phone is required when spouse name is provided')
          .matches(
            /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
            'Invalid phone number format'
          ),
        otherwise: (schema) => schema
          .optional()
          .matches(
            /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
            'Invalid phone number format'
          ),
      }),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(
        /^(\+\d{1,3}( )?)?((\(\d{1,3}\))|\d{1,3})[- .]?\d{3,4}[- .]?\d{4}$/,
        'Invalid phone number format'
      ),
    customCategoryId: Yup.number().required('Category is required'),
    price: Yup.mixed().test('valid-price', 'Price must be a positive number', (value) => {
      if (value === '' || value === undefined || value === null) return true;
      const numericValue = Number(value);
      return !Number.isNaN(numericValue) && numericValue >= 0;
    }),
  });

  const formik = useFormik<ContactFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        const selectedCustomCategory = customCategories.find(
          (category) => category.id === Number(values.customCategoryId)
        );

        const payload = {
          ...values,
          category: getLegacyCategoryForCustomCategory(selectedCustomCategory),
          customCategoryId: values.customCategoryId ? Number(values.customCategoryId) : undefined,
          price: values.price === '' || values.price === undefined ? undefined : Number(values.price),
          tagIds: values.tagIds || [],
        };

        if (contact) {
          await api.patch(`/contacts/${contact.id}`, payload);
        } else {
          await api.post('/contacts', payload);
        }

        onClose(true);
      } catch (error) {
        console.error('Failed to save contact:', error);
        setError(error instanceof Error ? error.message : 'Failed to save contact');
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    onClose(false);
  };

  const selectedCategory = customCategories.find(
    (category) => category.id === Number(formik.values.customCategoryId)
  );

  const selectedTags = tags.filter((tag) => formik.values.tagIds.includes(tag.id));

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="fullName"
                name="fullName"
                label="Full Name"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="price"
                name="price"
                label="Price / Budget"
                type="text"
                value={formik.values.price}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*$/.test(value)) {
                    formik.setFieldValue('price', value === '' ? '' : Number(value));
                  }
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spouseFullName"
                name="spouseFullName"
                label="Spouse Name (if applicable)"
                value={formik.values.spouseFullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spouseFullName && Boolean(formik.errors.spouseFullName)}
                helperText={formik.touched.spouseFullName && formik.errors.spouseFullName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spouseEmail"
                name="spouseEmail"
                label="Spouse Email (if applicable)"
                value={formik.values.spouseEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spouseEmail && Boolean(formik.errors.spouseEmail)}
                helperText={formik.touched.spouseEmail && formik.errors.spouseEmail}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="spousePhone"
                name="spousePhone"
                label="Spouse Phone (if applicable)"
                value={formik.values.spousePhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.spousePhone && Boolean(formik.errors.spousePhone)}
                helperText={formik.touched.spousePhone && formik.errors.spousePhone}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.customCategoryId && Boolean(formik.errors.customCategoryId)}>
                <InputLabel id="custom-category-label">Category</InputLabel>
                <Select
                  labelId="custom-category-label"
                  id="customCategoryId"
                  name="customCategoryId"
                  value={formik.values.customCategoryId || ''}
                  onChange={(event) => {
                    const selectedId = event.target.value ? Number(event.target.value) : undefined;
                    const selectedCustomCategory = customCategories.find(
                      (category) => category.id === selectedId
                    );

                    formik.setFieldValue('customCategoryId', selectedId);
                    formik.setFieldValue('category', getLegacyCategoryForCustomCategory(selectedCustomCategory));
                  }}
                  onBlur={formik.handleBlur}
                  label="Category"
                  disabled={loadingCategories}
                >
                  {customCategories.map((category, index) => {
                    const categoryColor = getCategoryColor(category.color, index);
                    return (
                      <MenuItem key={category.id} value={category.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: categoryColor,
                              border: '1px solid rgba(0,0,0,0.2)',
                            }}
                          />
                          <span>{category.name}</span>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {formik.touched.customCategoryId && formik.errors.customCategoryId && (
                  <FormHelperText>{formik.errors.customCategoryId}</FormHelperText>
                )}
              </FormControl>

              {selectedCategory && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={selectedCategory.name}
                    sx={{
                      bgcolor: getCategoryColor(selectedCategory.color),
                      color: getContrastText(getCategoryColor(selectedCategory.color)),
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Follow-up interval: <strong>{selectedCategory.followupDays} days</strong>
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={(option) => option.name}
                value={selectedTags}
                loading={loadingTags}
                onChange={(_event, value) => {
                  formik.setFieldValue('tagIds', value.map((tag) => tag.id));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Select tags"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingTags ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="company"
                name="company"
                label="Company"
                value={formik.values.company}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.company && Boolean(formik.errors.company)}
                helperText={formik.touched.company && formik.errors.company}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="jobTitle"
                name="jobTitle"
                label="Job Title"
                value={formik.values.jobTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
                helperText={formik.touched.jobTitle && formik.errors.jobTitle}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
                placeholder="Add any initial notes about this contact..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting || loadingCategories || loadingTags}
          >
            {formik.isSubmitting ? (
              <CircularProgress size={24} />
            ) : contact ? (
              'Update Contact'
            ) : (
              'Add Contact'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContactForm;
