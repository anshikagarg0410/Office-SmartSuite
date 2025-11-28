import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Fingerprint, Flame, DoorOpen, CheckCircle2, Users, Clock, XCircle } from 'lucide-react';
import { api } from '../api';

// 🚀 CONFIGURATION: ThingSpeak credentials and field IDs
const THINGSPEAK_CHANNEL_ID = '3170554'; 
const THINGSPEAK_READ_API_KEY = 'D9MNMBMEUT21KGQN'; 
const THINGSPEAK_FIRE_FIELD_ID = 5; // Field 5 for Fire Detection
const THINGSPEAK_RFID_TAG_FIELD_ID = 7; // Field 7 for RFID Tag ID
const THINGSPEAK_ACCESS_STATUS_FIELD_ID = 8; // Field 8 for Access Status (e.g., 1=Accepted, 0=Declined)

// Data Polling Configuration
const DATA_RECENCY_THRESHOLD_MS = 30000; // 30 seconds
const REFRESH_RATE_MS = 10000; // 10 seconds

// 🔑 UID to NAME MAPPING (User's Provided Data)
// Use UIDs (Tag IDs) as keys.
const UID_NAME_MAP: { [key: string]: string } = {
    // Format: "UID_OR_EMPLOYEE_ID": "Employee Name"
    "2380560134": "Ankita Meena",
    "1225422926010496": "Anshika",
    "1178866149904768": "Anshika Garg",
    "1205147868164736":"Anchal Gupta",
    // Add more recognized UIDs here...
};
// ------------------------------------------------------------------

interface AttendanceRecord {
  id: string; // ThingSpeak entry_id
  employeeId: string; // RFID Tag UID
  name: string; // Resolved name or "Unknown"
  time: string; // Formatted scan time
  status: 'Verified' | 'Declined'; // Access status based on Field 8
}

interface AccessSafetyData {
  gateOpen: boolean;
  fireSystemOn: boolean;
  fireDetected: boolean; 
  attendance: AttendanceRecord[];
  latestRfidTag: string | null;
  accessStatus: 'Unknown' | 'Accepted' | 'Declined';
  uniqueAccessCount: number;
  latestRfidName: string | null;
}

// Helper to resolve name from UID/employeeId
const resolveName = (employeeId: string | null): string => {
    if (!employeeId) return "Unknown";
    // Returns the name from the map, or "Unknown" if not found
    return UID_NAME_MAP[employeeId] || "Unknown";
}

// Helper to count unique, Verified employee IDs
const countUniqueAccess = (records: AttendanceRecord[]): number => {
  // Only count UIDs that resulted in a 'Verified' (Accepted) status
  const verifiedRecords = records.filter(r => r.status === 'Verified');
  const uniqueIds = new Set(verifiedRecords.map(r => r.employeeId));
  return uniqueIds.size;
}

