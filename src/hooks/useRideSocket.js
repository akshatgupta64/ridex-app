import { useState, useEffect, useRef, useCallback } from "react";
import socketClient, { WS_STATUS } from "../services/websocket";

export function useRideSocket(rideId, callbacks = {}) {
  const [status, setStatus] = useState(socketClient.status);
  const [lastLocation, setLastLocation] = useState(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    // 1. Listen for connection status
    const unsubStatus = socketClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // 2. Connect client if not already connected
    socketClient.connect();

    return () => {
      unsubStatus();
    };
  }, []);

  useEffect(() => {
    if (!rideId) return;

    // 3. Subscribe to the active ride
    socketClient.subscribeRide(rideId);

    // 4. Register event listeners for this specific ride
    const unsubLocation = socketClient.on(`driver_location_updated:${rideId}`, (event) => {
      setLastLocation(event.payload);
      if (callbacksRef.current.onDriverLocation) {
        callbacksRef.current.onDriverLocation(event.payload);
      }
    });

    const unsubBidCreated = socketClient.on(`bid_created:${rideId}`, (event) => {
      if (callbacksRef.current.onBidCreated) {
        callbacksRef.current.onBidCreated(event.payload);
      }
    });

    const unsubBidAccepted = socketClient.on(`bid_accepted:${rideId}`, (event) => {
      if (callbacksRef.current.onBidAccepted) {
        callbacksRef.current.onBidAccepted(event.payload);
      }
    });

    const unsubRideStarted = socketClient.on(`ride_started:${rideId}`, (event) => {
      if (callbacksRef.current.onRideStarted) {
        callbacksRef.current.onRideStarted(event.payload);
      }
    });

    const unsubRideCompleted = socketClient.on(`ride_completed:${rideId}`, (event) => {
      if (callbacksRef.current.onRideCompleted) {
        callbacksRef.current.onRideCompleted(event.payload);
      }
    });

    const unsubRideCancelled = socketClient.on(`ride_cancelled:${rideId}`, (event) => {
      if (callbacksRef.current.onRideCancelled) {
        callbacksRef.current.onRideCancelled(event.payload);
      }
    });

    const unsubStatusChanged = socketClient.on(`ride_status_changed:${rideId}`, (event) => {
      if (callbacksRef.current.onStatusChange) {
        callbacksRef.current.onStatusChange(event.payload);
      }
    });

    // Cleanup subscription on unmount or ride change
    return () => {
      socketClient.unsubscribeRide(rideId);
      unsubLocation();
      unsubBidCreated();
      unsubBidAccepted();
      unsubRideStarted();
      unsubRideCompleted();
      unsubRideCancelled();
      unsubStatusChanged();
    };
  }, [rideId]);

  // Method for a driver to emit location updates over the socket
  const sendLocationUpdate = useCallback(
    (coords, extra = {}) => {
      if (!rideId) return false;
      return socketClient.send("driver_location_updated", rideId, {
        coords,
        ...extra
      });
    },
    [rideId]
  );

  return {
    status,
    isConnected: status === WS_STATUS.CONNECTED,
    lastLocation,
    sendLocationUpdate
  };
}

export default useRideSocket;
