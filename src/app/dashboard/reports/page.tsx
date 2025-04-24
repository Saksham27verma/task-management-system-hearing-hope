'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  AssessmentOutlined,
  PersonOutline,
  CheckCircleOutline,
  PendingOutlined,
  ErrorOutline,
  HourglassEmptyOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  FilterListOutlined,
  CloudDownloadOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TableChartOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import AnalyticsDashboard from '@/components/reports/AnalyticsDashboard';
import ExportReports from '@/components/reports/ExportReports';

// Report interface
interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePosition: string;
  employeeRole: string;
  totalTasks: number;
  completedTasks: number;
  incompleteOrDelayedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  onTimeCompletions: number;
  lateCompletions: number;
  tasksByType: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  tasksAssignedToOthers?: number;
  recentCompletedTask: {
    id: string;
    title: string;
    completedDate: string;
  } | null;
}

interface ReportData {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalUsers: number;
    employeeCount: number;
    managerCount: number;
    totalTasks: number;
    completedTasks: number;
    averageCompletionRate: number;
  };
  reports: EmployeeReport[];
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState<string>('month');
  const [viewMode, setViewMode] = useState<number>(0); // 0 = summary, 1 = detailed, 2 = table, 3 = analytics
  const [roleFilter, setRoleFilter] = useState<string>(''); // '' = all, 'MANAGER', 'EMPLOYEE'
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateRange, setShowDateRange] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<{_id: string, name: string, role: string}[]>([]);
  
  // Fetch report data on component mount and when period or role filter changes
  useEffect(() => {
    // Only auto-fetch if not using custom filters that require manual applying
    if (!showDateRange && !showFilters) {
      fetchReports();
    }
  }, [period, roleFilter, showDateRange, showFilters]);
  
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build URL with query parameters
      const queryParams = new URLSearchParams();
      
      // Only add period if not using custom date range
      if (!startDate || !endDate) {
        queryParams.append('period', period);
      }
      
      // Add role filter if specified
      if (roleFilter) {
        queryParams.append('role', roleFilter);
      }
      
      // Add date range if both dates are set
      if (startDate && endDate) {
        queryParams.append('startDate', startDate.toISOString().split('T')[0]);
        queryParams.append('endDate', endDate.toISOString().split('T')[0]);
      }
      
      // Add user ID filter if specified
      if (selectedUser) {
        queryParams.append('userId', selectedUser);
      }
      
      const response = await fetch(`/api/reports?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReportData(data);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'An error occurred while loading reports');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value);
  };
  
  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    setRoleFilter(event.target.value);
  };
  
  const handleViewModeChange = (_event: React.SyntheticEvent, newValue: number) => {
    setViewMode(newValue);
  };
  
  const getStatusColor = (completionRate: number) => {
    if (completionRate >= 80) return 'success';
    if (completionRate >= 50) return 'primary';
    if (completionRate >= 30) return 'warning';
    return 'error';
  };
  
  // Format date from ISO string
  const formatDateString = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Helper to render summary cards at the top
  const renderSummaryCards = () => {
    if (!reportData) return null;
    
    const { summary } = reportData;
    
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonOutline color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {roleFilter === 'MANAGER' ? 'Total Managers' : 
                   roleFilter === 'EMPLOYEE' ? 'Total Employees' : 'Total Users'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                {summary.totalUsers}
              </Typography>
              {!roleFilter && (
                <Typography variant="caption" color="text.secondary">
                  {summary.managerCount} managers, {summary.employeeCount} employees
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentOutlined color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Tasks
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                {summary.totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleOutline color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Completed Tasks
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                {summary.completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PieChartOutlined color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Average Completion
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                  {summary.averageCompletionRate}%
                </Typography>
                {summary.averageCompletionRate >= 70 ? (
                  <TrendingUpOutlined color="success" sx={{ ml: 1 }} />
                ) : (
                  <TrendingDownOutlined color="error" sx={{ ml: 1 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render employee performance cards
  const renderEmployeeCards = () => {
    if (!reportData) return null;
    
    return (
      <Grid container spacing={3}>
        {reportData.reports.map(report => (
          <Grid size={{ xs: 12, md: 6 }} key={report.employeeId}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: report.employeeRole === 'MANAGER' ? 'secondary.main' : 'primary.main' }}>
                  {report.employeeName.charAt(0)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>{report.employeeName}</Typography>
                    <Chip 
                      size="small" 
                      label={report.employeeRole === 'MANAGER' ? 'Manager' : 'Employee'} 
                      color={report.employeeRole === 'MANAGER' ? 'secondary' : 'primary'}
                      sx={{ height: 20 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {report.employeePosition}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={report.completionRate} 
                        color={getStatusColor(report.completionRate) as any}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {report.completionRate}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Completion
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={report.completedTasks ? (report.onTimeCompletions / report.completedTasks) * 100 : 0} 
                        color="success"
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {report.completedTasks ? Math.round((report.onTimeCompletions / report.completedTasks) * 100) : 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Grid container spacing={1}>
                <Grid size={{ xs: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">{report.completedTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">Completed</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">{report.inProgressTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">In Progress</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">{report.pendingTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">Pending</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="error.main">{report.incompleteOrDelayedTasks}</Typography>
                    <Typography variant="caption" color="text.secondary">Delayed</Typography>
                  </Box>
                </Grid>
              </Grid>

              {report.employeeRole === 'MANAGER' && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tasks Assigned to Team: <strong>{report.tasksAssignedToOthers}</strong>
                  </Typography>
                </Box>
              )}
              
              {report.recentCompletedTask && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="success.contrastText">
                    Recent Completion: "{report.recentCompletedTask.title}" on {
                      formatDateString(report.recentCompletedTask.completedDate)
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render detailed table view
  const renderTable = () => {
    if (!reportData) return null;
    
    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="employee reports table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Total Tasks</TableCell>
              <TableCell align="right">Completed</TableCell>
              <TableCell align="right">In Progress</TableCell>
              <TableCell align="right">Pending</TableCell>
              <TableCell align="right">Delayed/Incomplete</TableCell>
              <TableCell align="right">Completion Rate</TableCell>
              <TableCell align="right">On-Time %</TableCell>
              {reportData.reports.some(r => r.employeeRole === 'MANAGER') && (
                <TableCell align="right">Assigned to Team</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.reports.map((report) => (
              <TableRow
                key={report.employeeId}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      mr: 1, 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.75rem',
                      bgcolor: report.employeeRole === 'MANAGER' ? 'secondary.main' : 'primary.main'
                    }}>
                      {report.employeeName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {report.employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.employeePosition}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    label={report.employeeRole === 'MANAGER' ? 'Manager' : 'Employee'} 
                    color={report.employeeRole === 'MANAGER' ? 'secondary' : 'primary'}
                    sx={{ height: 20 }}
                  />
                </TableCell>
                <TableCell align="right">{report.totalTasks}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>{report.completedTasks}</TableCell>
                <TableCell align="right" sx={{ color: 'info.main' }}>{report.inProgressTasks}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>{report.pendingTasks}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>{report.incompleteOrDelayedTasks}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {report.completionRate}%
                    </Typography>
                    <Box sx={{ ml: 1, mr: -1 }}>
                      {report.completionRate >= 75 ? (
                        <TrendingUpOutlined color="success" fontSize="small" />
                      ) : report.completionRate >= 50 ? (
                        <HourglassEmptyOutlined color="warning" fontSize="small" />
                      ) : (
                        <TrendingDownOutlined color="error" fontSize="small" />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {report.completedTasks 
                    ? Math.round((report.onTimeCompletions / report.completedTasks) * 100) 
                    : 0}%
                </TableCell>
                {reportData.reports.some(r => r.employeeRole === 'MANAGER') && (
                  <TableCell align="right">
                    {report.employeeRole === 'MANAGER' ? report.tasksAssignedToOthers : '-'}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // After the useEffect for fetching reports, add this new function
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUsers(data.users.map((user: any) => ({
          _id: user._id,
          name: user.name,
          role: user.role
        })));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };
  
  // Add a new useEffect to fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Main render
  return (
    <Box sx={{ pb: 4 }} className="reports-container">
      <Typography variant="h5" gutterBottom>
        <AssessmentOutlined sx={{ mr: 1, verticalAlign: 'top' }} />
        Reports & Analytics
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filter controls */}
      <Paper 
        sx={{ p: { xs: 1.5, sm: 3 }, mb: 3, borderRadius: 2 }} 
        elevation={1}
        className="report-filters"
      >
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          {/* Period selector */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel id="period-label">Time Period</InputLabel>
            <Select
              labelId="period-label"
              id="period-select"
              value={period}
              onChange={handlePeriodChange}
              label="Time Period"
              disabled={showDateRange}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          
          {/* Role filter */}
          {user?.role === 'SUPER_ADMIN' && (
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="role-label">User Role</InputLabel>
              <Select
                labelId="role-label"
                id="role-select"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="User Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="MANAGER">Managers</MenuItem>
                <MenuItem value="EMPLOYEE">Employees</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {/* Date range toggle */}
          <Tooltip title="Toggle custom date range">
            <Button
              variant={showDateRange ? "contained" : "outlined"}
              color="primary"
              startIcon={<CalendarTodayIcon />}
              onClick={() => setShowDateRange(!showDateRange)}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {showDateRange ? "Using Custom Dates" : "Custom Date Range"}
            </Button>
          </Tooltip>
          
          {/* Filter toggle */}
          <Tooltip title="Toggle advanced filters">
            <Button
              variant={showFilters ? "contained" : "outlined"}
              color="secondary"
              startIcon={<TuneIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {showFilters ? "Using Filters" : "Advanced Filters"}
            </Button>
          </Tooltip>
          
          {/* Apply filters button */}
          <Button
            variant="contained"
            color="primary"
            onClick={fetchReports}
            disabled={isLoading}
            startIcon={<SearchIcon />}
            sx={{ ml: { xs: 0, sm: 'auto' }, minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {isLoading ? "Loading..." : "Apply Filters"}
          </Button>
        </Box>
        
        {/* Custom date range selector */}
        {showDateRange && (
          <Box 
            sx={{ 
              mt: 2, 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
                sx={{ flex: 1 }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
                sx={{ flex: 1 }}
              />
            </LocalizationProvider>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              startIcon={<ClearIcon />}
              sx={{ minHeight: 40 }}
            >
              Clear Dates
            </Button>
          </Box>
        )}
        
        {/* Advanced filters */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="user-label">Filter by User</InputLabel>
              <Select
                labelId="user-label"
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Filter by User"
              >
                <MenuItem value="">All Users</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setSelectedUser('');
                setRoleFilter('');
              }}
              startIcon={<ClearIcon />}
              fullWidth
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Report view tabs */}
      <Tabs
        value={viewMode}
        onChange={handleViewModeChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{ 
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          ".MuiTab-root": {
            minHeight: {xs: 40, sm: 48},
            py: 0,
            fontSize: {xs: "0.8rem", sm: "0.875rem"}
          }
        }}
      >
        <Tab 
          icon={<BarChartOutlined fontSize="small" />} 
          iconPosition="start" 
          label="Summary" 
          sx={{ flexShrink: 0 }}
        />
        <Tab 
          icon={<PersonOutline fontSize="small" />} 
          iconPosition="start" 
          label="User Reports" 
          sx={{ flexShrink: 0 }}
        />
        <Tab 
          icon={<TableChartOutlined fontSize="small" />} 
          iconPosition="start" 
          label="Data Table" 
          sx={{ flexShrink: 0 }}
        />
        <Tab 
          icon={<PieChartOutlined fontSize="small" />} 
          iconPosition="start" 
          label="Analytics" 
          sx={{ flexShrink: 0 }}
        />
        <Tab 
          icon={<CloudDownloadOutlined fontSize="small" />} 
          iconPosition="start" 
          label="Export" 
          sx={{ flexShrink: 0 }}
        />
      </Tabs>
      
      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
      
      {/* Content based on selected tab */}
      <Box className="analytics-section" sx={{ display: viewMode === 0 ? 'block' : 'none' }}>
        {!isLoading && reportData && renderSummaryCards()}
      </Box>
      
      <Box className="analytics-section" sx={{ display: viewMode === 1 ? 'block' : 'none' }}>
        {!isLoading && reportData && renderEmployeeCards()}
      </Box>
      
      <Box className="analytics-section" sx={{ display: viewMode === 2 ? 'block' : 'none', overflow: 'auto' }}>
        {!isLoading && reportData && renderTable()}
      </Box>
      
      <Box className="analytics-section" sx={{ display: viewMode === 3 ? 'block' : 'none' }}>
        {!isLoading && reportData && (
          <AnalyticsDashboard
            period={period}
            role={roleFilter}
            onRefresh={fetchReports}
          />
        )}
      </Box>
      
      <Box className="analytics-section" sx={{ display: viewMode === 4 ? 'block' : 'none' }}>
        {!isLoading && reportData && (
          <ExportReports
            period={period}
            role={roleFilter}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </Box>
      
      {/* No data message */}
      {!isLoading && !reportData && !error && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No report data available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your filters or selecting a different time period.
          </Typography>
        </Paper>
      )}
    </Box>
  );
} 