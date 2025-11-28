import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Lightbulb, Wind, Sun, Thermometer } from 'lucide-react';
import { api } from '../api';

// 🚀 CONFIGURATION: Using the latest confirmed credentials.
const THINGSPEAK_CHANNEL_ID = '3170554'; 
const THINGSPEAK_READ_API_KEY = 'D9MNMBMEUT21KGQN'; 
const THINGSPEAK_TEMP_FIELD_ID = 1; // Field 1 for Temperature
const THINGSPEAK_AQI_FIELD_ID = 3; // Field 3 for Air Quality Index

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
    ring: string; 
  };
}

// Helper function (same as in mock backend for consistent status calculation)
const getAirStatus = (value: number) => {
  if (value < 100) return { label: 'Good', color: 'green', ring: 'ring-green-200' };
  if (value < 200) return { label: 'Moderate', color: 'yellow', ring: 'ring-yellow-200' };
  return { label: 'Poor', color: 'red', ring: 'ring-red-200' };
};

// Default mock data structure for fallback
const DEFAULT_MOCK_DATA = {
    airQuality: { temperature: 24.0 } // Use the default temperature from your mock backend
};


export function MonitoringTab() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    let aqiValue = 0;
    let tempValueFromChannel = 0;
    let localData = null; 

    try {
      setLoading(true);

      // --- 1. Fetch Local/Mock Data First (Needed for light state and temp fallback) ---
      try {
          const localResponse = await api.get('/data/monitoring');
          localData = localResponse.data;
      } catch (localError) {
          console.warn('Local Mock API failed. Using default mock data for light control/temperature fallback.');
          // Use default mock structure if local API fails entirely
          localData = { 
            smartLight: { autoMode: false, lightOn: false, ldrValue: 450 },
            airQuality: DEFAULT_MOCK_DATA.airQuality
          };
      }
      
      // --- 2. Fetch AQI from ThingSpeak API (Field 3) ---
      try {
          const aqiUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/fields/${THINGSPEAK_AQI_FIELD_ID}/last.json?api_key=${THINGSPEAK_READ_API_KEY}`;
          const aqiResponse = await fetch(aqiUrl);
          
          if (!aqiResponse.ok) {
              throw new Error(`ThingSpeak AQI API failed: ${aqiResponse.status}`);
          }
          const aqiTsData = await aqiResponse.json();
          aqiValue = parseFloat(aqiTsData[`field${THINGSPEAK_AQI_FIELD_ID}`] || '0');
      } catch (error) {
          console.error(`Error fetching AQI: ${error.message}. Using 0 as fallback.`);
          aqiValue = 0;
      }

      // --- 3. RE-ENABLED: Fetch Temperature from ThingSpeak API (Field 1) ---
      try {
          const tempUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/fields/${THINGSPEAK_TEMP_FIELD_ID}/last.json?api_key=${THINGSPEAK_READ_API_KEY}`;
          const tempResponse = await fetch(tempUrl);

          if (!tempResponse.ok) {
              // This handles the persistent 404/failure for temperature
              throw new Error(`ThingSpeak Temp API failed: ${tempResponse.status}`);
          }
          const tempTsData = await tempResponse.json();
          tempValueFromChannel = parseFloat(tempTsData[`field${THINGSPEAK_TEMP_FIELD_ID}`] || '0');
      } catch (error) {
          console.warn(`Temperature API failed: ${error.message}. Falling back to mock data.`);
          // If fetch fails, tempValueFromChannel remains 0. We'll use the local mock value.
      }
      
      // --- 4. Combine and Transform Data ---
      // Prioritize ThingSpeak if successful (tempValueFromChannel > 0), otherwise use mock data.
      const finalTempValue = (tempValueFromChannel > 0) 
                             ? tempValueFromChannel 
                             : localData.airQuality.temperature;
                             
      const airStatus = getAirStatus(aqiValue);
      
      const combinedData: MonitoringData = {
        smartLight: localData.smartLight, 
        airQuality: { 
          airQualityIndex: aqiValue,
          temperature: finalTempValue,
        },
        airQualityStatus: airStatus,
      };

      setData(combinedData);

    } catch (error) {
      // This catch is for any critical failure not handled above (e.g., initial state setup error)
      console.error('An unexpected error occurred during data fetching:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and Polling for real-time updates
  useEffect(() => {
    fetchData(); 
    
    // Set up a polling interval (every 3 seconds)
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
      // Still use the local mock API for controlling the light state
      const response = await api.post('/data/monitoring/light-control', updatePayload);
      // Update local state with the actual response from the backend
      setData(prev => ({
        ...prev!, 
        smartLight: response.data.smartLight,
        // Since backend handles final state logic, re-fetch full data is implicitly handled by polling
      }));
    } catch (error) {
      console.error('Failed to update light control', error);
    }
  };

  if (loading || !data) {
    return <div>Loading real-time monitoring data...</div>;
  }

  const { smartLight, airQuality, airQualityStatus } = data;

  // Static classes from original frontend code, but now driven by data.
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
              <div className="text-xs text-slate-500">Environmental Monitor (ThingSpeak Data)</div>
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
              {/* Uses AQI value fetched from ThingSpeak Field 3 */}
              <p className="text-3xl text-blue-900">{Math.round(airQuality.airQualityIndex)}</p> 
              <p className="text-xs text-blue-600">PPM (AQI)</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-700">Temperature Sensor</span>
                <Thermometer className="w-4 h-4 text-orange-600" />
              </div>
              {/* Uses temperature value (ThingSpeak if successful, mock otherwise) */}
              <p className="text-3xl text-orange-900">{airQuality.temperature.toFixed(1)}°C</p> 
              <p className="text-xs text-orange-600">Temperature</p>
            </div>
            
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}