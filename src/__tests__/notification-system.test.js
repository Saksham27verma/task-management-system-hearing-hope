/**
 * @jest-environment jsdom
 */

import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import { useNotificationSync } from '../hooks/useNotificationSync';
import NotificationBell from '../components/notifications/NotificationBell';
import React, { useEffect } from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the fetch API
global.fetch = jest.fn();

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minutes ago'),
}));

// Notification test component
const NotificationTester = ({ action }) => {
  const { 
    notifications, 
    addNotification, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications, 
    unreadCount 
  } = useNotifications();

  useEffect(() => {
    if (action === 'add') {
      addNotification({
        type: 'task',
        title: 'Test Notification',
        message: 'This is a test notification',
        read: false
      });
    } else if (action === 'mark-read' && notifications.length > 0) {
      markAsRead(notifications[0].id);
    } else if (action === 'mark-all-read') {
      markAllAsRead();
    } else if (action === 'clear') {
      clearNotifications();
    }
  }, [action, addNotification, markAsRead, markAllAsRead, clearNotifications, notifications]);

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <ul>
        {notifications.map(n => (
          <li key={n.id} data-testid={`notification-${n.id}`}>
            {n.title} - {n.read ? 'Read' : 'Unread'}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Setup mock response for fetch
const setupFetchMock = (success = true, notifications = []) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      success,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    }),
  });
};

describe('Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('Should add and display notifications', async () => {
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Check if notification was added
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
      expect(screen.getByTestId('unread-count').textContent).toBe('1');
    });
  });

  test('Should mark notifications as read', async () => {
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Wait for notification to be added
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });

    // Re-render with action to mark as read
    await act(async () => {
      render(
        <NotificationProvider>
          <NotificationTester action="mark-read" />
        </NotificationProvider>
      );
    });

    // Check if notification is marked as read
    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('0');
    });
  });

  test('Should mark all notifications as read', async () => {
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Add first notification and wait
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });

    // Add a second notification
    await act(async () => {
      render(
        <NotificationProvider>
          <NotificationTester action="add" />
        </NotificationProvider>
      );
    });

    // Verify we have 2 notifications, both unread
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('2');
      expect(screen.getByTestId('unread-count').textContent).toBe('2');
    });

    // Mark all as read
    await act(async () => {
      render(
        <NotificationProvider>
          <NotificationTester action="mark-all-read" />
        </NotificationProvider>
      );
    });

    // Verify all are marked as read
    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('0');
      expect(screen.getByTestId('notification-count').textContent).toBe('2');
    });
  });

  test('Should clear all notifications', async () => {
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Add notification and wait
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });

    // Clear notifications
    await act(async () => {
      render(
        <NotificationProvider>
          <NotificationTester action="clear" />
        </NotificationProvider>
      );
    });

    // Verify notifications are cleared
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('0');
      expect(screen.getByTestId('unread-count').textContent).toBe('0');
    });
  });

  test('Should persist notifications to localStorage', async () => {
    // Render and add notification
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Wait for notification to be added
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });

    // Check if localStorage was updated
    const savedNotifications = JSON.parse(localStorage.getItem('notifications'));
    expect(savedNotifications).toHaveLength(1);
    expect(savedNotifications[0].title).toBe('Test Notification');
    expect(savedNotifications[0].read).toBe(false);
  });

  test('Should sync with server notifications', async () => {
    // Mock server response
    setupFetchMock(true, [
      {
        _id: 'server-notification-1',
        userId: 'test-user',
        type: 'task',
        title: 'Server Notification',
        message: 'This came from the server',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'server-notification-2',
        userId: 'test-user',
        type: 'notice',
        title: 'Read Server Notification',
        message: 'This is already read',
        read: true,
        createdAt: new Date().toISOString()
      }
    ]);

    // Create a component that uses the sync hook
    const SyncTester = () => {
      const { refreshNotifications } = useNotificationSync();
      const { notifications, unreadCount } = useNotifications();

      useEffect(() => {
        refreshNotifications();
      }, [refreshNotifications]);

      return (
        <div>
          <div data-testid="notification-count">{notifications.length}</div>
          <div data-testid="unread-count">{unreadCount}</div>
          <ul>
            {notifications.map(n => (
              <li key={n.id} data-testid={`notification-${n.id}`}>
                {n.title} - {n.read ? 'Read' : 'Unread'}
              </li>
            ))}
          </ul>
        </div>
      );
    };

    // Render the component
    render(
      <NotificationProvider>
        <SyncTester />
      </NotificationProvider>
    );

    // Wait for the fetch to complete and update the state
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('notification-count').textContent).toBe('2');
      expect(screen.getByTestId('unread-count').textContent).toBe('1');
    });
  });

  test('NotificationBell shows unread count badge', async () => {
    // Add some notifications first
    render(
      <NotificationProvider>
        <NotificationTester action="add" />
      </NotificationProvider>
    );

    // Wait for notification to be added
    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('1');
    });

    // Render the bell component
    render(
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    );

    // Verify the bell is rendered with the badge
    const bellElement = screen.getByTestId('notification-bell');
    expect(bellElement).toBeInTheDocument();

    // The badge is within the bell component
    const badgeText = document.querySelector('.MuiBadge-badge');
    expect(badgeText).toBeInTheDocument();
    expect(badgeText.textContent).toBe('1');
  });
}); 