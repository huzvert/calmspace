import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { API_ENDPOINTS } from './config';

export const useSignalR = (userId) => {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!userId) return; // Only check if userId exists, allow 'demo-user'

    const newConnection = new HubConnectionBuilder()
      .withUrl(API_ENDPOINTS.SIGNALR_NEGOTIATE, {
        withCredentials: false,
        timeout: 30000, // 30 seconds timeout
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Custom retry delays
      .configureLogging(LogLevel.Error) // Only show actual errors
      .build();

    connectionRef.current = newConnection;

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log('SignalR Connected!');
        setIsConnected(true);
        setConnection(newConnection);

        // Join user-specific group (remove this call for now)
        // await newConnection.invoke('JoinUserGroup', userId);
        console.log('✅ SignalR connection established, ready for real-time updates');

        // Listen for real-time mood updates (from CreateMoodEntry - broadcasts to all)
        newConnection.on('moodupdated', (data) => {
          console.log('✅ Real-time mood update received:', data);
          setMessages(prev => [...prev, {
            type: 'mood_update',
            data,
            timestamp: new Date()
          }]);
        });

        // Listen for stats updates (from SignalRBroadcast function)
        newConnection.on('StatsUpdated', (stats) => {
          console.log('✅ Real-time stats update received:', stats);
          setMessages(prev => [...prev, {
            type: 'stats_update',
            data: stats,
            timestamp: new Date()
          }]);
        });

        // Listen for notifications (from SignalRBroadcast function)
        newConnection.on('NotificationReceived', (notification) => {
          console.log('✅ Real-time notification received:', notification);
          setMessages(prev => [...prev, {
            type: 'notification',
            data: notification,
            timestamp: new Date()
          }]);
        });

        // Debug: Connection closed handler
        newConnection.onclose((error) => {
          console.log('SignalR connection closed:', error?.toString() || 'Connection closed gracefully');
          setIsConnected(false);
        });

        // Debug: Reconnecting handler
        newConnection.onreconnecting((error) => {
          console.log('SignalR reconnecting...', error?.toString() || '');
          setIsConnected(false);
        });

        // Debug: Reconnected handler
        newConnection.onreconnected((connectionId) => {
          console.log('✅ SignalR reconnected! ConnectionId:', connectionId);
          setIsConnected(true);
        });

      } catch (error) {
        // Suppress common negotiation errors - they're part of normal SignalR connection process
        if (error.toString().includes('connection was stopped during negotiation')) {
          console.log('⏳ SignalR negotiating connection...');
        } else {
          console.error('SignalR Connection Error:', error);
        }
        setIsConnected(false);
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        setIsConnected(false);
        setConnection(null);
      }
    };
  }, [userId]);

  return {
    connection,
    isConnected,
    messages,
    clearMessages: () => setMessages([])
  };
};
