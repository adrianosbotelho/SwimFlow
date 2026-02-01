import { EventEmitter } from 'events';

export interface EvaluationEvent {
  type: 'created' | 'updated' | 'deleted';
  studentId: string;
  evaluationId: string;
  timestamp: Date;
  data?: any;
}

export interface StudentEvent {
  type: 'level_changed' | 'profile_updated';
  studentId: string;
  timestamp: Date;
  data?: any;
}

class EventService extends EventEmitter {
  // Evaluation events
  emitEvaluationCreated(studentId: string, evaluationId: string, data?: any): void {
    const event: EvaluationEvent = {
      type: 'created',
      studentId,
      evaluationId,
      timestamp: new Date(),
      data
    };
    
    this.emit('evaluation:created', event);
    this.emit(`evaluation:created:${studentId}`, event);
    this.emit('evaluation:changed', event);
    this.emit(`evaluation:changed:${studentId}`, event);
  }

  emitEvaluationUpdated(studentId: string, evaluationId: string, data?: any): void {
    const event: EvaluationEvent = {
      type: 'updated',
      studentId,
      evaluationId,
      timestamp: new Date(),
      data
    };
    
    this.emit('evaluation:updated', event);
    this.emit(`evaluation:updated:${studentId}`, event);
    this.emit('evaluation:changed', event);
    this.emit(`evaluation:changed:${studentId}`, event);
  }

  emitEvaluationDeleted(studentId: string, evaluationId: string, data?: any): void {
    const event: EvaluationEvent = {
      type: 'deleted',
      studentId,
      evaluationId,
      timestamp: new Date(),
      data
    };
    
    this.emit('evaluation:deleted', event);
    this.emit(`evaluation:deleted:${studentId}`, event);
    this.emit('evaluation:changed', event);
    this.emit(`evaluation:changed:${studentId}`, event);
  }

  // Student events
  emitStudentLevelChanged(studentId: string, data?: any): void {
    const event: StudentEvent = {
      type: 'level_changed',
      studentId,
      timestamp: new Date(),
      data
    };
    
    this.emit('student:level_changed', event);
    this.emit(`student:level_changed:${studentId}`, event);
    this.emit('student:changed', event);
    this.emit(`student:changed:${studentId}`, event);
  }

  emitStudentProfileUpdated(studentId: string, data?: any): void {
    const event: StudentEvent = {
      type: 'profile_updated',
      studentId,
      timestamp: new Date(),
      data
    };
    
    this.emit('student:profile_updated', event);
    this.emit(`student:profile_updated:${studentId}`, event);
    this.emit('student:changed', event);
    this.emit(`student:changed:${studentId}`, event);
  }

  // Listener helpers
  onEvaluationChanged(callback: (event: EvaluationEvent) => void): () => void {
    this.on('evaluation:changed', callback);
    return () => this.off('evaluation:changed', callback);
  }

  onStudentEvaluationChanged(studentId: string, callback: (event: EvaluationEvent) => void): () => void {
    const eventName = `evaluation:changed:${studentId}`;
    this.on(eventName, callback);
    return () => this.off(eventName, callback);
  }

  onStudentChanged(studentId: string, callback: (event: StudentEvent) => void): () => void {
    const eventName = `student:changed:${studentId}`;
    this.on(eventName, callback);
    return () => this.off(eventName, callback);
  }

  // Get event statistics
  getEventStats(): {
    totalListeners: number;
    eventNames: string[];
    listenerCounts: { [eventName: string]: number };
  } {
    const eventNames = this.eventNames() as string[];
    const listenerCounts: { [eventName: string]: number } = {};
    let totalListeners = 0;

    eventNames.forEach(eventName => {
      const count = this.listenerCount(eventName);
      listenerCounts[eventName] = count;
      totalListeners += count;
    });

    return {
      totalListeners,
      eventNames,
      listenerCounts
    };
  }

  // Cleanup old listeners (prevent memory leaks)
  cleanup(): void {
    const stats = this.getEventStats();
    console.log('EventService cleanup - Current stats:', stats);
    
    // Remove all listeners for events with no recent activity
    // This is a simple cleanup - in production you might want more sophisticated logic
    this.removeAllListeners();
  }
}

// Create singleton instance
const eventService = new EventService();

// Set max listeners to prevent warnings
eventService.setMaxListeners(100);

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const stats = eventService.getEventStats();
  if (stats.totalListeners > 50) {
    console.warn('EventService has many listeners:', stats.totalListeners);
  }
}, 60000); // Check every minute

export default eventService;