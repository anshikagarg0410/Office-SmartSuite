import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Fingerprint, Flame, DoorOpen, CheckCircle2, Users, Clock } from 'lucide-react';
import { api } from '../api';

// 🚀 CONFIGURATION: ThingSpeak credentials
const THINGSPEAK_CHANNEL_ID = '3170554'; 
const THINGSPEAK_READ_API_KEY = 'D9MNMBMEUT21KGQN'; 
const THINGSPEAK_FIRE_FIELD_ID = 5; // Field 5 for Fire Detection

// Data Polling Configuration
const DATA_RECENCY_THRESHOLD_MS = 30000; // 30 seconds
const REFRESH_RATE_MS = 10000; // 30 seconds

interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  time: string;
}

interface AccessSafetyData {
  gateOpen: boolean;
  fireSystemOn: boolean;
  fireDetected: boolean; 
  attendance: AttendanceRecord[];
}

export function AccessSafetyTab() {
  const [data, setData] = useState<AccessSafetyData>({
    gateOpen: false,
    fireSystemOn: true,
    fireDetected: false, 
    attendance: [],
  });
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Removed unnecessary alertActive state and alertTimeoutRef

  // Removed unnecessary useEffect timer hook

  const fetchData = async () => {
    
    let fireDetectedFromChannel = false;
    let localData = null;

    try {
      // Show loading state only on initial load
      if (data.attendance.length === 0) setLoading(true); 

      // --- 1. Fetch Local Data (Attendance and System State) ---
      try {
        const localResponse = await api.get('/data/access-safety');
        localData = localResponse.data;
      } catch (localError) {
        console.error('Failed to fetch local access safety data', localError);
        if (data.attendance.length === 0) setLoading(false);
        return;
      }

      // --- 2. Fetch Fire Detection from ThingSpeak API (Field 5) ---
      try {
        // Use feeds.json to get the created_at timestamp
        const fireUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;
        const fireResponse = await fetch(fireUrl);

        if (!fireResponse.ok) {
            throw new Error(`ThingSpeak Fire API failed: ${fireResponse.status}`);
        }
        const fireTsData = await fireResponse.json();
        
        const latestFeed = fireTsData.feeds?.[0];
        
        if (latestFeed) {
            const dataTimestamp = new Date(latestFeed.created_at).getTime();
            const now = new Date().getTime();
            
            // Check recency: Data must be within the 30-second threshold
            const isRecent = (now - dataTimestamp) <= DATA_RECENCY_THRESHOLD_MS; 

            const fireValue = parseFloat(latestFeed[`field${THINGSPEAK_FIRE_FIELD_ID}`] || '0');
            
            // Fire is detected only if Value > 0 AND the data is recent
            fireDetectedFromChannel = (fireValue > 0) && isRecent;

            if (!isRecent) {
                console.warn(`ThingSpeak data is older than 30s (${(now - dataTimestamp) / 1000}s). Fire not detected.`);
            }
        }
        
      } catch (error) {
        console.warn(`Fire detection API failed: ${error.message}. Assuming clear (false).`);
        fireDetectedFromChannel = false;
      }

      // --- 3. Combine Data and Update State ---
      setData(prev => ({
        ...localData,
        // fireDetected is now controlled directly by the live ThingSpeak reading (and recency check)
        fireDetected: fireDetectedFromChannel, 
        attendance: localData.attendance, 
      }));
      
    } catch (error) {
      console.error('An unexpected error occurred during data fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and Polling (runs every 2 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_RATE_MS); 
    return () => clearInterval(interval); 
  }, []); 

  const handleRfidScan = async () => {
    setScanning(true);
    try {
      const response = await api.post('/data/access-safety/rfid-scan');
      
      setData(prev => ({
        ...prev!,
        gateOpen: response.data.gateOpen,
        attendance: [response.data.newRecord, ...prev!.attendance.filter(r => r.id !== response.data.newRecord.id)],
      }));

    } catch (error) {
      console.error('RFID scan failed', error);
    } finally {
      setScanning(false);
    }
  };

  const handleFireSystemToggle = async (checked: boolean) => {
    setData(prev => ({ ...prev!, fireSystemOn: checked }));
    try {
      await api.post('/data/access-safety/fire-system-toggle', { fireSystemOn: checked });
    } catch (error) {
      console.error('Failed to toggle fire system', error);
      setData(prev => ({ ...prev!, fireSystemOn: !checked })); 
    }
  };

  // Removed handleFireTest function entirely

  // The final status for rendering is controlled directly by the live data
  const isFireAlerting = data.fireDetected; 

  if (loading) {
    return <div>Loading access and safety controls...</div>;
  }


  const { gateOpen, fireSystemOn, attendance } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFID Access Control */}
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${
                gateOpen ? 'bg-gradient-to-br from-green-400 to-green-500' : scanning ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-purple-400 to-purple-500'
              } flex items-center justify-center transition-all`}>
                <Fingerprint className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-slate-900">RFID Access Control</div>
                <div className="text-xs text-slate-500">Card Authentication System</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className={`w-36 h-36 rounded-full ${
                  gateOpen 
                    ? 'bg-gradient-to-br from-green-300 via-green-400 to-green-500 shadow-[0_0_40px_rgba(34,197,94,0.5)]' 
                    : scanning 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg'
                      : 'bg-gradient-to-br from-slate-200 to-slate-300'
                } flex items-center justify-center transition-all duration-500`}>
                  {gateOpen ? (
                    <DoorOpen className="w-20 h-20 text-white" />
                  ) : (
                    <Fingerprint className={`w-20 h-20 ${scanning ? 'text-white animate-pulse' : 'text-slate-400'}`} />
                  )}
                </div>
                {gateOpen && (
                  <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping"></div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Gate Status</p>
                  <Badge variant={gateOpen ? 'default' : 'secondary'} className="w-full">
                    {gateOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Today's Count</p>
                  <p className="text-2xl">{attendance.length}</p>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg" 
                onClick={handleRfidScan}
                disabled={scanning || gateOpen}
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                {scanning ? 'Scanning Card...' : 'Scan RFID Card'}
              </Button>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-900">Servo motor opens gate on successful authentication</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fire Alarm System */}
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-bl-full opacity-50"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${
                isFireAlerting ? 'bg-gradient-to-br from-red-400 to-red-500' : fireSystemOn ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-slate-100'
              } flex items-center justify-center transition-all`}>
                <Flame className={`w-5 h-5 ${isFireAlerting || fireSystemOn ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-slate-900">Fire Alarm System</div>
                <div className="text-xs text-slate-500">Flame Detection & Alert</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className={`w-36 h-36 rounded-full ${
                  isFireAlerting 
                    ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 shadow-[0_0_60px_rgba(239,68,68,0.6)]' 
                    : fireSystemOn 
                      ? 'bg-gradient-to-br from-green-300 via-green-400 to-green-500 shadow-lg'
                      : 'bg-gradient-to-br from-slate-200 to-slate-300'
                } flex items-center justify-center transition-all duration-500`}>
                  <Flame className={`w-20 h-20 ${isFireAlerting || fireSystemOn ? 'text-white' : 'text-slate-400'} ${isFireAlerting ? 'animate-pulse' : ''}`} />
                </div>
                {isFireAlerting && (
                  <div className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"></div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-slate-600" />
                  <span className="text-sm">System Active</span>
                </div>
                <Switch 
                  checked={fireSystemOn} 
                  onCheckedChange={handleFireSystemToggle} 
                />
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${
                isFireAlerting 
                  ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Flame Sensor</span>
                  <Flame className={`w-4 h-4 ${isFireAlerting ? 'text-red-600' : 'text-slate-400'}`} />
                </div>
                <Badge variant={isFireAlerting ? 'destructive' : 'outline'} className="w-full justify-center text-sm">
                  {isFireAlerting ? '🚨 FIRE DETECTED! (FIRE DETECTED!)' : 'Normal'}
                </Badge>
              </div>
              
              {isFireAlerting && (
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-400 rounded-lg space-y-2 animate-pulse">
                  <p className="text-sm text-red-900">🔊 Buzzer Sounding</p>
                  <p className="text-xs text-red-700">Alert sent to dashboard immediately.</p>
                </div>
              )}
              
              {/* Removed the Test Fire Detection button section */}
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-slate-900">Today's Attendance Log</div>
              <div className="text-xs text-slate-500">RFID Authentication Records</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono">{record.employeeId}</TableCell>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {record.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
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