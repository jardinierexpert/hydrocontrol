import { logger } from '../index.js';

export function setupWebSocketHandlers(io, mqttClient) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle real-time control commands from client
    socket.on('control:pump', ({ moduleId, action, duration }) => {
      mqttClient.publish(`pump/${moduleId}/control`, JSON.stringify({
        action,
        duration
      }));
    });

    socket.on('control:tank', ({ moduleId, target }) => {
      mqttClient.publish(`tank/${moduleId}/control`, JSON.stringify({
        action: 'setLevel',
        target
      }));
    });

    // Forward MQTT messages to connected clients
    mqttClient.on('message', (topic, message) => {
      const payload = JSON.parse(message.toString());
      if (topic.startsWith('sensor/')) {
        socket.emit('sensor:update', payload);
      } else if (topic.startsWith('pump/')) {
        socket.emit('pump:update', payload);
      } else if (topic.startsWith('module/')) {
        socket.emit('module:update', payload);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
}