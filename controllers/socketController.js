import Message from '../models/Message.js';

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join conversation room
    socket.on('joinRoom', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room: ${conversationId}`);
    });

    socket.on('sendMessage', async ({ conversationId, sender, text }) => {
      try {
        const message = await Message.create({
          conversationId,
          sender,  // use sender instead of senderId
          text,
        });

        // Populate sender info for broadcasting
        const populatedMessage = await Message.findById(message._id)
          .populate({ path: 'sender', select: 'firstName lastName' });

        // Emit new message to all clients in the conversation room
        io.to(conversationId).emit('newMessage', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('errorMessage', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
