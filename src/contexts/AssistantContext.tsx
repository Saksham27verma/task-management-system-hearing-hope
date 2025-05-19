import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};

interface AssistantProviderProps {
  children: ReactNode;
}

export const AssistantProvider = ({ children }: AssistantProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current user from your AuthContext
  const { user } = useAuth();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Get user context data
        const userContext = {
          userId: user?.id || '',
          role: user?.role || '',
          activeTaskCount: 0,
        };

        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            history: messages,
            userContext,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from assistant');
        }

        const data = await response.json();

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Assistant error:', error);
        
        const errorMessage: Message = {
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error processing your request. Please try again later.",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, user]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const value = {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
  };

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}; 