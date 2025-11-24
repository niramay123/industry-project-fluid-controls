// socket.js
import jwt from 'jsonwebtoken';
import {addSocket, removeSocket} from "../../server/utils/socketManager.js"

export const initializeSocket = (io) => {
  global.io = io;

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('connectUser', (token) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.id;

        addSocket(userId, socket.id);
        socket.userId = userId; // Store on socket object for disconnect handler
        console.log(`User ${userId} connected via socket`);
      } catch (error) {
        console.error("Socket Auth Error:", error.message);
        socket.disconnect();
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        removeSocket(socket.userId, socket.id);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
};