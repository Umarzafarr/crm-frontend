import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { contactService } from '../services/contact.service';
import { customCategoryService } from '../services/customCategory.service';
import { tagService } from '../services/tag.service';
import { formatDate, formatContactCategory, formatPhoneNumber } from '../utils/format';
import { getCategoryColor, getContrastText } from '../utils/categoryColors';
import { Contact, CustomCategory, Tag } from '../types';
import ContactForm from '../components/contacts/ContactForm';
import ContactBulkImport from '../components/contacts/ContactBulkImport';
import ContactExportModal from '../components/contacts/ContactExportModal';


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

const getLegacyCategoryForCustomCategory = (category?: CustomCategory): Contact['category'] | undefined => {
  if (!category) return undefined;
  return LEGACY_CATEGORY_BY_NAME[category.name.trim().toLowerCase()];
};

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const filters = { search: searchTerm };
  const setFilters = (newFilters: any) => {
    const nextFilters = typeof newFilters === 'function' ? newFilters(filters) : newFilters;
    setSearchTerm(nextFilters.search);
  };
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);
  const [selectedCustomCategoryId, setSelectedCustomCategoryId] = useState<number | 'ALL'>('ALL');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<string>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [importSuccess, setImportSuccess] = useState<{ imported: number; failed: number } | null>(null);

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${Number(price).toLocaleString()}`;
  };

  const getContactCustomCategory = (contact: Contact) => {
    return contact.customCategory || customCategories.find((category) => category.id === Number(contact.customCategoryId));
  };

  const getContactCategoryName = (contact: Contact) => {
    const category = getContactCustomCategory(contact);
    return category?.name || formatContactCategory(contact.category);
  };

  const getContactCategoryColor = (contact: Contact) => {
    const category = getContactCustomCategory(contact);
    return getCategoryColor(category?.color || contact.category);
  };

  const renderCategoryChip = (contact: Contact) => {
    const categoryColor = getContactCategoryColor(contact);

    return (
      <Chip
        label={getContactCategoryName(contact)}
        size="small"
        sx={{
          bgcolor: categoryColor,
          color: getContrastText(categoryColor),
          fontWeight: 500,
        }}
      />
    );
  };

  const getContactTags = (contact: Contact): Tag[] => {
    return contact.tags?.map((contactTag) => contactTag.tag).filter(Boolean) || [];
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categories, tagList] = await Promise.all([
          customCategoryService.getCustomCategories(),
          tagService.getTags(),
        ]);
        setCustomCategories(categories);
        setTags(tagList);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };

    loadFilters();
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const parsedMinPrice = minPrice.trim() ? Number(minPrice) : undefined;
      const parsedMaxPrice = maxPrice.trim() ? Number(maxPrice) : undefined;

      const selectedCategory = selectedCustomCategoryId !== 'ALL'
        ? customCategories.find((category) => category.id === Number(selectedCustomCategoryId))
        : undefined;
      const legacyCategory = getLegacyCategoryForCustomCategory(selectedCategory);

      const params = {
        search: searchTerm || undefined,
        skip: page * rowsPerPage,
        take: rowsPerPage,
        category: legacyCategory,
        customCategoryId: selectedCustomCategoryId !== 'ALL' && !legacyCategory ? selectedCustomCategoryId : undefined,
        minPrice: Number.isNaN(parsedMinPrice) ? undefined : parsedMinPrice,
        maxPrice: Number.isNaN(parsedMaxPrice) ? undefined : parsedMaxPrice,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        sortBy,
        sortOrder: sortDirection,
      };

      const result = await contactService.getContacts(params);

      if (result && Array.isArray(result.contacts)) {
        let visibleContacts = result.contacts;

        // Safety fallback: if backend returns contacts with customCategoryId but without the customCategory relation,
        // still display/filter them correctly on the frontend. For default custom categories, old legacy
        // contacts are preserved by matching the old category enum.
        if (selectedCustomCategoryId !== 'ALL') {
          const selectedCategory = customCategories.find(
            (category) => category.id === Number(selectedCustomCategoryId)
          );
          const legacyCategory = getLegacyCategoryForCustomCategory(selectedCategory);

          visibleContacts = visibleContacts.filter((contact) => {
            if (Number(contact.customCategoryId || contact.customCategory?.id) === Number(selectedCustomCategoryId)) {
              return true;
            }

            return Boolean(legacyCategory && contact.category === legacyCategory && !contact.customCategoryId);
          });
        }

        setContacts(visibleContacts);
        setTotalContacts(selectedCustomCategoryId !== 'ALL' ? visibleContacts.length : result.total);
      } else {
        setContacts([]);
        setTotalContacts(0);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setError('Failed to load contacts. Please try again.');
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, selectedCustomCategoryId, selectedTagIds, minPrice, maxPrice, sortBy, sortDirection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleFormOpen = (contact: Contact | null = null) => {
    setCurrentContact(contact);
    setFormOpen(true);
  };

  const handleFormClose = (refreshData: boolean = false) => {
    setFormOpen(false);
    setCurrentContact(null);
    if (refreshData) {
      fetchContacts();
    }
  };

  const handleDeleteDialogOpen = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await contactService.deleteContact(contactToDelete.id);
      fetchContacts();
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setError('Failed to delete contact. Please try again.');
    }
  };

  const handleImportComplete = (result: { imported: number; failed: number }) => {
    setImportSuccess(result);
    fetchContacts();
    setTimeout(() => setImportSuccess(null), 5000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomCategoryId('ALL');
    setSelectedTagIds([]);
    setMinPrice('');
    setMaxPrice('');
    setPage(0);
  };

  const renderTags = (contact: Contact) => {
    const contactTags = getContactTags(contact);
    if (contactTags.length === 0) return null;

    return (
      <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
        {contactTags.map((tag) => (
          <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
        ))}
      </Box>
    );
  };

  const renderContactCard = (contact: Contact) => (
    <Card key={contact.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="div">
            {contact.fullName}
          </Typography>
          {renderCategoryChip(contact)}
        </Box>

        {contact.jobTitle && contact.company && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <BusinessIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {contact.jobTitle} at {contact.company}
          </Typography>
        )}

        {contact.phone && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {formatPhoneNumber(contact.phone)}
          </Typography>
        )}

        {contact.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {contact.email}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Price: {formatPrice(contact.price)}
        </Typography>

        {renderTags(contact)}

        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Last contacted: {contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <IconButton size="small" color="primary" onClick={() => handleFormOpen(contact)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteDialogOpen(contact)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="outlined" onClick={() => navigate(`/contacts/${contact.id}`)}>
            View
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contacts</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={() => setExportOpen(true)}>
            Export Contacts
          </Button>
          <ContactBulkImport onImportComplete={handleImportComplete} />
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleFormOpen()}>
            Add Contact
          </Button>
        </Box>
      </Box>

      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(null)}>
          Successfully imported {importSuccess.imported} contacts. {importSuccess.failed > 0 && `Failed to import ${importSuccess.failed} contacts.`}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Search by full name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setFilters({ ...filters, search: searchInput.trim() });
                    setPage(0);
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="custom-category-filter-label">Category</InputLabel>
                <Select
                  labelId="custom-category-filter-label"
                  value={selectedCustomCategoryId}
                  label="Category"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedCustomCategoryId(value === 'ALL' ? 'ALL' : Number(value));
                    setPage(0);
                  }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {customCategories.map((category, index) => {
                    const categoryColor = getCategoryColor(category.color, index);
                    return (
                      <MenuItem key={category.id} value={category.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
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
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="tag-filter-label">Tags</InputLabel>
                <Select
                  labelId="tag-filter-label"
                  multiple
                  value={selectedTagIds.map(String)}
                  input={<OutlinedInput label="Tags" />}
                  onChange={(event) => {
                    const value = event.target.value;
                    const values = typeof value === 'string' ? value.split(',') : value;
                    setSelectedTagIds(values.map((tagId) => Number(tagId)));
                    setPage(0);
                  }}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((tagId) => tags.find((tag) => tag.id === Number(tagId))?.name)
                      .filter(Boolean)
                      .join(', ')
                  }
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={String(tag.id)}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={clearFilters}>
                Clear
              </Button>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Min Price"
                type="text"
                value={minPrice}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*$/.test(value)) {
                    setMinPrice(value);
                    setPage(0);
                  }
                }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Max Price"
                type="text"
                value={maxPrice}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*$/.test(value)) {
                    setMaxPrice(value);
                    setPage(0);
                  }
                }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : contacts.length === 0 && totalContacts === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No contacts found. Adjust filters or add a new contact.
        </Alert>
      ) : (
        <>
          {isMobile ? (
            <Box>
              {contacts.map((contact) => renderContactCard(contact))}
              {totalContacts > 0 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalContacts}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSortChange('fullName')} sx={{ cursor: 'pointer' }}>
                        Name {sortBy === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell onClick={() => handleSortChange('price')} sx={{ cursor: 'pointer' }}>
                        Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell onClick={() => handleSortChange('lastContacted')} sx={{ cursor: 'pointer' }}>
                        Last Contacted {sortBy === 'lastContacted' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell onClick={() => handleSortChange('nextContactDate')} sx={{ cursor: 'pointer' }}>
                        Next Follow-up {sortBy === 'nextContactDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        hover
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{contact.fullName}</TableCell>
                        <TableCell>
                          {renderCategoryChip(contact)}
                        </TableCell>
                        <TableCell>{formatPrice(contact.price)}</TableCell>
                        <TableCell>{renderTags(contact)}</TableCell>
                        <TableCell>{formatPhoneNumber(contact.phone)}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.lastContacted ? formatDate(contact.lastContacted) : 'Never'}</TableCell>
                        <TableCell>{contact.nextContactDate ? formatDate(contact.nextContactDate) : 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Box onClick={(e) => e.stopPropagation()} display="flex" justifyContent="flex-end" gap={1}>
                            <IconButton size="small" color="primary" onClick={() => handleFormOpen(contact)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteDialogOpen(contact)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalContacts}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </>
      )}

      {formOpen && (
        <ContactForm open={formOpen} contact={currentContact} onClose={handleFormClose} />
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {contactToDelete?.fullName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteContact} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ContactExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </Box>
  );
};

export default Contacts;
