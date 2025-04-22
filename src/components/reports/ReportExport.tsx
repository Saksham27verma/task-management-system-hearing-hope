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
  Alert
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

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    
    setExportOptions({
      ...exportOptions,
      [name]: type === 'checkbox' ? checked : value
    });
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
      // Construct API endpoint and query parameters
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      params.append('includeCharts', exportOptions.includeCharts.toString());
      params.append('includeDetails', exportOptions.includeDetails.toString());
      params.append('fileName', exportOptions.fileName);
      params.append('paperSize', exportOptions.paperSize);
      params.append('orientation', exportOptions.orientation);
      params.append('fields', exportOptions.selectedFields.join(','));
      
      // Send request to API
      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }
      
      // Handle response based on format
      if (exportOptions.format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportOptions.fileName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportOptions.fileName}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
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
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Export Format
                </Typography>
                <RadioGroup
                  name="format"
                  value={exportOptions.format}
                  onChange={handleOptionChange}
                  row
                >
                  <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
                  <FormControlLabel value="excel" control={<Radio />} label="Excel" />
                  <FormControlLabel value="csv" control={<Radio />} label="CSV" />
                </RadioGroup>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                label="File Name"
                name="fileName"
                value={exportOptions.fileName}
                onChange={handleOptionChange}
                helperText="File extension will be added automatically"
              />
              
              {exportOptions.format === 'pdf' && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="paper-size-label">Paper Size</InputLabel>
                    <Select
                      labelId="paper-size-label"
                      name="paperSize"
                      value={exportOptions.paperSize}
                      label="Paper Size"
                      onChange={handleOptionChange as any}
                    >
                      <MenuItem value="a4">A4</MenuItem>
                      <MenuItem value="letter">Letter</MenuItem>
                      <MenuItem value="legal">Legal</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="orientation-label">Orientation</InputLabel>
                    <Select
                      labelId="orientation-label"
                      name="orientation"
                      value={exportOptions.orientation}
                      label="Orientation"
                      onChange={handleOptionChange as any}
                    >
                      <MenuItem value="portrait">Portrait</MenuItem>
                      <MenuItem value="landscape">Landscape</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Content Options
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeCharts}
                      onChange={handleOptionChange}
                      name="includeCharts"
                    />
                  }
                  label="Include Charts"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeDetails}
                      onChange={handleOptionChange}
                      name="includeDetails"
                    />
                  }
                  label="Include Details"
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Fields to Include
                </Typography>
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
                <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', maxHeight: 200, overflowY: 'auto' }}>
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
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={printReport} 
            startIcon={<PrintIcon />}
            disabled={exportOptions.selectedFields.length === 0}
          >
            Print
          </Button>
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