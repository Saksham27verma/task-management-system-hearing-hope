import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  useTheme,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ScriptableContext
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, PolarArea } from 'react-chartjs-2';
import { format, subDays, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsDashboardProps {
  period: string;
  role: string;
  onRefresh: () => void;
}

interface TaskData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  completionRate: number;
  onTimeRate: number;
  tasksByPriority: Record<string, number>;
  tasksByType: Record<string, number>;
  taskCompletionByWeek: Record<string, number>;
  taskCreationByWeek: Record<string, number>;
  tasksByStatus: Record<string, number>;
  avgCompletionTime: number;
  userProductivity: Record<string, { completed: number, assigned: number }>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  period,
  role,
  onRefresh
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TaskData | null>(null);
  const [chartType, setChartType] = useState<string>('completion');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [period, role]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (period) queryParams.append('period', period);
      if (role) queryParams.append('role', role);

      // Add a timestamp to prevent caching
      queryParams.append('_t', Date.now().toString());

      console.log('Fetching analytics data with params:', queryParams.toString());
      const response = await fetch(`/api/reports/analytics?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch analytics data: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('Analytics data fetched successfully:', result);
        setData(result.data);
      } else {
        setError(result.message || 'Error fetching analytics data');
        console.error('Error fetching analytics data:', result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error connecting to analytics service';
      setError(errorMessage);
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Colors for charts
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    // Lighter variants
    primaryLight: theme.palette.primary.light,
    secondaryLight: theme.palette.secondary.light,
    successLight: theme.palette.success.light,
    warningLight: theme.palette.warning.light,
    errorLight: theme.palette.error.light,
    infoLight: theme.palette.info.light,
  };

  // If no data is available yet
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Advanced Analytics Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, md: 6 }} key={item}>
              <Paper sx={{ p: 2, height: '300px' }}>
                <Skeleton variant="rectangular" height={250} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Advanced Analytics Dashboard
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Unable to load analytics data'}
        </Alert>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>
                Analytics data is unavailable. Please try again later.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Task Status Distribution Chart (Pie)
  const statusDistributionData = {
    labels: Object.keys(data.tasksByStatus),
    datasets: [
      {
        data: Object.values(data.tasksByStatus),
        backgroundColor: [
          chartColors.success,
          chartColors.warning,
          chartColors.info,
          chartColors.error
        ],
        borderWidth: 1,
      },
    ],
  };

  // Task Completion Trend (Line)
  const taskCompletionTrendData = {
    labels: Object.keys(data.taskCompletionByWeek),
    datasets: [
      {
        label: 'Tasks Completed',
        data: Object.values(data.taskCompletionByWeek),
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}33`, // With alpha
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Tasks Created',
        data: Object.values(data.taskCreationByWeek),
        borderColor: chartColors.secondary,
        backgroundColor: `${chartColors.secondary}33`, // With alpha
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Task Priority Distribution (Bar)
  const priorityDistributionData = {
    labels: Object.keys(data.tasksByPriority),
    datasets: [
      {
        label: 'Tasks by Priority',
        data: Object.values(data.tasksByPriority),
        backgroundColor: [
          chartColors.error,
          chartColors.warning,
          chartColors.success,
        ],
      },
    ],
  };

  // Task Type Distribution (Doughnut)
  const typeDistributionData = {
    labels: Object.keys(data.tasksByType),
    datasets: [
      {
        data: Object.values(data.tasksByType),
        backgroundColor: [
          chartColors.primary,
          chartColors.error,
          chartColors.info,
          chartColors.secondary
        ],
        borderWidth: 1,
      },
    ],
  };

  // User Productivity Chart (Bar)
  const userProductivityData = {
    labels: Object.keys(data.userProductivity),
    datasets: [
      {
        label: 'Completed Tasks',
        data: Object.keys(data.userProductivity).map(
          (user) => data.userProductivity[user].completed
        ),
        backgroundColor: chartColors.success,
      },
      {
        label: 'Assigned Tasks',
        data: Object.keys(data.userProductivity).map(
          (user) => data.userProductivity[user].assigned
        ),
        backgroundColor: chartColors.info,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Advanced Analytics Dashboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: `${chartColors.primary}22`,
                borderLeft: `4px solid ${chartColors.primary}`,
              }}
            >
              <Typography variant="h6">{data.totalTasks}</Typography>
              <Typography variant="body2">Total Tasks</Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: `${chartColors.success}22`,
                borderLeft: `4px solid ${chartColors.success}`,
              }}
            >
              <Typography variant="h6">{data.completedTasks}</Typography>
              <Typography variant="body2">Completed Tasks</Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: `${chartColors.warning}22`,
                borderLeft: `4px solid ${chartColors.warning}`,
              }}
            >
              <Typography variant="h6">{data.completionRate.toFixed(1)}%</Typography>
              <Typography variant="body2">Completion Rate</Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: `${chartColors.info}22`,
                borderLeft: `4px solid ${chartColors.info}`,
              }}
            >
              <Typography variant="h6">{data.onTimeRate.toFixed(1)}%</Typography>
              <Typography variant="body2">On-Time Rate</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <FormControl sx={{ mb: 3, minWidth: 200 }}>
        <InputLabel id="chart-type-label">Chart Type</InputLabel>
        <Select
          labelId="chart-type-label"
          id="chart-type-select"
          value={chartType}
          label="Chart Type"
          onChange={handleChartTypeChange}
        >
          <MenuItem value="completion">Task Completion Trend</MenuItem>
          <MenuItem value="status">Status Distribution</MenuItem>
          <MenuItem value="priority">Priority Distribution</MenuItem>
          <MenuItem value="type">Task Type Distribution</MenuItem>
          <MenuItem value="productivity">User Productivity</MenuItem>
        </Select>
      </FormControl>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {chartType === 'completion' && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                Task Completion Trend
              </Typography>
              <Box sx={{ height: 'calc(100% - 30px)' }}>
                <Line data={taskCompletionTrendData} options={lineChartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}
        
        {chartType === 'status' && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                Task Status Distribution
              </Typography>
              <Box sx={{ height: 'calc(100% - 30px)', display: 'flex', justifyContent: 'center' }}>
                <Pie data={statusDistributionData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}
        
        {chartType === 'priority' && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                Task Priority Distribution
              </Typography>
              <Box sx={{ height: 'calc(100% - 30px)' }}>
                <Bar data={priorityDistributionData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}
        
        {chartType === 'type' && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                Task Type Distribution
              </Typography>
              <Box sx={{ height: 'calc(100% - 30px)', display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={typeDistributionData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}
        
        {chartType === 'productivity' && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom>
                User Productivity
              </Typography>
              <Box sx={{ height: 'calc(100% - 30px)' }}>
                <Bar data={userProductivityData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 