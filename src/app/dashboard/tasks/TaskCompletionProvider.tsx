'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useConfetti } from '@/contexts/ConfettiContext';
import { useRouter } from 'next/navigation';

type TaskCompletionContextType = {
  completeTask: (taskId: string, event?: React.MouseEvent) => Promise<boolean>;
  isCompletingTask: boolean;
};

const TaskCompletionContext = createContext<TaskCompletionContextType>({
  completeTask: async () => false,
  isCompletingTask: false,
});

export const useTaskCompletion = () => useContext(TaskCompletionContext);

type TaskCompletionProviderProps = {
  children: ReactNode;
};

export const TaskCompletionProvider: React.FC<TaskCompletionProviderProps> = ({ children }) => {
  const { showConfetti } = useConfetti();
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const router = useRouter();

  const completeTask = async (taskId: string, event?: React.MouseEvent): Promise<boolean> => {
    // Store click position for confetti
    const clickPosition = event ? {
      x: event.clientX,
      y: event.clientY
    } : undefined;
    
    setIsCompletingTask(true);
    
    try {
      // Make API request to mark the task as complete
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark task as complete');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Show confetti animation
        showConfetti({
          x: clickPosition?.x,
          y: clickPosition?.y,
          pieces: 300,
          duration: 5000
        });
        
        // Refresh data
        router.refresh();
        
        return true;
      } else {
        throw new Error(data.message || 'Failed to mark task as complete');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    } finally {
      setIsCompletingTask(false);
    }
  };

  return (
    <TaskCompletionContext.Provider value={{ completeTask, isCompletingTask }}>
      {children}
    </TaskCompletionContext.Provider>
  );
}; 