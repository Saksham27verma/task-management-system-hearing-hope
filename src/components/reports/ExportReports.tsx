import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import { 
  CloudDownloadOutlined, 
  PictureAsPdf, 
  TableChart, 
  ArrowDropDown 
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';

interface ExportReportsProps {
  reportData: any;
  period: string;
}

export default function ExportReports({ reportData, period }: ExportReportsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv');
  const [exportFields, setExportFields] = useState({
    employeeInfo: true,
    taskCounts: true,
    completionRates: true,
    taskTypes: true,
    recentTasks: false,
    summary: true
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleExportTypeSelect = (type: 'csv' | 'pdf') => {
    setExportType(type);
    setDialogOpen(true);
    handleClose();
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleFieldToggle = (field: keyof typeof exportFields) => {
    setExportFields({
      ...exportFields,
      [field]: !exportFields[field]
    });
  };
  
  // Generate CSV data based on selected fields
  const generateCSVData = () => {
    if (!reportData || !reportData.reports) return [];
    
    const headers = ['Employee Name', 'Email', 'Position', 'Role'];
    if (exportFields.taskCounts) {
      headers.push('Total Tasks', 'Completed', 'In Progress', 'Pending', 'Delayed/Incomplete');
    }
    if (exportFields.completionRates) {
      headers.push('Completion Rate (%)', 'On-Time Completions', 'Late Completions');
    }
    if (exportFields.taskTypes) {
      headers.push('Daily Tasks', 'Weekly Tasks', 'Monthly Tasks');
    }
    if (exportFields.recentTasks && reportData.reports.some(r => r.recentCompletedTask)) {
      headers.push('Most Recent Completed Task', 'Completion Date');
    }
    
    const csvData = [headers];
    
    // Add report data
    reportData.reports.forEach(user => {
      const row = [user.employeeName, user.employeeEmail, user.employeePosition, user.employeeRole];
      
      if (exportFields.taskCounts) {
        row.push(
          user.totalTasks.toString(),
          user.completedTasks.toString(),
          user.inProgressTasks.toString(),
          user.pendingTasks.toString(),
          user.incompleteOrDelayedTasks.toString()
        );
      }
      
      if (exportFields.completionRates) {
        row.push(
          user.completionRate.toString(),
          user.onTimeCompletions.toString(),
          user.lateCompletions.toString()
        );
      }
      
      if (exportFields.taskTypes) {
        row.push(
          (user.tasksByType?.daily || 0).toString(),
          (user.tasksByType?.weekly || 0).toString(),
          (user.tasksByType?.monthly || 0).toString()
        );
      }
      
      if (exportFields.recentTasks) {
        if (user.recentCompletedTask) {
          row.push(
            user.recentCompletedTask.title,
            format(new Date(user.recentCompletedTask.completedDate), 'yyyy-MM-dd')
          );
        } else {
          row.push('N/A', 'N/A');
        }
      }
      
      csvData.push(row);
    });
    
    // Add summary row if selected
    if (exportFields.summary && reportData.summary) {
      const summaryRow = ['SUMMARY', '', '', ''];
      
      if (exportFields.taskCounts) {
        summaryRow.push(
          reportData.summary.totalTasks.toString(),
          reportData.summary.completedTasks.toString(),
          '', // No summary for in progress
          '', // No summary for pending
          '' // No summary for delayed
        );
      }
      
      if (exportFields.completionRates) {
        summaryRow.push(
          reportData.summary.averageCompletionRate.toString(),
          '', // No summary for on-time
          '' // No summary for late
        );
      }
      
      if (exportFields.taskTypes) {
        summaryRow.push('', '', ''); // No summary for task types
      }
      
      if (exportFields.recentTasks) {
        summaryRow.push('', '');
      }
      
      csvData.push(summaryRow);
    }
    
    return csvData;
  };
  
  // Handle PDF export
  const handlePdfExport = async () => {
    if (!reportData) return;
    
    try {
      setIsExporting(true);
      
      // In a real implementation, we would use a library like jsPDF to generate PDFs
      // For this example, we'll simulate the PDF generation with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
      const filename = `Task_Performance_Report_${periodLabel}_${dateStr}.pdf`;
      
      // In a real implementation, we would have code here to generate and save the PDF
      // For now, we'll just show an alert
      alert(`PDF export functionality will be available in the next update.\nFilename: ${filename}`);
      
      setIsExporting(false);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
      setIsExporting(false);
    }
  };
  
  // Filename for CSV export
  const getCSVFilename = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    return `Task_Performance_Report_${periodLabel}_${dateStr}.csv`;
  };
  
  // Handle export action when dialog is confirmed
  const handleExport = () => {
    if (exportType === 'pdf') {
      handlePdfExport();
    } else {
      // CSV export is handled by CSVLink component
      // Just close the dialog
      setDialogOpen(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<CloudDownloadOutlined />}
        endIcon={<ArrowDropDown />}
        onClick={handleClick}
      >
        Export
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleExportTypeSelect('csv')}>
          <TableChart fontSize="small" sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExportTypeSelect('pdf')}>
          <PictureAsPdf fontSize="small" sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
      </Menu>
      
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Export Report as {exportType.toUpperCase()}
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the data to include in your export:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.employeeInfo} 
                    onChange={() => handleFieldToggle('employeeInfo')}
                    disabled={true} // Always include employee info
                  />
                }
                label="Employee Information"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.taskCounts} 
                    onChange={() => handleFieldToggle('taskCounts')}
                  />
                }
                label="Task Counts"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.completionRates} 
                    onChange={() => handleFieldToggle('completionRates')}
                  />
                }
                label="Completion Rates"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.taskTypes} 
                    onChange={() => handleFieldToggle('taskTypes')}
                  />
                }
                label="Task Types"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.recentTasks} 
                    onChange={() => handleFieldToggle('recentTasks')}
                  />
                }
                label="Recent Completed Tasks"
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportFields.summary} 
                    onChange={() => handleFieldToggle('summary')}
                  />
                }
                label="Summary Row"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          
          {exportType === 'csv' ? (
            <CSVLink
              data={generateCSVData()}
              filename={getCSVFilename()}
              onClick={() => setDialogOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <Button 
                variant="contained" 
                color="primary"
                disabled={isExporting}
              >
                Export CSV
              </Button>
            </CSVLink>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Exporting...
                </>
              ) : (
                'Export PDF'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
} 