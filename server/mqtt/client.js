import { EventEmitter } from 'events';
import { logger } from '../index.js';

// Create a mock MQTT client using EventEmitter
class MockMQTTClient extends EventEmitter {
  constructor() {
    super();
    this.connected = true;
    this.subscriptions = new Set();
    
    // Simulate some initial data
    setInterval(() => {
      this.simulateData();
    }, 5000);
  }

  connect() {
    return this;
  }

  subscribe(topic) {
    this.subscriptions.add(topic);
    logger.info(`Subscribed to topic: ${topic}`);
  }

  publish(topic, message) {
    logger.info(`Publishing to ${topic}: ${message}`);
    this.emit('message', topic, Buffer.from(message));
    
    // Simulate response for pump control
    if (topic.includes('pump')) {
      const data = JSON.parse(message);
      setTimeout(() => {
        this.emit('message', `pump/status`, Buffer.from(JSON.stringify({
          id: topic.split('/')[1],
          status: data.action === 'start' ? 'running' : 'stopped',
          timestamp: new Date().toISOString()
        })));
      }, 500);
    }
  }

  simulateData() {
    // Simulate water level changes
    this.emit('message', 'sensor/1/data', Buffer.from(JSON.stringify({
      id: 'sensor1',
      type: 'water_level',
      value: Math.floor(Math.random() * 100),
      unit: '%',
      timestamp: new Date().toISOString(),
      status: 'normal'
    })));
  }
}

export function initializeMQTTClient() {
  logger.info('Initializing mock MQTT client');
  const client = new MockMQTTClient();
  
  // Log mock client events
  client.on('message', (topic, message) => {
    logger.info(`Mock MQTT message on topic ${topic}: ${message.toString()}`);
  });

  return client;
}