// Synthetic Indian Data Generators for ECOSPHERE

export const CITIES_AND_LOCATIONS = [
  { city: 'Pune', state: 'Maharashtra', areas: ['Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Wakad', 'Baner', 'Kothrud', 'Viman Nagar', 'Aundh', 'Hadapsar'] },
  { city: 'Mumbai', state: 'Maharashtra', areas: ['Andheri West', 'Bandra West', 'Powai', 'Lower Parel', 'Juhu', 'Thane West', 'Navi Mumbai'] },
  { city: 'Bengaluru', state: 'Karnataka', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City', 'Jayanagar'] },
  { city: 'Hyderabad', state: 'Telangana', areas: ['HITEC City', 'Gachibowli', 'Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Kondapur'] },
  { city: 'Delhi', state: 'Delhi', areas: ['Connaught Place', 'South Extension', 'Dwarka', 'Saket', 'Karol Bagh', 'Rohini'] },
  { city: 'Ahmedabad', state: 'Gujarat', areas: ['SG Highway', 'Bodakdev', 'Navrangpura', 'Satellite', 'Prahlad Nagar'] },
  { city: 'Chennai', state: 'Tamil Nadu', areas: ['T. Nagar', 'Adyar', 'Velachery', 'Anna Nagar', 'O M R'] },
  { city: 'Kolkata', state: 'West Bengal', areas: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge'] },
  { city: 'Nashik', state: 'Maharashtra', areas: ['College Road', 'Gangapur Road', 'Indira Nagar', 'Govind Nagar'] },
  { city: 'Nagpur', state: 'Maharashtra', areas: ['Dharampeth', 'Civil Lines', 'Manewada', 'Wardha Road'] },
];

export const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith', 'Aarush', 'Kabir', 'Anay', 'Dhruv', 'Rudra',
  'Ananya', 'Aadhya', 'Diya', 'Pari', 'Anika', 'Navya', 'Angel', 'Avani', 'Myra', 'Ira',
  'Aarna', 'Riya', 'Isha', 'Aanya', 'Saanvi', 'Kavya', 'Aditi', 'Prisha', 'Tanvi', 'Vanya',
  'Rohan', 'Kiran', 'Siddharth', 'Vikram', 'Meera', 'Neha', 'Pooja', 'Rahul', 'Amit', 'Rajesh',
  'Suresh', 'Priya', 'Sanjay', 'Deepak', 'Manish', 'Anita', 'Sunita', 'Swati', 'Gauresh', 'Deepika',
];

export const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehta', 'Patel', 'Joshi', 'Kulkarni', 'Deshmukh', 'Patil', 'Pawar',
  'Rao', 'Reddy', 'Nair', 'Menon', 'Kumar', 'Singh', 'Chaudhary', 'Bhat', 'Agarwal', 'Shah',
  'Trivedi', 'Pandey', 'Mishra', 'Yadav', 'Malhotra', 'Kapoor', 'Saxena', 'Deshpande', 'Gokhale', 'Shukla',
];

export const BUSINESS_PREFIXES = [
  'VoltCraft', 'TechCraft', 'EcoPulse', 'GreenSpace', 'SmartHome', 'UrbanFix', 'PureBite', 'FreshCart',
  'AuraCare', 'OmniFit', 'ApexAuto', 'OptimaMedia', 'VeloxLogistics', 'NovaBuild', 'ZenithEdu',
  'StarlightEvents', 'ElysianSpa', 'MetroBites', 'BioFresh', 'CyberCore', 'InfiniTech', 'PrimeSupply',
];

export const BUSINESS_SUFFIXES = [
  'Solutions', 'Technologies', 'Services', 'Enterprises', 'Hub', 'Labs', 'Studio', 'Store',
  'Mart', 'Co.', 'Group', 'Networks', 'Diagnostics', 'Retail', 'Logistics', 'Works',
];

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number, decimals = 2): number {
  const rand = Math.random() * (max - min) + min;
  return parseFloat(rand.toFixed(decimals));
}

export function generatePhone(): string {
  const prefixes = ['98', '97', '96', '95', '99', '94', '93', '91', '88', '87', '70', '79'];
  const prefix = getRandomElement(prefixes);
  const rest = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${rest.slice(0, 8)}`;
}

export function generateDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
