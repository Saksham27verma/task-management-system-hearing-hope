import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/Task';
import { useAuth } from './AuthContext';
import { taskService } from '@/services/taskService';

// Context interface
interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  getUserTasks: (userId: string) => Promise<Task[]>;
  addTask: (task: Omit<Task, 'id'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

// Create context with default values
const TaskContext = createContext<TaskContextType>({
  tasks: [],
  isLoading: false,
  error: null,
  fetchTasks: async () => {},
  fetchTaskById: async () => null,
  getUserTasks: async () => [],
  addTask: async () => '',
  updateTask: async () => {},
  deleteTask: async () => {},
});

// Hook to use the task context
export const useTask = () => useContext(TaskContext);

// Add backwards compatibility hook for existing code
export const useTasks = useTask;

interface TaskProviderProps {
  children: ReactNode;
}

// Provider component
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('[TaskContext] Fetching all tasks...');
    try {
      const fetchedTasks = await taskService.getAllTasks();
      console.log(`[TaskContext] Successfully fetched ${fetchedTasks.length} tasks:`, fetchedTasks);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('[TaskContext] Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
      // Initialize with empty array instead of mock data
      setTasks([]);
    } finally {
      setIsLoading(false);
      console.log('[TaskContext] Finished loading tasks');
    }
  }, []);

  // Fetch a single task by ID
  const fetchTaskById = useCallback(async (id: string): Promise<Task | null> => {
    try {
      return await taskService.getTaskById(id);
    } catch (err) {
      console.error(`Error fetching task ${id}:`, err);
      return null;
    }
  }, []);

  // Get tasks for a specific user
  const getUserTasks = useCallback(async (userId: string): Promise<Task[]> => {
    try {
      return await taskService.getUserTasks(userId);
    } catch (err) {
      console.error(`Error fetching tasks for user ${userId}:`, err);
      return [];
    }
  }, []);

  // Add a new task
  const addTask = useCallback(async (task: Omit<Task, 'id'>): Promise<string> => {
    try {
      const taskId = await taskService.addTask(task);
      await fetchTasks(); // Refresh tasks after adding
      return taskId;
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  }, [fetchTasks]);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
    try {
      await taskService.updateTask(id, updates);
      await fetchTasks(); // Refresh tasks after updating
    } catch (err) {
      console.error(`Error updating task ${id}:`, err);
      throw err;
    }
  }, [fetchTasks]);

  // Delete a task
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await taskService.deleteTask(id);
      await fetchTasks(); // Refresh tasks after deleting
    } catch (err) {
      console.error(`Error deleting task ${id}:`, err);
      throw err;
    }
  }, [fetchTasks]);

  // Load tasks on initial render if user is logged in
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const value = {
    tasks,
    isLoading,
    error,
    fetchTasks,
    fetchTaskById,
    getUserTasks,
    addTask,
    updateTask,
    deleteTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}; 