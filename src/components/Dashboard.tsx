import React, { useState } from 'react';
import { Activity, Droplets, Thermometer, Power, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { WaterLevelChart } from './WaterLevelChart';
import { ModuleConfigModal } from './ModuleConfigModal';
import { SystemStatus, ESP32Module, SensorData } from '../types/hydrocontrol';
import * as api from '../lib/api';

const POLLING_INTERVAL = 5000; // 5 seconds

export function Dashboard() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: systemStatus = {
    totalModules: 0,
    activeModules: 0,
    alerts: 0,
    lastUpdate: new Date().toISOString()
  } } = useQuery<SystemStatus>({
    queryKey: ['systemStatus'],
    queryFn: api.fetchSystemStatus,
    refetchInterval: POLLING_INTERVAL,
  });

  const { data: modules = [] } = useQuery<ESP32Module[]>({
    queryKey: ['modules'],
    queryFn: api.fetchModules,
    refetchInterval: POLLING_INTERVAL,
  });

  const { data: sensorData = [] } = useQuery<SensorData[]>({
    queryKey: ['sensorData'],
    queryFn: () => api.fetchModuleSensorData(modules[0]?.id ?? ''),
    enabled: modules.length > 0,
    refetchInterval: POLLING_INTERVAL,
  });

  const addModuleMutation = useMutation({
    mutationFn: api.addModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
    },
  });

  const handleAddModule = async (moduleData: any) => {
    await addModuleMutation.mutateAsync(moduleData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Droplets className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">HydroControl Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last Update: {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
            </span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Module
            </button>
          </div>
        </div>
      </header>

      {/* Status Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            icon={<Activity className="h-6 w-6 text-green-600" />}
            title="System Status"
            value={`${systemStatus.activeModules}/${systemStatus.totalModules} Active`}
            status={systemStatus.activeModules === systemStatus.totalModules ? "normal" : "warning"}
          />
          <StatusCard
            icon={<Droplets className="h-6 w-6 text-blue-600" />}
            title="Water Levels"
            value={`${sensorData.find(s => s.type === 'water_level')?.value ?? 0}%`}
            status="normal"
          />
          <StatusCard
            icon={<Power className="h-6 w-6 text-purple-600" />}
            title="Active Pumps"
            value={`${modules.filter(m => m.status === 'online').length}/${modules.length}`}
            status={modules.every(m => m.status === 'online') ? "normal" : "warning"}
          />
          <StatusCard
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            title="Alerts"
            value={systemStatus.alerts.toString()}
            status={systemStatus.alerts > 0 ? "critical" : "normal"}
          />
        </div>

        {/* Main Content Area */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Water Level Monitoring</h2>
            <div className="h-64">
              <WaterLevelChart data={sensorData.filter(s => s.type === 'water_level')} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Modules</h2>
            <div className="space-y-4">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  name={module.name}
                  location={module.location}
                  status={module.status}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ModuleConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSubmit={handleAddModule}
      />
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
}

function StatusCard({ icon, title, value, status }: StatusCardProps) {
  const statusColors = {
    normal: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    critical: 'bg-red-50 text-red-700'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        {icon}
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      <div className={`mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  name: string;
  location: string;
  status: 'online' | 'offline';
}

function ModuleCard({ name, location, status }: ModuleCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{location}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}