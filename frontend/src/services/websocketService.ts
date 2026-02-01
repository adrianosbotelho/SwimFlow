import { io, Socket } from 'socket.io-client';
import chartCacheService from './chartCacheService';
import evolutionService from './evolutionService';

interface EvaluationChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  studentId: string;
  evaluationId: string;
  timestamp: string;
  data?: any;
}

interface StudentChangeEvent {
  type: 'level_changed' | 'profile_updated';
  studentId: string;
  timestamp: string;
  data?: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Set<(event: string, data: any) => void>();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyListeners('connected', {});
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyListeners('disconnected', { reason });
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.notifyListeners('error', { error: error.message });
      this.attemptReconnect();
    });

    // Listen for evaluation changes
    this.socket.on('evaluation:changed', (event: EvaluationChangeEvent) => {
      console.log('Evaluation changed:', event);
      
      // Invalidate cache for the affected student
      chartCacheService.invalidateStudent(event.studentId);
      evolutionService.invalidateStudentCache(event.studentId);
      
      this.notifyListeners('evaluation:changed', event);
    });

    // Listen for student changes
    this.socket.on('student:changed', (event: StudentChangeEvent) => {
      console.log('Student changed:', event);
      
      // Invalidate cache for the affected student
      chartCacheService.invalidateStudent(event.studentId);
      evolutionService.invalidateStudentCache(event.studentId);
      
      this.notifyListeners('student:changed', event);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.notifyListeners('error', { error });
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('max_reconnect_attempts', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect();
      }
    }, delay);
  }

  // Subscribe to specific student updates
  subscribeToStudent(studentId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:student', studentId);
    }
  }

  // Unsubscribe from specific student updates
  unsubscribeFromStudent(studentId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:student', studentId);
    }
  }

  // Add event listener
  addEventListener(callback: (event: string, data: any) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): {
    connected: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Auto-connect when token is available
const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
if (token) {
  webSocketService.connect();
}

// Listen for token changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      if (e.newValue) {
        webSocketService.connect();
      } else {
        webSocketService.disconnect();
      }
    }
  });
}

export default webSocketService;