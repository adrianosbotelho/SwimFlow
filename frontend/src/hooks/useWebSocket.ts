import { useState, useEffect, useCallback } from 'react';
import webSocketService from '../services/websocketService';

export interface WebSocketState {
  connected: boolean;
  reconnectAttempts: number;
  socketId?: string;
  lastEvent?: {
    type: string;
    data: any;
    timestamp: Date;
  };
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnectAttempts: 0
  });

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    // Initial state
    const connectionState = webSocketService.getConnectionState();
    updateState(connectionState);

    // Listen for WebSocket events
    const unsubscribe = webSocketService.addEventListener((event, data) => {
      const timestamp = new Date();
      
      switch (event) {
        case 'connected':
          updateState({
            connected: true,
            reconnectAttempts: 0,
            lastEvent: { type: event, data, timestamp }
          });
          break;
          
        case 'disconnected':
          updateState({
            connected: false,
            lastEvent: { type: event, data, timestamp }
          });
          break;
          
        case 'error':
          updateState({
            lastEvent: { type: event, data, timestamp }
          });
          break;
          
        case 'max_reconnect_attempts':
          updateState({
            connected: false,
            lastEvent: { type: event, data, timestamp }
          });
          break;
          
        default:
          updateState({
            lastEvent: { type: event, data, timestamp }
          });
      }
    });

    return unsubscribe;
  }, [updateState]);

  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const subscribeToStudent = useCallback((studentId: string) => {
    webSocketService.subscribeToStudent(studentId);
  }, []);

  const unsubscribeFromStudent = useCallback((studentId: string) => {
    webSocketService.unsubscribeFromStudent(studentId);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    subscribeToStudent,
    unsubscribeFromStudent,
    isConnected: state.connected
  };
}

// Hook for listening to specific events
export function useWebSocketEvent(
  eventType: string,
  callback: (data: any) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unsubscribe = webSocketService.addEventListener((event, data) => {
      if (event === eventType) {
        callback(data);
      }
    });

    return unsubscribe;
  }, [eventType, callback, ...dependencies]);
}

// Hook for student-specific events
export function useStudentWebSocketEvents(
  studentId: string,
  onEvaluationChange?: (data: any) => void,
  onStudentChange?: (data: any) => void
) {
  const { subscribeToStudent, unsubscribeFromStudent } = useWebSocket();

  useEffect(() => {
    if (studentId) {
      subscribeToStudent(studentId);
      
      return () => {
        unsubscribeFromStudent(studentId);
      };
    }
  }, [studentId, subscribeToStudent, unsubscribeFromStudent]);

  useWebSocketEvent('evaluation:changed', (data) => {
    if (data.studentId === studentId && onEvaluationChange) {
      onEvaluationChange(data);
    }
  }, [studentId, onEvaluationChange]);

  useWebSocketEvent('student:changed', (data) => {
    if (data.studentId === studentId && onStudentChange) {
      onStudentChange(data);
    }
  }, [studentId, onStudentChange]);
}