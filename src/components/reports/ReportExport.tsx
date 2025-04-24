import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  FormControlLabel, 
  RadioGroup, 
  Radio, 
  TextField, 
  Typography, 
  CircularProgress,
  Checkbox,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  Grid,
  Alert,
  Paper,
  FormGroup
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeDetails: boolean;
  fileName: string;
  paperSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  selectedFields: string[];
}

interface ReportExportProps {
  reportData: any;
  reportTitle: string;
  fields: { id: string; label: string }[];
  isLoading?: boolean;
}

const ReportExport: React.FC<ReportExportProps> = ({ 
  reportData, 
  reportTitle, 
  fields,
  isLoading = false 
}) => {
  const [open, setOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    fileName: reportTitle.replace(/\s+/g, '_').toLowerCase(),
    paperSize: 'a4',
    orientation: 'portrait',
    selectedFields: fields.map(f => f.id)
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setExportError(null);
  };

  const handleOptionChange = (name: string, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFieldSelectAll = (checked: boolean) => {
    setExportOptions({
      ...exportOptions,
      selectedFields: checked ? fields.map(f => f.id) : []
    });
  };
  
  const handleFieldToggle = (fieldId: string) => {
    const selectedFields = [...exportOptions.selectedFields];
    const index = selectedFields.indexOf(fieldId);
    
    if (index === -1) {
      selectedFields.push(fieldId);
    } else {
      selectedFields.splice(index, 1);
    }
    
    setExportOptions({
      ...exportOptions,
      selectedFields
    });
  };

  const exportReport = async () => {
    setExportLoading(true);
    setExportError(null);
    
    try {
      // Prepare export options
      const exportData = {
        data: reportData,
        options: {
          format: exportOptions.format,
          includeCharts: exportOptions.includeCharts,
          includeDetails: exportOptions.includeDetails,
          fileName: exportOptions.fileName,
          paperSize: exportOptions.paperSize,
          orientation: exportOptions.orientation,
          fields: exportOptions.selectedFields
        }
      };
      
      // Send request to API
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }
      
      // Handle response based on format
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportOptions.fileName}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      handleClose();
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setExportError('Popup was blocked. Please allow popups and try again.');
      return;
    }
    
    // Prepare CSS styles for printing
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    `;
    
    // Generate table HTML based on selected fields
    let tableHtml = '<table><thead><tr>';
    const fieldsToInclude = fields.filter(field => exportOptions.selectedFields.includes(field.id));
    
    // Add headers
    fieldsToInclude.forEach(field => {
      tableHtml += `<th>${field.label}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    // Add data rows
    if (Array.isArray(reportData.reports)) {
      reportData.reports.forEach((row: any) => {
        tableHtml += '<tr>';
        fieldsToInclude.forEach(field => {
          const value = typeof row[field.id] === 'undefined' ? '' : row[field.id];
          tableHtml += `<td>${value}</td>`;
        });
        tableHtml += '</tr>';
      });
    }
    tableHtml += '</tbody></table>';
    
    // Create complete HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          ${styles}
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          ${tableHtml}
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const allFieldsSelected = exportOptions.selectedFields.length === fields.length;
  const someFieldsSelected = exportOptions.selectedFields.length > 0 && !allFieldsSelected;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        onClick={handleOpen}
        disabled={isLoading || !reportData}
        sx={{ ml: 1 }}
      >
        Export
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Export Report</DialogTitle>
        
        <DialogContent dividers>
          {exportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="export-format-label">Export Format</InputLabel>
                <Select
                  labelId="export-format-label"
                  id="export-format"
                  value={exportOptions.format}
                  onChange={(e) => handleOptionChange('format', e.target.value as 'pdf' | 'excel' | 'csv')}
                  label="Export Format"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="File Name"
                value={exportOptions.fileName}
                onChange={(e) => handleOptionChange('fileName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="paper-size-label">Paper Size</InputLabel>
                <Select
                  labelId="paper-size-label"
                  id="paper-size"
                  value={exportOptions.paperSize}
                  onChange={(e) => handleOptionChange('paperSize', e.target.value as 'a4' | 'letter' | 'legal')}
                  label="Paper Size"
                  disabled={exportOptions.format !== 'pdf'}
                >
                  <MenuItem value="a4">A4</MenuItem>
                  <MenuItem value="letter">Letter</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="orientation-label">Orientation</InputLabel>
                <Select
                  labelId="orientation-label"
                  id="orientation"
                  value={exportOptions.orientation}
                  onChange={(e) => handleOptionChange('orientation', e.target.value as 'portrait' | 'landscape')}
                  label="Orientation"
                  disabled={exportOptions.format !== 'pdf'}
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>
                Content Options
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportOptions.includeCharts}
                        onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                      />
                    }
                    label="Include Charts"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportOptions.includeDetails}
                        onChange={(e) => handleOptionChange('includeDetails', e.target.checked)}
                      />
                    }
                    label="Include Details"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>
                Fields to Include
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allFieldsSelected}
                        indeterminate={someFieldsSelected}
                        onChange={(e) => handleFieldSelectAll(e.target.checked)}
                      />
                    }
                    label="Select All"
                  />
                  {fields.map((field) => (
                    <FormControlLabel
                      key={field.id}
                      control={
                        <Checkbox
                          checked={exportOptions.selectedFields.includes(field.id)}
                          onChange={() => handleFieldToggle(field.id)}
                        />
                      }
                      label={field.label}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {exportOptions.format === 'pdf' && (
            <Button 
              onClick={printReport}
              disabled={exportOptions.selectedFields.length === 0}
              startIcon={<PrintIcon />}
            >
              Print
            </Button>
          )}
          <Button 
            onClick={exportReport}
            variant="contained" 
            color="primary"
            startIcon={<FileDownloadIcon />}
            disabled={exportLoading || exportOptions.selectedFields.length === 0}
          >
            {exportLoading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportExport; 