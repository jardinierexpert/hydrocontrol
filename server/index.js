import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';
import { router as moduleRouter } from './routes/modules.js';
import { router as controlRouter } from './routes/control.js';
import { initializeMQTTClient } from './mqtt/client.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/modules', moduleRouter);
app.use('/api/control', controlRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

// Initialize mock MQTT client
const mqttClient = initializeMQTTClient();

// Setup WebSocket handlers
setupWebSocketHandlers(io, mqttClient);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, io, mqttClient, logger };