import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  CircularProgress,
  Link,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Preview as PreviewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
} from '@mui/icons-material';
import { contactService } from '../../services/contact.service';
import { ContactCategory } from '../../types';
import { removeDuplicateContacts, buildCsv, downloadCsv } from '../../utils/csv';

interface ContactBulkImportProps {
  onImportComplete: (result: { imported: number; failed: number }) => void;
}

// Template for CSV download
const CSV_TEMPLATE =
  `fullName,spouseFullName,spouseEmail,spousePhone,email,phone,address,company,jobTitle,notes,category
John Doe,Jane Doe,jane@example.com,5551234568,john@example.com,5551234567,123 Main St,Acme Inc,CEO,Important contact,HOTLIST
Mary Smith,,,,mary@example.com,5559876543,456 Oak Ave,ABC Corp,Manager,,A_LIST
`;

const ContactBulkImport: React.FC<ContactBulkImportProps> = ({ onImportComplete }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState<ContactCategory>('STANDARD');
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [cleanedData, setCleanedData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = ['Select File', 'Preview Data', 'Import'];

  const handleOpen = () => {
    setOpen(true);
    // Reset state
    setFile(null);
    setPreview([]);
    setError(null);
    setSuccessMessage(null);
    setActiveStep(0);
    setUploading(false);
    setDuplicatesRemoved(0);
    setOriginalData([]);
    setCleanedData([]);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Check file type
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'xls') {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    parseFilePreview(selectedFile);
  };

  const parseFilePreview = (file: File) => {
    // This is a basic implementation that works for CSV
    // For a real implementation, you would use a library like XLSX to handle Excel files

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        // Parse all data first
        const allData = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue;

          const values = lines[i].split(',');
          const row: any = {};

          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });

          allData.push(row);
        }

        // Store original data
        setOriginalData(allData);

        // Remove duplicates based on phone number
        const deduplicationResult = removeDuplicateContacts(allData, 'phone');

        // Store cleaned data and statistics
        setCleanedData(deduplicationResult.deduplicatedContacts);
        setDuplicatesRemoved(deduplicationResult.duplicatesRemoved);

        // Set preview to show first 5 rows of cleaned data
        const previewData = deduplicationResult.deduplicatedContacts.slice(0, 5);
        setPreview(previewData);
        setActiveStep(1);
      } catch (error) {
        console.error('Failed to parse file:', error);
        setError('Failed to parse the file. Please check the file format.');
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file');
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a new file with the cleaned data
      const headers = cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [];
      const csv = buildCsv(cleanedData, headers);
      const cleanedFile = new File([csv], file.name.replace(/\.[^/.]+$/, '_cleaned.csv'), { type: 'text/csv' });

      // Send cleaned file and the selected default category to the API
      const result = await contactService.importContacts(cleanedFile, defaultCategory);

      setSuccessMessage(`Successfully imported ${result.imported} contacts${result.failed ? `, ${result.failed} skipped` : ''}!`);
      setActiveStep(2);
      onImportComplete(result);
    } catch (error) {
      console.error('Failed to import contacts:', error);
      setError(error instanceof Error ? error.message : 'Failed to import contacts');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCleanedCsv = () => {
    if (cleanedData.length === 0) return;

    // Get headers from the first row
    const headers = Object.keys(cleanedData[0]);
    const csv = buildCsv(cleanedData, headers);
    downloadCsv(csv, 'cleaned_contacts.csv');
  };

  const handleNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBackStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Upload a CSV or Excel file with your contacts. The file should have the following columns:
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Column</TableCell>
                    <TableCell>Required</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>fullName</TableCell>
                    <TableCell>Yes</TableCell>
                    <TableCell>Contact's full name</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>spouseFullName</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Spouse's full name</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>spouseEmail</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Spouse's email address</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>spousePhone</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Spouse's phone number</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>email</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Email address</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>phone</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Phone number</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>address</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Physical address</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>company</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Company name</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>jobTitle</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Job title</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>notes</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>Additional notes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>category</TableCell>
                    <TableCell>No</TableCell>
                    <TableCell>HOTLIST, A_LIST, B_LIST, C_LIST, D_LIST, or STANDARD</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadTemplate}
                  fullWidth
                >
                  Download Template
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Select File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
            </Grid>

            {file && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected file: {file.name}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Review your data before importing. Below is a preview of the first 5 rows:
            </Typography>

            {duplicatesRemoved > 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Duplicates removed: {duplicatesRemoved} contacts detected with the same phone number.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadCleanedCsv}
                  sx={{ mt: 1 }}
                >
                  Download Cleaned CSV
                </Button>
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {preview.length > 0 && Object.keys(preview[0]).map((header, index) => (
                      <TableCell key={index}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((cell: any, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mb={3}>
              <Typography variant="body2" paragraph>
                Set a default category for contacts that don't have one specified:
              </Typography>

              <FormControl fullWidth>
                <InputLabel id="default-category-label">Default Category</InputLabel>
                <Select
                  labelId="default-category-label"
                  id="default-category"
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value as ContactCategory)}
                  label="Default Category"
                >
                  <MenuItem value="HOTLIST">Hot List</MenuItem>
                  <MenuItem value="A_LIST">A List</MenuItem>
                  <MenuItem value="B_LIST">B List</MenuItem>
                  <MenuItem value="C_LIST">C List</MenuItem>
                  <MenuItem value="D_LIST">D List</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center">
            {successMessage ? (
              <Box>
                <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  Import Successful!
                </Typography>
                <Typography variant="body1" paragraph>
                  {successMessage}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  sx={{ mt: 2 }}
                >
                  Close
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  Click the button below to start the import process:
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  onClick={handleImport}
                  disabled={uploading}
                >
                  {uploading ? 'Importing...' : 'Start Import'}
                </Button>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadIcon />}
        onClick={handleOpen}
        sx={{ mr: 1 }}
      >
        Import Contacts
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Import Contacts</Typography>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}
        </DialogContent>

        {activeStep !== 2 && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            {activeStep > 0 && (
              <Button onClick={handleBackStep} startIcon={<BackIcon />}>
                Back
              </Button>
            )}
            {activeStep === 0 && file && (
              <Button
                onClick={handleNextStep}
                variant="contained"
                endIcon={<NextIcon />}
                disabled={!file}
              >
                Next
              </Button>
            )}
            {activeStep === 1 && (
              <Button
                onClick={handleNextStep}
                variant="contained"
                endIcon={<NextIcon />}
              >
                Next
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default ContactBulkImport; 