
export interface CostItem {
  name: string;
  estimatedPrice: number;
}

export interface MaterialPrice {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: 'consumables' | 'paint' | 'preparation';
}

export interface ServiceCard {
  id: string;
  title: string;
  imageUrl: string;
}

export interface RepairEstimate {
  summary: string;
  parts: CostItem[];
  materials: CostItem[];
  laborHours: number;
  laborCost: number;
  totalEstimate: number;
}

export interface ClientData {
  // Personal
  fullName: string;
  cpf: string;
  phone: string;
  email: string;
  
  // Address
  zipCode: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;

  // Vehicle
  carModel: string;
  carPlate: string;
  carYear: string;
  carColor: string;
}

export interface ServiceOrder {
  id: string;
  date: string;
  status: 'pending' | 'approved' | 'completed';
  client: ClientData;
  estimate: RepairEstimate;
  originalImage: string; // Base64
  repairedImage: string | null; // Base64
}

export enum AppState {
  IDLE = 'IDLE',
  REGISTERING = 'REGISTERING', // First step now
  UPLOAD_PROMPT = 'UPLOAD_PROMPT', // New state: After register, before camera
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  SUCCESS = 'SUCCESS',
  ADMIN = 'ADMIN',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  originalImage: string; // Base64
  repairedImage: string | null; // Base64
  estimate: RepairEstimate | null;
}
