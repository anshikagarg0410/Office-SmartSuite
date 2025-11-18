import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Lightbulb, Wind, Sun, Thermometer } from 'lucide-react';

export function MonitoringTab() {
  // Smart Light States
  const [autoMode, setAutoMode] = useState(true);
  const [lightOn, setLightOn] = useState(false);
  const [ldrValue, setLdrValue] = useState(450);
  
  // Air Quality States
  const [airQuality, setAirQuality] = useState(85);
  const [temperature, setTemperature] = useState(24);

  // Simulate sensors
  useEffect(() => {
    const interval = setInterval(() => {
      const newLdr = Math.max(100, Math.min(900, ldrValue + (Math.random() - 0.5) * 50));
      setLdrValue(newLdr);
      
      if (autoMode) {
        setLightOn(newLdr < 500);
      }
      
      setAirQuality(prev => Math.max(50, Math.min(250, prev + (Math.random() - 0.5) * 10)));
      setTemperature(prev => Math.max(20, Math.min(30, prev + (Math.random() - 0.5) * 0.5)));
    }, 3000);
    return () => clearInterval(interval);
  }, [autoMode, ldrValue]);

  const getAirStatus = (value: number) => {
    if (value < 100) return { label: 'Good', color: 'bg-gradient-to-br from-green-400 to-green-500', ring: 'ring-green-200' };
    if (value < 200) return { label: 'Moderate', color: 'bg-gradient-to-br from-yellow-400 to-yellow-500', ring: 'ring-yellow-200' };
    return { label: 'Poor', color: 'bg-gradient-to-br from-red-400 to-red-500', ring: 'ring-red-200' };
  };

  const airStatus = getAirStatus(airQuality);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
      {/* Smart Light System */}
      <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-transparent rounded-bl-full opacity-50"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${lightOn ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : 'bg-slate-100'} flex items-center justify-center transition-all`}>
              <Lightbulb className={`w-5 h-5 ${lightOn ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="text-slate-900">Smart Light</div>
              <div className="text-xs text-slate-500">LDR Sensor Control</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full ${
                lightOn 
                  ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-[0_0_40px_rgba(250,204,21,0.5)]' 
                  : 'bg-gradient-to-br from-slate-200 to-slate-300'
              } flex items-center justify-center transition-all duration-500`}>
                <Lightbulb className={`w-16 h-16 ${lightOn ? 'text-white' : 'text-slate-400'}`} />
              </div>
              {lightOn && (
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
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Manual Control</span>
              </div>
              <Switch 
                checked={lightOn} 
                onCheckedChange={setLightOn}
                disabled={autoMode}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Light Status</span>
                <Badge variant={lightOn ? "default" : "secondary"}>{lightOn ? 'ON' : 'OFF'}</Badge>
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
              <div className={`w-32 h-32 rounded-full ${airStatus.color} ring-8 ${airStatus.ring} flex items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <p className="text-white text-xs">Air Quality</p>
                  <p className="text-white text-lg">{airStatus.label}</p>
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
              <p className="text-3xl text-blue-900">{Math.round(airQuality)}</p>
              <p className="text-xs text-blue-600">PPM</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-700">DHT11 Sensor</span>
                <Thermometer className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-3xl text-orange-900">{temperature.toFixed(1)}°C</p>
              <p className="text-xs text-orange-600">Temperature</p>
            </div>
            
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
