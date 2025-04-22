import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Divider,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Interfaces
interface CustomReportField {
  field: string;
  label: string;
  selected: boolean;
}

interface CustomReportFilter {
  field: string;
  operator: string;
  value: string;
}

interface CustomReport {
  _id?: string;
  name: string;
  description: string;
  type: string;
  fields: CustomReportField[];
  filters: CustomReportFilter[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  createdBy: string;
  isPublic: boolean;
}

interface CustomReportBuilderProps {
  onReportGenerated?: (reportData: any) => void;
}

// Available fields by report type
const availableFields = {
  task: [
    { field: 'title', label: 'Task Title' },
    { field: 'description', label: 'Description' },
    { field: 'status', label: 'Status' },
    { field: 'priority', label: 'Priority' },
    { field: 'dueDate', label: 'Due Date' },
    { field: 'assignedTo', label: 'Assigned To' },
    { field: 'createdAt', label: 'Created Date' },
    { field: 'completedAt', label: 'Completed Date' },
    { field: 'taskType', label: 'Task Type' },
    { field: 'progress', label: 'Progress' }
  ],
  user: [
    { field: 'name', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'role', label: 'Role' },
    { field: 'department', label: 'Department' },
    { field: 'joinDate', label: 'Join Date' },
    { field: 'tasksCompleted', label: 'Tasks Completed' },
    { field: 'tasksInProgress', label: 'Tasks In Progress' },
    { field: 'completionRate', label: 'Completion Rate' },
  ]
};

// Available operators for filters
const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'between', label: 'Between' }
];

