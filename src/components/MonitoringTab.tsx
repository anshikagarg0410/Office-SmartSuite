import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Lightbulb, Wind, Sun, Thermometer } from 'lucide-react';
import { api } from '../api';

// Define the shape of the data we expect from the backend
interface MonitoringData {
  smartLight: {
    autoMode: boolean;
    lightOn: boolean;
    ldrValue: number;
  };
  airQuality: {
    airQualityIndex: number;
    temperature: number;
  };
  airQualityStatus: {
    label: string;
    color: string;
    ring: string; // Only needed if calculating classes client-side
  };
}

export function MonitoringTab() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/data/monitoring');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and Polling for real-time updates
  useEffect(() => {
    fetchData(); 
    
    // Set up a polling interval (every 3 seconds, mimicking old simulation)
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleLightControl = async (key: 'autoMode' | 'lightOn', value: boolean) => {
    if (!data) return;

    let updatePayload: { autoMode?: boolean, lightOn?: boolean } = {};

    if (key === 'autoMode') {
      updatePayload = { autoMode: value };
    } else if (key === 'lightOn' && !data.smartLight.autoMode) {
      updatePayload = { lightOn: value };
    } else {
        // Prevent manual change if autoMode is true
        return; 
    }

    try {
      const response = await api.post('/data/monitoring/light-control', updatePayload);
      // Update local state with the actual response from the backend
      setData(prev => ({
        ...prev!, 
        smartLight: response.data.smartLight,
        // Since backend handles final state logic, re-fetch full data if needed or rely on polling
      }));
    } catch (error) {
      console.error('Failed to update light control', error);
    }
  };

  if (loading || !data) {
    return <div>Loading real-time monitoring data...</div>;
  }

  const { smartLight, airQuality, airQualityStatus } = data;

  // Static classes from original frontend code, but now driven by backend data.
  const getAirStatusClasses = (label: string) => {
    if (label === 'Good') return { color: 'bg-gradient-to-br from-green-400 to-green-500', ring: 'ring-green-200' };
    if (label === 'Moderate') return { color: 'bg-gradient-to-br from-yellow-400 to-yellow-500', ring: 'ring-yellow-200' };
    return { color: 'bg-gradient-to-br from-red-400 to-red-500', ring: 'ring-red-200' };
  };
  
  const statusClasses = getAirStatusClasses(airQualityStatus.label);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
      {/* Smart Light System */}
      <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-transparent rounded-bl-full opacity-50"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${smartLight.lightOn ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : 'bg-slate-100'} flex items-center justify-center transition-all`}>
              <Lightbulb className={`w-5 h-5 ${smartLight.lightOn ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="text-slate-900">Smart Light</div>
              <div className="text-xs text-slate-500">LDR Sensor Control (Value: {smartLight.ldrValue.toFixed(0)})</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full ${
                smartLight.lightOn 
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_40px_rgba(250,204,21,0.5)]' 
                  : 'bg-gradient-to-br from-slate-200 to-slate-300'
              } flex items-center justify-center transition-all duration-500`}>
                <Lightbulb className={`w-16 h-16 ${smartLight.lightOn ? 'text-white' : 'text-slate-400'}`} />
              </div>
              {smartLight.lightOn && (
                <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 animate-ping"></div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Auto Mode</span>
              </div>
              <Switch 
                checked={smartLight.autoMode} 
                onCheckedChange={(checked) => handleLightControl('autoMode', checked)} 
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Manual Control</span>
              </div>
              <Switch 
                checked={smartLight.lightOn} 
                onCheckedChange={(checked) => handleLightControl('lightOn', checked)}
                disabled={smartLight.autoMode}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Light Status</span>
                <Badge variant={smartLight.lightOn ? "default" : "secondary"}>{smartLight.lightOn ? 'ON' : 'OFF'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Air Quality Monitor */}
      <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-50"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900">Air Quality</div>
              <div className="text-xs text-slate-500">Environmental Monitor</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full ${statusClasses.color} ring-8 ${statusClasses.ring} flex items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <p className="text-white text-xs">Air Quality</p>
                  <p className="text-white text-lg">{airQualityStatus.label}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-700">MQ-135 Sensor</span>
                <Wind className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl text-blue-900">{Math.round(airQuality.airQualityIndex)}</p>
              <p className="text-xs text-blue-600">PPM</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-700">DHT11 Sensor</span>
                <Thermometer className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-3xl text-orange-900">{airQuality.temperature.toFixed(1)}°C</p>
              <p className="text-xs text-orange-600">Temperature</p>
            </div>
            
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}