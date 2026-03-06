// Dummy data structures for Computer Vision Dashboard

export interface Detection {
  id: string;
  timestamp: string;
  type: 'person' | 'object' | 'loitering' | 'staff';
  camera: string;
  confidence: number;
  location: string;
  details: string;
}

export interface VisitorData {
  timestamp: string;
  count: number;
  trend: number; // percentage change
}

export interface LoiteringAlert {
  id: string;
  camera: string;
  duration: number; // in minutes
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'break';
  location: string;
  lastSeen: string;
  efficiency: number; // percentage
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  currentDetections: number;
  uptime: number; // percentage
}

// Dummy visitor data
export const visitorData: VisitorData[] = [
  { timestamp: '00:00', count: 45, trend: -5 },
  { timestamp: '02:00', count: 23, trend: -48 },
  { timestamp: '04:00', count: 12, trend: -48 },
  { timestamp: '06:00', count: 34, trend: 183 },
  { timestamp: '08:00', count: 87, trend: 156 },
  { timestamp: '10:00', count: 156, trend: 79 },
  { timestamp: '12:00', count: 203, trend: 30 },
  { timestamp: '14:00', count: 198, trend: -2 },
  { timestamp: '16:00', count: 267, trend: 35 },
  { timestamp: '18:00', count: 289, trend: 8 },
  { timestamp: '20:00', count: 234, trend: -19 },
  { timestamp: '22:00', count: 145, trend: -38 },
];

// Dummy detection logs
export const detectionLogs: Detection[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    type: 'person',
    camera: 'Cam 01',
    confidence: 98,
    location: 'Main Entrance',
    details: 'Customer entering store',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    type: 'loitering',
    camera: 'Cam 03',
    confidence: 92,
    location: 'Aisle 3',
    details: 'Customer loitering for 8 minutes',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    type: 'staff',
    camera: 'Cam 04',
    confidence: 95,
    location: 'Checkout Counter',
    details: 'Staff member assisting customer',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    type: 'object',
    camera: 'Cam 02',
    confidence: 87,
    location: 'Aisle 1',
    details: 'Product displaced on shelf',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: 'person',
    camera: 'Cam 01',
    confidence: 96,
    location: 'Main Entrance',
    details: 'Customer exiting store',
  },
];

// Dummy loitering alerts
export const loiteringAlerts: LoiteringAlert[] = [
  {
    id: '1',
    camera: 'Cam 03',
    duration: 12,
    location: 'Aisle 3 - Electronics',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    severity: 'medium',
  },
  {
    id: '2',
    camera: 'Cam 05',
    duration: 8,
    location: 'Back Storage',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    severity: 'high',
  },
  {
    id: '3',
    camera: 'Cam 02',
    duration: 6,
    location: 'Aisle 1 - Produce',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    severity: 'low',
  },
];

// Dummy staff members
export const staffMembers: StaffMember[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Cashier',
    status: 'active',
    location: 'Checkout Counter',
    lastSeen: new Date(Date.now() - 30000).toISOString(),
    efficiency: 94,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Stock Associate',
    status: 'active',
    location: 'Aisle 2',
    lastSeen: new Date(Date.now() - 1 * 60000).toISOString(),
    efficiency: 87,
  },
  {
    id: '3',
    name: 'Mike Davis',
    role: 'Store Manager',
    status: 'break',
    location: 'Break Room',
    lastSeen: new Date(Date.now() - 8 * 60000).toISOString(),
    efficiency: 91,
  },
  {
    id: '4',
    name: 'Emily Brown',
    role: 'Customer Service',
    status: 'active',
    location: 'Customer Service Desk',
    lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
    efficiency: 89,
  },
];

// Dummy camera feeds
export const cameraFeeds: CameraFeed[] = [
  {
    id: '1',
    name: 'Cam 01',
    location: 'Main Entrance',
    status: 'active',
    currentDetections: 3,
    uptime: 99.8,
  },
  {
    id: '2',
    name: 'Cam 02',
    location: 'Aisle 1 - Produce',
    status: 'active',
    currentDetections: 8,
    uptime: 99.6,
  },
  {
    id: '3',
    name: 'Cam 03',
    location: 'Aisle 3 - Electronics',
    status: 'active',
    currentDetections: 5,
    uptime: 98.9,
  },
  {
    id: '4',
    name: 'Cam 04',
    location: 'Checkout Counter',
    status: 'active',
    currentDetections: 2,
    uptime: 99.9,
  },
  {
    id: '5',
    name: 'Cam 05',
    location: 'Back Storage',
    status: 'inactive',
    currentDetections: 0,
    uptime: 95.2,
  },
];
