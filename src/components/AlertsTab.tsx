import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Shield, Bell, AlertTriangle, Activity } from 'lucide-react';
import { api } from '../api';

interface AlertRecord {
  id: string;
  timestamp: string;
  type: string;
  status: string;
}

interface AlertsData {
  alertMode: boolean;
  motionDetected: boolean;
  alertHistory: AlertRecord[];
}

export function AlertsTab() {
  const [data, setData] = useState<AlertsData>({
    alertMode: false,
    motionDetected: false,
    alertHistory: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await api.get('/data/alerts');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts data', error);
    } finally {
        setLoading(false);
    }
  };

  // Initial fetch and Polling for real-time updates
  useEffect(() => {
    fetchData();
    
    // Polling interval (every 4 seconds, mimicking old simulation interval)
    const interval = setInterval(fetchData, 4000); 
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleAlertModeToggle = async (checked: boolean) => {
    setData(prev => ({ ...prev, alertMode: checked }));
    try {
      await api.post('/data/alerts/toggle-mode', { alertMode: checked });
    } catch (error) {
      console.error('Failed to toggle alert mode', error);
      // Revert local state if API call fails
      setData(prev => ({ ...prev, alertMode: !checked })); 
    }
  };

  if (loading) {
    return <div>Loading security system status...</div>;
  }

  const { alertMode, motionDetected, alertHistory } = data;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Alert System Control */}
      <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${
              motionDetected ? 'bg-gradient-to-br from-red-400 to-red-500' : alertMode ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-slate-100'
            } flex items-center justify-center transition-all`}>
              <Shield className={`w-5 h-5 ${motionDetected || alertMode ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="text-slate-900">Security Alert System</div>
              <div className="text-xs text-slate-500">PIR Motion Sensor</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Indicator */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full ${
                    motionDetected 
                      ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]' 
                      : alertMode 
                        ? 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300'
                  } flex items-center justify-center transition-all duration-300`}>
                    {motionDetected ? (
                      <AlertTriangle className="w-20 h-20 text-white animate-pulse" />
                    ) : (
                      <Shield className={`w-20 h-20 ${alertMode ? 'text-white' : 'text-slate-400'}`} />
                    )}
                  </div>
                  {motionDetected && (
                    <div className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"></div>
                  )}
                </div>
              </div>

              {motionDetected && (
                <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400 rounded-lg space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-red-900">⚠️ Unauthorized Movement Detected!</p>
                      <p className="text-sm text-red-700">Security buzzer activated. Event logged to history.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-red-100 rounded">
                    <Bell className="w-5 h-5 text-red-700" />
                    <p className="text-sm text-red-800">🔊 Buzzer Active</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="text-sm">Alert Mode</span>
                </div>
                <Switch checked={alertMode} onCheckedChange={handleAlertModeToggle} />
              </div>
              
              

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-900">When motion is detected in alert mode, the buzzer sounds and the event is logged.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History Table */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900">Alert History</div>
              <div className="text-xs text-slate-500">Security event logs and notifications</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertHistory.map((alert) => (
                <TableRow key={alert.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{alert.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      {alert.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'Active' ? 'destructive' : 'outline'}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}