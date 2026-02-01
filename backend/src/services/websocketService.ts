import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import eventService, { EvaluationEvent, StudentEvent } from './eventService';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  userRole: string;
  studentIds?: string[]; // For professors, list of students they can access
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private authenticatedSockets = new Map<string, AuthenticatedSocket>();

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Store authenticated socket info
        this.authenticatedSockets.set(socket.id, {
          id: socket.id,
          userId: decoded.userId,
          userRole: decoded.role,
          studentIds: decoded.studentIds // If professor, list of accessible students
        });

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      const authSocket = this.authenticatedSockets.get(socket.id);
      if (!authSocket) {
        socket.disconnect();
        return;
      }

      // Join user-specific room
      socket.join(`user:${authSocket.userId}`);
      
      // If professor, join rooms for accessible students
      if (authSocket.userRole === 'professor' && authSocket.studentIds) {
        authSocket.studentIds.forEach(studentId => {
          socket.join(`student:${studentId}`);
        });
      }

      // If admin, join all rooms (be careful with this in production)
      if (authSocket.userRole === 'admin') {
        socket.join('admin');
      }

      // Handle client requests for specific student data
      socket.on('subscribe:student', (studentId: string) => {
        if (this.canAccessStudent(authSocket, studentId)) {
          socket.join(`student:${studentId}`);
          console.log(`Socket ${socket.id} subscribed to student ${studentId}`);
        } else {
          socket.emit('error', { message: 'Access denied to student data' });
        }
      });

      socket.on('unsubscribe:student', (studentId: string) => {
        socket.leave(`student:${studentId}`);
        console.log(`Socket ${socket.id} unsubscribed from student ${studentId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.authenticatedSockets.delete(socket.id);
      });
    });

    // Listen to evaluation events and broadcast to relevant clients
    this.setupEventListeners();
  }

  private canAccessStudent(authSocket: AuthenticatedSocket, studentId: string): boolean {
    // Admin can access all students
    if (authSocket.userRole === 'admin') {
      return true;
    }

    // Professor can access their assigned students
    if (authSocket.userRole === 'professor' && authSocket.studentIds) {
      return authSocket.studentIds.includes(studentId);
    }

    return false;
  }

  private setupEventListeners(): void {
    // Listen for evaluation changes
    eventService.onEvaluationChanged((event: EvaluationEvent) => {
      this.broadcastToStudentSubscribers(event.studentId, 'evaluation:changed', {
        type: event.type,
        studentId: event.studentId,
        evaluationId: event.evaluationId,
        timestamp: event.timestamp,
        data: event.data
      });
    });

    // Listen for student changes
    eventService.on('student:changed', (event: StudentEvent) => {
      this.broadcastToStudentSubscribers(event.studentId, 'student:changed', {
        type: event.type,
        studentId: event.studentId,
        timestamp: event.timestamp,
        data: event.data
      });
    });
  }

  private broadcastToStudentSubscribers(studentId: string, eventName: string, data: any): void {
    if (!this.io) return;

    // Broadcast to all clients subscribed to this student
    this.io.to(`student:${studentId}`).emit(eventName, data);
    
    // Also broadcast to admin room
    this.io.to('admin').emit(eventName, data);
  }

  // Public methods for manual broadcasting
  broadcastEvaluationUpdate(studentId: string, data: any): void {
    this.broadcastToStudentSubscribers(studentId, 'evaluation:updated', data);
  }

  broadcastStudentUpdate(studentId: string, data: any): void {
    this.broadcastToStudentSubscribers(studentId, 'student:updated', data);
  }

  // Get connection statistics
  getStats(): {
    connectedClients: number;
    authenticatedClients: number;
    roomCounts: { [room: string]: number };
  } {
    if (!this.io) {
      return { connectedClients: 0, authenticatedClients: 0, roomCounts: {} };
    }

    const roomCounts: { [room: string]: number } = {};
    
    // Get room information
    this.io.sockets.adapter.rooms.forEach((sockets, room) => {
      // Skip individual socket rooms
      if (!sockets.has(room)) {
        roomCounts[room] = sockets.size;
      }
    });

    return {
      connectedClients: this.io.sockets.sockets.size,
      authenticatedClients: this.authenticatedSockets.size,
      roomCounts
    };
  }

  // Cleanup method
  cleanup(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.authenticatedSockets.clear();
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;