import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Store active connections
const activeConnections = new Map();
const deliveryAgentRooms = new Map();

export const setupSocketHandlers = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.user.role})`);
    
    // Store connection
    activeConnections.set(socket.userId, socket);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Handle delivery agent specific events
    if (socket.user.role === 'delivery_agent') {
      handleDeliveryAgentConnection(socket);
    }

    // Handle customer tracking events
    socket.on('join_tracking_room', (orderId) => {
      socket.join(`tracking_${orderId}`);
      console.log(`User ${socket.userId} joined tracking room for order ${orderId}`);
    });

    socket.on('leave_tracking_room', (orderId) => {
      socket.leave(`tracking_${orderId}`);
      console.log(`User ${socket.userId} left tracking room for order ${orderId}`);
    });

    // Handle location updates from delivery agents
    socket.on('location_update', async (data) => {
      try {
        const { latitude, longitude, accuracy, assignmentId } = data;
        
        // Validate coordinates
        if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          socket.emit('error', { message: 'Invalid coordinates' });
          return;
        }

        // Update user's location in database
        await User.findByIdAndUpdate(socket.userId, {
          'currentLocation.latitude': latitude,
          'currentLocation.longitude': longitude,
          'currentLocation.accuracy': accuracy || null,
          'currentLocation.lastUpdated': new Date(),
          'currentLocation.isOnline': true
        });

        // Get assignment details
        const assignment = await Order.findById(assignmentId).populate('assignedDeliveryAgent', 'firstName lastName currentLocation');
        
        if (assignment) {
          // Emit location update to tracking room
          io.to(`tracking_${assignmentId}`).emit('location_updated', {
            deliveryAgentId: socket.userId,
            deliveryAgentName: `${socket.user.firstName} ${socket.user.lastName}`,
            location: {
              latitude,
              longitude,
              accuracy,
              lastUpdated: new Date()
            },
            orderId: assignmentId
          });

          // Emit to delivery agent's own room for confirmation
          socket.emit('location_update_confirmed', {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date()
          });
        }

        console.log(`Location updated for delivery agent ${socket.userId}: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle delivery status updates
    socket.on('delivery_status_update', async (data) => {
      try {
        const { assignmentId, status, notes } = data;
        
        // Emit status update to tracking room
        io.to(`tracking_${assignmentId}`).emit('delivery_status_updated', {
          assignmentId,
          status,
          notes,
          timestamp: new Date(),
          deliveryAgentName: `${socket.user.firstName} ${socket.user.lastName}`
        });

        console.log(`Delivery status updated for assignment ${assignmentId}: ${status}`);
      } catch (error) {
        console.error('Delivery status update error:', error);
        socket.emit('error', { message: 'Failed to update delivery status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // If delivery agent, set offline status
      if (socket.user.role === 'delivery_agent') {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            'currentLocation.isOnline': false
          });
          
          // Notify any tracking rooms that agent went offline
          deliveryAgentRooms.forEach((room, orderId) => {
            if (room.deliveryAgentId === socket.userId) {
              io.to(`tracking_${orderId}`).emit('delivery_agent_offline', {
                deliveryAgentId: socket.userId,
                deliveryAgentName: `${socket.user.firstName} ${socket.user.lastName}`,
                timestamp: new Date()
              });
            }
          });
        } catch (error) {
          console.error('Error setting delivery agent offline:', error);
        }
      }
    });
  });
};

const handleDeliveryAgentConnection = (socket) => {
  console.log(`Delivery agent connected: ${socket.userId}`);
  
  // Set delivery agent online
  User.findByIdAndUpdate(socket.userId, {
    'currentLocation.isOnline': true
  }).catch(error => {
    console.error('Error setting delivery agent online:', error);
  });

  // Handle joining delivery agent room
  socket.on('join_delivery_agent_room', (assignmentId) => {
    socket.join(`delivery_agent_${assignmentId}`);
    deliveryAgentRooms.set(assignmentId, {
      deliveryAgentId: socket.userId,
      socketId: socket.id,
      joinedAt: new Date()
    });
    console.log(`Delivery agent ${socket.userId} joined room for assignment ${assignmentId}`);
  });

  // Handle leaving delivery agent room
  socket.on('leave_delivery_agent_room', (assignmentId) => {
    socket.leave(`delivery_agent_${assignmentId}`);
    deliveryAgentRooms.delete(assignmentId);
    console.log(`Delivery agent ${socket.userId} left room for assignment ${assignmentId}`);
  });
};

// Utility function to emit to specific user
export const emitToUser = (userId, event, data) => {
  const socket = activeConnections.get(userId);
  if (socket) {
    socket.emit(event, data);
  }
};

// Utility function to emit to tracking room
export const emitToTrackingRoom = (io, orderId, event, data) => {
  io.to(`tracking_${orderId}`).emit(event, data);
};

// Utility function to get active delivery agents
export const getActiveDeliveryAgents = () => {
  return Array.from(activeConnections.values())
    .filter(socket => socket.user.role === 'delivery_agent')
    .map(socket => ({
      userId: socket.userId,
      name: `${socket.user.firstName} ${socket.user.lastName}`,
      connectedAt: socket.handshake.time
    }));
};
