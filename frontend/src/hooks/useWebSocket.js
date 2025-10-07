import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    try {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setConnectionError(error.message);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        try {
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
        } catch (error) {
          console.error('Error disconnecting WebSocket:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setConnectionError('Failed to initialize WebSocket connection');
    }
  }, [token]);

  return {
    socket,
    isConnected,
    connectionError,
    reconnect: () => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }
  };
};

export const useLocationTracking = (assignmentId, onLocationUpdate) => {
  const { socket, isConnected } = useWebSocket();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (!socket || !assignmentId) return;

    try {
      // Join tracking room
      socket.emit('join_tracking_room', assignmentId);

      // Listen for location updates
      const handleLocationUpdate = (data) => {
        try {
          setCurrentLocation(data.location);
          if (onLocationUpdate && typeof onLocationUpdate === 'function') {
            onLocationUpdate(data);
          }
        } catch (error) {
          console.error('Error handling location update:', error);
        }
      };

      socket.on('location_updated', handleLocationUpdate);

      return () => {
        try {
          socket.emit('leave_tracking_room', assignmentId);
          socket.off('location_updated', handleLocationUpdate);
        } catch (error) {
          console.error('Error cleaning up location tracking:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up location tracking:', error);
    }
  }, [socket, assignmentId, onLocationUpdate]);

  const startTracking = () => {
    if (socket && assignmentId) {
      socket.emit('join_delivery_agent_room', assignmentId);
      setIsTracking(true);
    }
  };

  const stopTracking = () => {
    if (socket && assignmentId) {
      socket.emit('leave_delivery_agent_room', assignmentId);
      setIsTracking(false);
    }
  };

  const updateLocation = (locationData) => {
    if (socket && assignmentId) {
      socket.emit('location_update', {
        ...locationData,
        assignmentId
      });
    }
  };

  return {
    isTracking,
    currentLocation,
    startTracking,
    stopTracking,
    updateLocation,
    isConnected
  };
};

export const useDeliveryTracking = (orderId) => {
  const { socket, isConnected } = useWebSocket();
  const [deliveryAgentLocation, setDeliveryAgentLocation] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [isAgentOnline, setIsAgentOnline] = useState(false);

  useEffect(() => {
    if (!socket || !orderId) return;

    // Join tracking room for this order
    socket.emit('join_tracking_room', orderId);

    // Listen for location updates
    const handleLocationUpdate = (data) => {
      setDeliveryAgentLocation(data.location);
      setIsAgentOnline(true);
    };

    // Listen for status updates
    const handleStatusUpdate = (data) => {
      setDeliveryStatus(data);
    };

    // Listen for agent going offline
    const handleAgentOffline = (data) => {
      setIsAgentOnline(false);
    };

    socket.on('location_updated', handleLocationUpdate);
    socket.on('delivery_status_updated', handleStatusUpdate);
    socket.on('delivery_agent_offline', handleAgentOffline);

    return () => {
      socket.emit('leave_tracking_room', orderId);
      socket.off('location_updated', handleLocationUpdate);
      socket.off('delivery_status_updated', handleStatusUpdate);
      socket.off('delivery_agent_offline', handleAgentOffline);
    };
  }, [socket, orderId]);

  return {
    deliveryAgentLocation,
    deliveryStatus,
    isAgentOnline,
    isConnected
  };
};
