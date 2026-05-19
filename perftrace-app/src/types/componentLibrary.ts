export type ComponentType = 
  | 'resistor' 
  | 'capacitor' 
  | 'led' 
  | 'dip8' 
  | 'dip14' 
  | 'dip16' 
  | 'header1x2' 
  | 'header1x4' 
  | 'to92' 
  | 'to220'
  | 'arduino_nano';

export interface ComponentDefinition {
  type: ComponentType;
  namePrefix: string;
  category: string;
  defaultLabel: string;
  width: number; // in grid units
  height: number; // in grid units
  color: string;
}

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  {
    type: 'resistor',
    namePrefix: 'R',
    category: 'Passives',
    defaultLabel: '10k',
    width: 3,
    height: 1,
    color: '#d2b48c' // Tan color
  },
  {
    type: 'capacitor',
    namePrefix: 'C',
    category: 'Passives',
    defaultLabel: '100n',
    width: 2,
    height: 1,
    color: '#eab308' // Yellow ceramic
  },
  {
    type: 'led',
    namePrefix: 'D',
    category: 'Opto',
    defaultLabel: 'Red LED',
    width: 2,
    height: 1,
    color: '#ef4444' // Red
  },
  {
    type: 'dip8',
    namePrefix: 'U',
    category: 'ICs',
    defaultLabel: 'NE555',
    width: 4, // 4 pins long
    height: 3, // 3 holes wide (0.3" pitch)
    color: '#1f2937' // Dark gray
  },
  {
    type: 'dip14',
    namePrefix: 'U',
    category: 'ICs',
    defaultLabel: '74HC00',
    width: 7,
    height: 3,
    color: '#1f2937'
  },
  {
    type: 'dip16',
    namePrefix: 'U',
    category: 'ICs',
    defaultLabel: '74HC595',
    width: 8,
    height: 3,
    color: '#1f2937'
  },
  {
    type: 'arduino_nano',
    namePrefix: 'A',
    category: 'Microcontrollers',
    defaultLabel: 'Arduino Nano',
    width: 15,
    height: 7, // 0.6" spacing is 7 holes total (0 to 6)
    color: '#0369a1' // Arduino blue
  },
  {
    type: 'header1x2',
    namePrefix: 'J',
    category: 'Connectors',
    defaultLabel: 'PWR',
    width: 2,
    height: 1,
    color: '#374151'
  },
  {
    type: 'header1x4',
    namePrefix: 'J',
    category: 'Connectors',
    defaultLabel: 'I2C',
    width: 4,
    height: 1,
    color: '#374151'
  },
  {
    type: 'to92',
    namePrefix: 'Q',
    category: 'Semiconductors',
    defaultLabel: '2N3904',
    width: 3,
    height: 1,
    color: '#1f2937'
  },
  {
    type: 'to220',
    namePrefix: 'U',
    category: 'Semiconductors',
    defaultLabel: 'LM7805',
    width: 3,
    height: 2,
    color: '#1f2937'
  }
];
