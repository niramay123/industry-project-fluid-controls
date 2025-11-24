import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import apiClient from '../apiClient';
import { io } from "socket.io-client";

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use useRef to manage the socket instance to prevent re-connections on re-renders
  const socketRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // 1. Socket Connection Logic
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect only if not already connected
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        transports: ["websocket"],
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        // Authenticate with the backend event we created
        socket.emit("connectUser", token);
        console.log("Connected to notification socket");
      });

      socket.on("notification", (newNotification) => {
        console.log("📩 Real-time notification:", newNotification);
        setNotifications(prev => [newNotification, ...prev]);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from socket");
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 2. Fetch existing notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/notifications'); // Matches backend route
        setNotifications(response.data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
        // Optional: Only fetch when opening the popover to save bandwidth, 
        // or keep it in the mount useEffect if you want the badge count immediately on load.
        // For now, I'll keep it on mount as per your original logic:
    }
    fetchNotifications();
  }, []); // Run once on mount

  // 3. Handlers
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Backend call
      await apiClient.put('/notifications/mark-all-read');
    } catch (error) {
      console.error(error);
      alert("Failed to mark all notifications as read.");
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;

    try {
      // Optimistic update
      setNotifications([]);

      // Backend call
      await apiClient.delete('/notifications');
    } catch (error) {
      console.error(error);
      alert("Failed to clear notifications.");
    }
  };

  // --- UI REMAINS EXACTLY AS ORIGINAL ---
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">Notifications</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-1" /> Mark all as read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear all
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-sm text-center text-slate-500">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-sm text-center text-slate-500">
              You have no new notifications.
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div
                  key={n._id}
                  className={`p-3 cursor-pointer ${
                    !n.read ? 'bg-blue-50 border-l-2 border-blue-500' : 'bg-white'
                  }`}
                >
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(n.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}