// Helper to format time for logging
const formatTime = (date: Date): string => {
    if (isNaN(date.getTime())) {
        return 'N/A';
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Utility function to get ISO time string for 24 hours ago
const get24HoursAgoISO = (): string => {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    // ThingSpeak prefers ISO format for start time filtering
    return d.toISOString();
}

// Utility to determine if ThingSpeak feed is for access (Field 7/8 present)
const isAccessEntry = (feed: any): boolean => {
    return !!feed[`field${THINGSPEAK_RFID_TAG_FIELD_ID}`] && 
           (feed[`field${THINGSPEAK_ACCESS_STATUS_FIELD_ID}`] === '1' || feed[`field${THINGSPEAK_ACCESS_STATUS_FIELD_ID}`] === '0');
}


export function AccessSafetyTab() {
  const [data, setData] = useState<AccessSafetyData>({
    gateOpen: false,
    fireSystemOn: true,
    fireDetected: false, 
    attendance: [],
    latestRfidTag: null,
    accessStatus: 'Unknown',
    uniqueAccessCount: 0,
    latestRfidName: null,
  });
  const [loading, setLoading] = useState(true);

  // We no longer need lastProcessedEntryId since we fetch the full window every time.

  const fetchData = async () => {
    
    let fireDetectedFromChannel = false;
    let accessStatusFromChannel: 'Accepted' | 'Declined' | 'Unknown' = 'Unknown';
    let latestRfidTagFromChannel: string | null = null;
    let latestRfidNameFromChannel: string | null = null;
    let localData: { fireSystemOn: boolean, gateOpen: boolean } | null = null;
    
    const startTime = get24HoursAgoISO();

    try {
      if (data.attendance.length === 0) setLoading(true); 

      // --- 1. Fetch Local Data (System State only) ---
      // We still fetch this for system status (fireSystemOn, gateOpen)
      try {
        const localResponse = await api.get('/data/access-safety');
        localData = localResponse.data;
      } catch (localError) {
        console.error('Failed to fetch local access safety data', localError);
        if (data.attendance.length === 0) setLoading(false);
        return;
      }

      // --- 2. Fetch ThingSpeak Data (Last 24 hours of feeds) ---
      let newAttendanceRecords: AttendanceRecord[] = [];
      let currentLatestFeed = null;
      
      try {
        // Fetch last 24 hours of data. Using `results=500` ensures we get enough data, 
        // though ThingSpeak limits this typically.
        const historyUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&start=${startTime}&results=500`;
        const tsResponse = await fetch(historyUrl);
        if (!tsResponse.ok) throw new Error(`ThingSpeak History API failed: ${tsResponse.status}`);
        
        const tsHistoryData = await tsResponse.json();
        const feeds = tsHistoryData.feeds || [];

        // Reverse the array to process from oldest to newest for chronological logging,
        // then reverse back for display (newest first).
        for (const feed of feeds) {
             const rfidTag = feed[`field${THINGSPEAK_RFID_TAG_FIELD_ID}`] || null;
             const accessStatusValue = parseInt(feed[`field${THINGSPEAK_ACCESS_STATUS_FIELD_ID}`] || '9', 10);
            
            // Only process valid access scan entries
            if (rfidTag && (accessStatusValue === 1 || accessStatusValue === 0)) {
                const name = resolveName(rfidTag);
                const status: 'Verified' | 'Declined' = accessStatusValue === 1 ? 'Verified' : 'Declined';
                
                const record: AttendanceRecord = {
                    id: feed.entry_id.toString(),
                    employeeId: rfidTag,
                    name: name,
                    time: formatTime(new Date(feed.created_at)),
                    status: status,
                };
                
                newAttendanceRecords.push(record);
            }
        }

        // --- Determine LATEST status for the display box (only look at the latest entry) ---
        // Fetch the absolute latest feed (results=1) for live status indicator
        const latestFeedUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;
        const latestTsResponse = await fetch(latestFeedUrl);
        const latestTsData = await latestTsResponse.json();
        const latestFeed = latestTsData.feeds?.[0];

        if (latestFeed) {
             const dataTimestamp = new Date(latestFeed.created_at).getTime();
             const now = new Date().getTime();
             const isRecent = (now - dataTimestamp) <= DATA_RECENCY_THRESHOLD_MS; 

             // Fire Detection (Field 5) - Current Status
             const fireValue = parseFloat(latestFeed[`field${THINGSPEAK_FIRE_FIELD_ID}`] || '0');
             fireDetectedFromChannel = (fireValue > 0) && isRecent;

             // RFID Detection (Field 7 & 8) - Current Status
             const rfidTagValue = latestFeed[`field${THINGSPEAK_RFID_TAG_FIELD_ID}`] || null;
             const accessStatusValue = parseInt(latestFeed[`field${THINGSPEAK_ACCESS_STATUS_FIELD_ID}`] || '9', 10);
            
             if (isRecent && rfidTagValue) {
                latestRfidTagFromChannel = rfidTagValue;
                if (accessStatusValue === 1) {
                    accessStatusFromChannel = 'Accepted';
                } else if (accessStatusValue === 0) {
                    accessStatusFromChannel = 'Declined';
                }
             } else if (!isRecent) {
                latestRfidTagFromChannel = null;
                accessStatusFromChannel = 'Unknown';
             }
             
             // Resolve name for the absolute latest scan
             latestRfidNameFromChannel = resolveName(latestRfidTagFromChannel);
        }
        
      } catch (error) {
        console.warn(`ThingSpeak data fetch failed: ${error.message}. Using previous state/fallback.`);
      }

      // --- 3. Finalize and Update State ---
      
      const uniqueRecords = Array.from(new Map(newAttendanceRecords.map(item => [item.id, item])).values());
      // Sort newest to oldest for display
      uniqueRecords.sort((a, b) => parseInt(b.id) - parseInt(a.id)); 

      setData(prev => {
        const combinedLocalData = localData || prev; 
        
        return {
          ...combinedLocalData,
          fireDetected: fireDetectedFromChannel, 
          attendance: uniqueRecords, // Last 24 hours of ThingSpeak data
          latestRfidTag: latestRfidTagFromChannel,
          accessStatus: accessStatusFromChannel,
          uniqueAccessCount: countUniqueAccess(uniqueRecords),
          latestRfidName: latestRfidNameFromChannel,
        };
      });
      
    } catch (error) {
      console.error('An unexpected error occurred during data fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_RATE_MS); 
    return () => clearInterval(interval); 
  }, []); 

  const handleFireSystemToggle = async (checked: boolean) => {
    setData(prev => ({ ...prev!, fireSystemOn: checked }));
    try {
      await api.post('/data/access-safety/fire-system-toggle', { fireSystemOn: checked });
    } catch (error) {
      console.error('Failed to toggle fire system', error);
      setData(prev => ({ ...prev!, fireSystemOn: !checked })); 
    }
  };

  if (loading) {
    return <div>Loading access and safety controls...</div>;
  }

  // --- DERIVED STATE FOR UI ---
  const { fireSystemOn, attendance, accessStatus, uniqueAccessCount, latestRfidName } = data;
  
  const isFireAlerting = data.fireDetected; 
  const isAccessAccepted = accessStatus === 'Accepted';
  const isAccessDeclined = accessStatus === 'Declined';
  const isAccessActive = isAccessAccepted || isAccessDeclined; 
  
  const statusColor = isAccessAccepted ? 'bg-gradient-to-br from-green-400 to-green-500' 
                      : isAccessDeclined ? 'bg-gradient-to-br from-red-400 to-red-500'
                      : 'bg-gradient-to-br from-purple-400 to-purple-500';
  
  const statusRing = isAccessAccepted ? 'ring-green-200'
                     : isAccessDeclined ? 'ring-red-200'
                     : 'ring-purple-200';
  
  const statusText = isAccessAccepted ? 'ACCEPTED / GATE OPEN' 
                     : isAccessDeclined ? 'DECLINED / GATE CLOSED' 
                     : 'Awaiting Scan';
  
  const visualIcon = isAccessAccepted ? DoorOpen : Fingerprint;
  const visualIconClasses = isAccessAccepted || isAccessDeclined ? 'text-white' : 'text-slate-400';
                            
  const badgeVariant: "default" | "secondary" | "destructive" | "outline" = isAccessAccepted ? "default" : isAccessDeclined ? "destructive" : "secondary";
  
  const todaysCount = uniqueAccessCount;
  // --- END DERIVED STATE ---


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFID Access Control */}
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${statusColor} flex items-center justify-center transition-all`}>
                <Fingerprint className={`w-5 h-5 ${isAccessAccepted || isAccessDeclined ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-slate-900">RFID Access Control</div>
                <div className="text-xs text-slate-500">Card Authentication System (ThingSpeak Fields 7 & 8)</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div className={`w-36 h-36 rounded-full ${statusColor} ring-8 ${statusRing} flex items-center justify-center shadow-lg transition-all duration-500`}>
                  <visualIcon className={`w-20 h-20 ${visualIconClasses} ${isAccessAccepted ? 'animate-pulse' : ''}`} />
                </div>
                {isAccessAccepted && (
                  <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping"></div>
                )}
                {isAccessDeclined && (
                  <div className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"></div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Gate/Access Status</p>
                  <Badge variant={badgeVariant} className="w-full">
                    {statusText}
                  </Badge>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Unique Login Today</p>
                  <p className="text-2xl">{todaysCount}</p>
                </div>
              </div>
              
              {/* Display latest scanned Tag ID and Name if active */}
              {isAccessActive && (
                 <div className={`p-3 rounded-lg border ${isAccessAccepted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-slate-600 mb-1">Latest Scan Details</p>
                    <p className="font-medium text-sm mb-1">{latestRfidName}</p>
                    <p className="font-mono text-xs text-slate-500">UID: {data.latestRfidTag}</p>
                 </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-900">Access status and UID are polled directly from ThingSpeak.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fire Alarm System (Existing logic maintained) */}
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
              <div className="text-xs text-slate-500">RFID Authentication Records (Last 24 Hours)</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID (UID)</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono">{record.employeeId}</TableCell>
                  <TableCell>
                    {/* Display employee name, or 'Unknown' if not in map */}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        {/* Highlight unknown names */}
                        <span className={record.name === 'Unknown' ? 'text-red-600 font-medium' : ''}>
                            {record.name}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {record.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Conditional rendering for status badge */}
                    <Badge variant={record.status === 'Verified' ? 'outline' : 'destructive'} 
                           className={record.status === 'Verified' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
                      {record.status === 'Verified' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {record.status}
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