const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({ onReportGenerated }) => {
  // State for dialog and report
  const [open, setOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<CustomReport[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavedReports, setShowSavedReports] = useState(false);
  
  // New report state
  const [report, setReport] = useState<CustomReport>({
    name: '',
    description: '',
    type: 'task',
    fields: availableFields.task.map(field => ({ ...field, selected: false })),
    filters: [],
    createdBy: '',
    isPublic: false
  });

  // Fetch saved reports on component mount
  useEffect(() => {
    fetchSavedReports();
  }, []);

  // Fetch the current user's saved reports
  const fetchSavedReports = async () => {
    setLoadingSaved(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reports/custom');
      if (!response.ok) {
        throw new Error('Failed to fetch saved reports');
      }
      
      const data = await response.json();
      setSavedReports(data.reports || []);
    } catch (err) {
      setError('Error loading saved reports: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingSaved(false);
    }
  };

  // Handle opening the report builder dialog
  const handleOpen = () => {
    setOpen(true);
  };

  // Handle closing the report builder dialog
  const handleClose = () => {
    setOpen(false);
  };

  // Handle report type change
  const handleTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newType = event.target.value as string;
    setReport({
      ...report,
      type: newType,
      fields: (availableFields[newType as keyof typeof availableFields] || [])
        .map(field => ({ ...field, selected: false }))
    });
  };

  // Toggle field selection
  const toggleField = (index: number) => {
    const updatedFields = [...report.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      selected: !updatedFields[index].selected
    };
    setReport({ ...report, fields: updatedFields });
  };

  // Add a new filter
  const addFilter = () => {
    const newFilter: CustomReportFilter = {
      field: report.fields[0]?.field || '',
      operator: 'equals',
      value: ''
    };
    setReport({ ...report, filters: [...report.filters, newFilter] });
  };

  // Update filter
  const updateFilter = (index: number, key: keyof CustomReportFilter, value: string) => {
    const updatedFilters = [...report.filters];
    updatedFilters[index] = {
      ...updatedFilters[index],
      [key]: value
    };
    setReport({ ...report, filters: updatedFilters });
  };

  // Remove filter
  const removeFilter = (index: number) => {
    const updatedFilters = report.filters.filter((_, i) => i !== index);
    setReport({ ...report, filters: updatedFilters });
  };

  // Save custom report
  const saveReport = async () => {
    if (!report.name.trim()) {
      setError('Report name is required');
      return;
    }

    if (!report.fields.some(field => field.selected)) {
      setError('At least one field must be selected');
      return;
    }

    setLoadingReport(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error('Failed to save report');
      }

      // Refresh the saved reports list
      await fetchSavedReports();
      setOpen(false);
      
      // Reset the report form
      setReport({
        name: '',
        description: '',
        type: 'task',
        fields: availableFields.task.map(field => ({ ...field, selected: false })),
        filters: [],
        createdBy: '',
        isPublic: false
      });
      
    } catch (err) {
      setError('Error saving report: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingReport(false);
    }
  };

  // Generate report based on current configuration
  const generateReport = async () => {
    if (!report.fields.some(field => field.selected)) {
      setError('At least one field must be selected');
      return;
    }

    setLoadingReport(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      
      // Pass report data to parent component if callback exists
      if (onReportGenerated) {
        onReportGenerated(data);
      }
      
    } catch (err) {
      setError('Error generating report: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingReport(false);
    }
  };

  // Load a saved report
  const loadReport = (savedReport: CustomReport) => {
    setReport(savedReport);
    setShowSavedReports(false);
    setOpen(true);
  };

  // Delete a saved report
  const deleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/custom/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Refresh the saved reports list
      await fetchSavedReports();
      
    } catch (err) {
      setError('Error deleting report: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpen}
        >
          Create Custom Report
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => setShowSavedReports(true)}
        >
          Saved Reports
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Saved Reports Dialog */}
      <Dialog 
        open={showSavedReports} 
        onClose={() => setShowSavedReports(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Saved Reports</DialogTitle>
        <DialogContent>
          {loadingSaved ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : savedReports.length === 0 ? (
            <Typography variant="body1" sx={{ py: 2 }}>
              No saved reports found. Create your first custom report!
            </Typography>
          ) : (
            <List>
              {savedReports.map((savedReport) => (
                <ListItem key={savedReport._id} divider>
                  <ListItemText
                    primary={savedReport.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {savedReport.description}
                        </Typography>
                        <br />
                        <Chip 
                          size="small" 
                          label={savedReport.type} 
                          sx={{ mr: 1, mt: 1 }} 
                        />
                        <Chip 
                          size="small" 
                          label={savedReport.isPublic ? 'Public' : 'Private'} 
                          sx={{ mt: 1 }} 
                        />
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => loadReport(savedReport)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => deleteReport(savedReport._id || '')}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavedReports(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Report Builder Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Custom Report Builder</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Report Information</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    value={report.name}
                    onChange={(e) => setReport({ ...report, name: e.target.value })}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={report.type}
                      onChange={handleTypeChange}
                      label="Report Type"
                    >
                      <MenuItem value="task">Task Report</MenuItem>
                      <MenuItem value="user">User Report</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={report.description}
                    onChange={(e) => setReport({ ...report, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={report.isPublic}
                        onChange={(e) => setReport({ ...report, isPublic: e.target.checked })}
                      />
                    }
                    label="Make this report available to all users"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Field Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Select Fields</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={1}>
                {report.fields.map((field, index) => (
                  <Grid item xs={12} sm={6} md={4} key={field.field}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={field.selected}
                          onChange={() => toggleField(index)}
                        />
                      }
                      label={field.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Filters */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Filters</Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={addFilter}
                  size="small"
                >
                  Add Filter
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {report.filters.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                  No filters added. Add a filter to narrow down your report results.
                </Typography>
              ) : (
                report.filters.map((filter, index) => (
                  <Paper 
                    key={index} 
                    variant="outlined" 
                    sx={{ p: 2, mb: 2 }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Field</InputLabel>
                          <Select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, 'field', e.target.value as string)}
                            label="Field"
                          >
                            {report.fields.map((field) => (
                              <MenuItem key={field.field} value={field.field}>
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, 'operator', e.target.value as string)}
                            label="Operator"
                          >
                            {operators.map((op) => (
                              <MenuItem key={op.value} value={op.value}>
                                {op.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Value"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={1}>
                        <IconButton color="error" onClick={() => removeFilter(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))
              )}
            </Grid>
            
            {/* Sorting */}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Sorting</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={report.sortBy?.field || ''}
                      onChange={(e) => setReport({ 
                        ...report, 
                        sortBy: { 
                          field: e.target.value as string, 
                          direction: report.sortBy?.direction || 'asc' 
                        } 
                      })}
                      label="Sort By"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {report.fields.filter(f => f.selected).map((field) => (
                        <MenuItem key={field.field} value={field.field}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={report.sortBy?.direction || 'asc'}
                      onChange={(e) => setReport({ 
                        ...report, 
                        sortBy: { 
                          field: report.sortBy?.field || '', 
                          direction: e.target.value as 'asc' | 'desc' 
                        } 
                      })}
                      label="Direction"
                      disabled={!report.sortBy?.field}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={generateReport} 
            variant="contained" 
            color="secondary" 
            disabled={loadingReport}
          >
            {loadingReport ? <CircularProgress size={24} /> : 'Generate Report'}
          </Button>
          <Button 
            onClick={saveReport} 
            variant="contained" 
            color="primary" 
            disabled={loadingReport}
            startIcon={<SaveIcon />}
          >
            {loadingReport ? <CircularProgress size={24} /> : 'Save Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomReportBuilder; 