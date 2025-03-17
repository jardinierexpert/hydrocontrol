import express from 'express';
import { mqttClient, logger } from '../index.js';

const router = express.Router();

// Start pump
router.post('/pump/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    // Publish MQTT message to start pump
    mqttClient.publish(`pump/${id}/control`, JSON.stringify({
      action: 'start',
      duration
    }));

    res.json({ message: 'Pump start command sent' });
  } catch (error) {
    logger.error('Error starting pump:', error);
    res.status(500).json({ error: 'Failed to start pump' });
  }
});

// Stop pump
router.post('/pump/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    // Publish MQTT message to stop pump
    mqttClient.publish(`pump/${id}/control`, JSON.stringify({
      action: 'stop'
    }));

    res.json({ message: 'Pump stop command sent' });
  } catch (error) {
    logger.error('Error stopping pump:', error);
    res.status(500).json({ error: 'Failed to stop pump' });
  }
});

// Set water level target
router.post('/tank/:id/level', async (req, res) => {
  try {
    const { id } = req.params;
    const { target } = req.body;

    // Publish MQTT message to set target level
    mqttClient.publish(`tank/${id}/control`, JSON.stringify({
      action: 'setLevel',
      target
    }));

    res.json({ message: 'Water level target set' });
  } catch (error) {
    logger.error('Error setting water level target:', error);
    res.status(500).json({ error: 'Failed to set water level target' });
  }
});

export { router };