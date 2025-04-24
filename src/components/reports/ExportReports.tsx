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
  CircularProgress,
  Snackbar,
  Alert
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportReportsProps {
  reportData: any;
  period: string;
}

// Extend the jsPDF type to include the autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
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
  
  // Handle report generation using simple HTML instead of PDF
  const handlePdfExport = async () => {
    if (!reportData) return;
    
    try {
      setIsExporting(true);
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
      
      // Generate an HTML report
      const reportHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Task Performance Report - ${periodLabel}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
              }
              h1, h2 {
                color: #2c3e50;
                text-align: center;
              }
              .report-meta {
                text-align: center;
                color: #7f8c8d;
                margin-bottom: 30px;
              }
              .section {
                margin-bottom: 30px;
                border: 1px solid #eee;
                padding: 20px;
                border-radius: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              tr:hover {
                background-color: #f5f5f5;
              }
              .completion-rate {
                font-weight: bold;
                color: #27ae60;
              }
              .print-button {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 20px 0;
                cursor: pointer;
                border-radius: 4px;
              }
              .print-container {
                text-align: center;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #7f8c8d;
              }
              @media print {
                .print-container {
                  display: none;
                }
                body {
                  padding: 0;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <button class="print-button" onclick="window.print()">Print Report</button>
            </div>
            
            <h1>Task Performance Report</h1>
            <div class="report-meta">
              <p>Period: ${periodLabel}</p>
              <p>Generated on: ${format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
            
            <div class="section">
              <h2>Summary</h2>
              <p>Total Users: <strong>${reportData.summary.totalUsers}</strong></p>
              <p>Total Tasks: <strong>${reportData.summary.totalTasks}</strong></p>
              <p>Completed Tasks: <strong>${reportData.summary.completedTasks}</strong></p>
              <p>Average Completion Rate: <strong>${reportData.summary.averageCompletionRate}%</strong></p>
            </div>
            
            <div class="section">
              <h2>Employee Performance</h2>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    ${exportFields.employeeInfo ? '<th>Role</th>' : ''}
                    ${exportFields.completionRates ? '<th>Completion Rate</th>' : ''}
                    ${exportFields.taskCounts ? '<th>Total Tasks</th><th>Completed</th><th>Pending</th>' : ''}
                    ${exportFields.taskTypes ? '<th>Daily Tasks</th><th>Weekly Tasks</th><th>Monthly Tasks</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${reportData.reports.map((report: any) => `
                    <tr>
                      <td>${report.employeeName}</td>
                      ${exportFields.employeeInfo ? `<td>${report.employeeRole}</td>` : ''}
                      ${exportFields.completionRates ? `<td class="completion-rate">${report.completionRate}%</td>` : ''}
                      ${exportFields.taskCounts ? `
                        <td>${report.totalTasks}</td>
                        <td>${report.completedTasks}</td>
                        <td>${report.pendingTasks}</td>
                      ` : ''}
                      ${exportFields.taskTypes ? `
                        <td>${report.tasksByType?.daily || 0}</td>
                        <td>${report.tasksByType?.weekly || 0}</td>
                        <td>${report.tasksByType?.monthly || 0}</td>
                      ` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Task Management System - Confidential</p>
            </div>
            
            <script>
              // Auto-print when loaded (optional)
              // window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `;
      
      // Open the report in a new window
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) {
        throw new Error('Popup was blocked. Please allow popups and try again.');
      }
      
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
      
      setIsExporting(false);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error generating report:', error);
      setIsExporting(false);
      setDialogOpen(false);
      // Display error message to user through a notification
      setSnackbar({
        open: true,
        message: 'Failed to generate report. Please try again.',
        severity: 'error'
      });
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
          Generate Report
        </MenuItem>
      </Menu>
      
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {exportType === 'csv' ? 'Export Report as CSV' : 'Generate Performance Report'}
        </DialogTitle>
        
        {exportType === 'pdf' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            The report will open in a new browser tab where you can view and print it.
          </Alert>
        )}
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the data to include in your export:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={6}>
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
            
            <Grid size={6}>
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
            
            <Grid size={6}>
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
            
            <Grid size={6}>
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
            
            <Grid size={6}>
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
            
            <Grid size={6}>
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
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for error notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
} 