import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormGroup, FormControlLabel, Checkbox,
  Box, Typography, Divider, Alert, LinearProgress
} from '@mui/material';
import { contactService } from '../../services/contact.service';
import { buildCsv, downloadCsv } from '../../utils/csv';
import { Contact } from '../../types';

// UI list (label shown to user; key is what goes to CSV header)
const FIELD_OPTIONS_PRIMARY: { key: keyof Contact; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'spouseFullName', label: 'Spouse Name' },
  { key: 'spouseEmail', label: 'Spouse Email' },
  { key: 'spousePhone', label: 'Spouse Phone' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'price', label: 'Price' },
  { key: 'company', label: 'Company' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'notes', label: 'Notes' },
  { key: 'category', label: 'Category' },
];

// Optional “advanced” fields (not in import template; exported as camelCase too)
const FIELD_OPTIONS_ADVANCED: { key: keyof Contact; label: string }[] = [
  { key: 'lastContacted', label: 'Last Contacted' },
  { key: 'nextContactDate', label: 'Next Follow-up' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const ContactExportModal: React.FC<Props> = ({ open, onClose }) => {
  // ✅ start with NONE selected
  const [selected, setSelected] = useState<(keyof Contact | 'spouseEmail' | 'spousePhone')[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const allSelectable = [
    ...FIELD_OPTIONS_PRIMARY.map(f => f.key),
    ...FIELD_OPTIONS_ADVANCED.map(f => f.key as keyof Contact),
  ];

  const allSelected = useMemo(
    () => selected.length === allSelectable.length && allSelectable.length > 0,
    [selected.length, allSelectable.length]
  );

  // ✅ whenever the modal opens, clear selection & errors
  useEffect(() => {
    if (open) {
      setSelected([]);
      setError(null);
    }
  }, [open]);

  const toggleField = (key: any) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    setError(null);
    if (selected.length === 0) {
      setError('Please select at least one field to export.');
      return;
    }

    try {
      setBusy(true);

      // Grab all contacts (now includes spouseEmail & spousePhone)
      const allContacts = await contactService.fetchAllContacts();

      // Build CSV with EXACT camelCase headers (keys)
      const csv = buildCsv(allContacts as any[], selected as any[]);

      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadCsv(csv, `contacts_export_${ts}.csv`);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to export contacts.');
    } finally {
      setBusy(false);
    }
  };


  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Contacts</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 0 }}>
          Choose which fields you want to include in the CSV. <br />
          <strong>Note:</strong> This will export <strong>all</strong> your contacts.
        </Typography>

        {busy && <LinearProgress sx={{ mb: 1 }} />}
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {/* ✅ right-aligned "Select All" as a checkbox toggle */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mb: 0 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={selected.length > 0 && selected.length < allSelectable.length}
                onChange={(e) => {
                  if (e.target.checked) setSelected([...allSelectable]);
                  else setSelected([]);
                }}
                disabled={busy}
              />
            }
            label="Select All"
            sx={{ m: 0 }}
          />
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
          Import Template Fields
        </Typography>
        <FormGroup>
          {FIELD_OPTIONS_PRIMARY.map(f => (
            <FormControlLabel
              key={String(f.key)}
              control={
                <Checkbox
                  size="small"
                  checked={selected.includes(f.key)}
                  onChange={() => toggleField(f.key)}
                  disabled={busy}
                />
              }
              label={`${f.label} (${f.key})`}
              // ✅ tighter vertical spacing
              sx={{ my: 0, '& .MuiFormControlLabel-label': { fontSize: 14 } }}
            />
          ))}
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Advanced (not used by import)
        </Typography>
        <FormGroup>
          {FIELD_OPTIONS_ADVANCED.map(f => (
            <FormControlLabel
              key={String(f.key)}
              control={
                <Checkbox
                  size="small"
                  checked={selected.includes(f.key)}
                  onChange={() => toggleField(f.key)}
                  disabled={busy}
                />
              }
              label={`${f.label} (${f.key})`}
              sx={{ my: 0, '& .MuiFormControlLabel-label': { fontSize: 14 } }}
            />
          ))}
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleExport} disabled={busy}>
          {busy ? 'Exporting…' : 'Export CSV'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactExportModal;
