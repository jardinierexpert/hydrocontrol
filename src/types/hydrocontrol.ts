export interface SensorData {
  id: string;
  type: 'water_level' | 'temperature' | 'luminosity' | 'pump';
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface ESP32Module {
  id: string;
  name: string;
  type: string;
  location: string;
  sensors: SensorData[];
  lastUpdate: string;
  status: 'online' | 'offline';
}

export interface SystemStatus {
  totalModules: number;
  activeModules: number;
  alerts: number;
  lastUpdate: string;
}