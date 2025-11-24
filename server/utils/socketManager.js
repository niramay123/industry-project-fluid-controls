// utils/socketManager.js

// Store user connections: Map<UserId, Set<SocketId>>
const userSocketMap = new Map();

export const addSocket = (userId, socketId) => {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socketId);
};

export const removeSocket = (userId, socketId) => {
  if (userSocketMap.has(userId)) {
    const userSockets = userSocketMap.get(userId);
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      userSocketMap.delete(userId);
    }
  }
};

export const getUserSockets = (userId) => {
  if (userSocketMap.has(userId)) {
    return Array.from(userSocketMap.get(userId));
  }
  return [];
};