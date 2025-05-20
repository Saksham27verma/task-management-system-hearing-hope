import { Task, TaskStatus, TaskPriority, TaskType } from '@/types/Task';

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  tasks?: T[];
  task?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Extended task type for API responses
interface ApiTask {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdBy: string;
  assignedTo: string[] | any[]; // Can be populated with user objects from the API
  assignedBy?: string | any; // Can be populated with user objects from the API
  createdAt: string | Date;
  updatedAt: string | Date;
  dueDate: string | Date;
  startDate?: string | Date;
  taskType?: string;
  dateRange?: {
    includeSundays?: boolean;
  };
  remarks?: string;
  completedDate?: string | Date;
  progressUpdates?: any[];
}

// Helper function to normalize task status from API to frontend format
function normalizeTaskStatus(apiStatus: string): TaskStatus {
  // The API uses uppercase, our frontend uses lowercase with hyphens
  const statusMap: Record<string, TaskStatus> = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'in-progress',
    'COMPLETED': 'completed',
    'DELAYED': 'overdue',
    'INCOMPLETE': 'overdue'
  };
  
  return statusMap[apiStatus] || 'pending';
}

// Helper function to transform API task to frontend task format
function transformApiTask(apiTask: ApiTask): Task {
  // Extract assignedTo IDs from the API response
  let assignedTo: string[] = [];
  
  if (apiTask.assignedTo) {
    if (Array.isArray(apiTask.assignedTo)) {
      // Check if it's an array of objects or strings
      assignedTo = apiTask.assignedTo.map(u => typeof u === 'object' && u._id ? u._id.toString() : u.toString());
    } else if (typeof apiTask.assignedTo === 'string') {
      assignedTo = [apiTask.assignedTo];
    }
  }
  
  return {
    id: (apiTask._id || apiTask.id || '').toString(),
    title: apiTask.title,
    description: apiTask.description,
    status: normalizeTaskStatus(apiTask.status),
    priority: (apiTask.priority || 'medium').toLowerCase() as TaskPriority,
    createdBy: typeof apiTask.assignedBy === 'object' && apiTask.assignedBy?._id 
      ? apiTask.assignedBy._id.toString()
      : (apiTask.assignedBy || apiTask.createdBy || '').toString(),
    assignedTo: assignedTo,
    createdAt: new Date(apiTask.createdAt),
    updatedAt: new Date(apiTask.updatedAt),
    dueDate: new Date(apiTask.dueDate),
    startDate: apiTask.startDate ? new Date(apiTask.startDate) : undefined,
    taskType: apiTask.taskType as TaskType,
    dateRange: apiTask.dateRange,
    remarks: apiTask.remarks
  };
}

/**
 * Service for task-related API operations
 */
export const taskService = {
  /**
   * Fetch all tasks from the API
   * @returns Promise resolving to an array of tasks
   */
  async getAllTasks(): Promise<Task[]> {
    console.log('[TaskService] Fetching all tasks...');
    
    const response = await fetch('/api/tasks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[TaskService] API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[TaskService] API returned error:', errorData);
      throw new Error(errorData.message || 'Failed to fetch tasks');
    }

    const data: ApiResponse<ApiTask> = await response.json();
    
    if (!data.success || !data.tasks) {
      console.warn('[TaskService] API returned no tasks or unsuccessful response:', data);
      throw new Error(data.message || 'No tasks returned from API');
    }
    
    console.log(`[TaskService] API returned ${data.tasks.length} tasks successfully`);
    
    // Log a sample task for debugging
    if (data.tasks.length > 0) {
      console.log('[TaskService] Sample task from API:', data.tasks[0]);
    }
    
    // Transform the data to match our Task type
    const transformedTasks = data.tasks.map(transformApiTask);
    
    // Log the transformed task
    if (transformedTasks.length > 0) {
      console.log('[TaskService] Sample transformed task:', transformedTasks[0]);
    }
    
    return transformedTasks;
  },

  /**
   * Fetch a single task by ID
   * @param id Task ID to fetch
   * @returns Promise resolving to a task object
   */
  async getTaskById(id: string): Promise<Task | null> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }

    const data: ApiResponse<ApiTask> = await response.json();
    
    if (!data.success || !data.task) {
      return null;
    }
    
    const task = data.task;
    
    return transformApiTask(task);
  },
  
  /**
   * Add a new task
   * @param task Task data to add
   * @returns Promise resolving to the ID of the created task
   */
  async addTask(task: Omit<Task, 'id'>): Promise<string> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add task');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add task');
    }
    
    return data.taskId || '';
  },
  
  /**
   * Update a task
   * @param id Task ID to update
   * @param updates Partial task data to update
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update task');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update task');
    }
  },
  
  /**
   * Delete a task
   * @param id Task ID to delete
   */
  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete task');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete task');
    }
  },
  
  /**
   * Get user tasks by status
   * @param userId User ID to get tasks for
   * @param status Status filter (optional)
   */
  async getUserTasks(userId: string, status?: TaskStatus): Promise<Task[]> {
    const url = new URL('/api/tasks', window.location.origin);
    url.searchParams.append('userId', userId);
    if (status) {
      url.searchParams.append('status', status);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user tasks');
    }

    const data: ApiResponse<ApiTask> = await response.json();
    
    if (!data.success || !data.tasks) {
      return [];
    }
    
    // Transform the data to match our Task type
    return data.tasks.map(transformApiTask);
  }
}; 