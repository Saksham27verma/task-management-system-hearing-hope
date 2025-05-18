'use client';

import React, { ReactNode } from 'react';
import { TaskCompletionProvider } from './TaskCompletionProvider';

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <TaskCompletionProvider>
      {children}
    </TaskCompletionProvider>
  );
} 