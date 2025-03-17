import { ESP32Module, SensorData, SystemStatus } from '../types/hydrocontrol';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3000/api';

// Initialize Socket.IO client
export const socket = io(API_BASE_URL);

// Listen for real-time updates
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('sensor:update', (data) => {
  console.log('Sensor update:', data);
});

socket.on('pump:update', (data) => {
  console.log('Pump update:', data);
});

socket.on('module:update', (data) => {
  console.log('Module update:', data);
});

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${API_BASE_URL}/modules`);
  if (!response.ok) throw new Error('Failed to fetch system status');
  const modules = await response.json();
  
  return {
    totalModules: modules.length,
    activeModules: modules.filter((m: ESP32Module) => m.status === 'online').length,
    alerts: modules.reduce((acc: number, m: ESP32Module) => 
      acc + m.sensors.filter(s => s.status === 'critical').length, 0),
    lastUpdate: new Date().toISOString()
  };
}

export async function fetchModules(): Promise<ESP32Module[]> {
  const response = await fetch(`${API_BASE_URL}/modules`);
  if (!response.ok) throw new Error('Failed to fetch modules');
  return response.json();
}

export async function fetchModuleSensorData(moduleId: string): Promise<SensorData[]> {
  const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`);
  if (!response.ok) throw new Error('Failed to fetch sensor data');
  const module = await response.json();
  return module.sensors;
}

export async function addModule(moduleData: Partial<ESP32Module>): Promise<ESP32Module> {
  const response = await fetch(`${API_BASE_URL}/modules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(moduleData),
  });
  if (!response.ok) throw new Error('Failed to add module');
  return response.json();
}

export async function updateModuleConfig(
  moduleId: string,
  config: Partial<ESP32Module>
): Promise<ESP32Module> {
  const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update module configuration');
  return response.json();
}

export async function controlPump(moduleId: string, action: 'start' | 'stop', duration?: number) {
  const response = await fetch(`${API_BASE_URL}/control/pump/${moduleId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration }),
  });
  if (!response.ok) throw new Error(`Failed to ${action} pump`);
  return response.json();
}

export async function setWaterLevel(moduleId: string, target: number) {
  const response = await fetch(`${API_BASE_URL}/control/tank/${moduleId}/level`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  });
  if (!response.ok) throw new Error('Failed to set water level target');
  return response.json();
}

// Real-time control via WebSocket
export function startPumpRealtime(moduleId: string, duration?: number) {
  socket.emit('control:pump', { moduleId, action: 'start', duration });
}

export function stopPumpRealtime(moduleId: string) {
  socket.emit('control:pump', { moduleId, action: 'stop' });
}

export function setWaterLevelRealtime(moduleId: string, target: number) {
  socket.emit('control:tank', { moduleId, target });
}