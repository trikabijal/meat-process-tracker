
export interface Batch {
  id: string;
  batchNumber: string;
  rawMaterial: string;
  rawMaterialType: 'frozen' | 'chilled' | 'seasonings' | 'packaging';
  quantity: number;
  unit: string;
  startTime: Date;
  currentStep: number;
  status: 'active' | 'completed' | 'rejected';
  checkpoints: Checkpoint[];
  parallelProcesses?: number[]; // Array of step IDs that can run in parallel
}

export interface Checkpoint {
  id: string;
  stepNumber: number;
  name: string;
  isCCP: boolean;
  ccpNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reprocess' | 'in_progress';
  inspector?: string;
  timestamp?: Date;
  notes?: string;
  metrics?: QualityMetric[];
}

export interface QualityMetric {
  id: string;
  name: string;
  type: 'temperature' | 'weight' | 'visual' | 'ph' | 'moisture' | 'count' | 'percentage' | 'time' | 'pressure';
  value?: number | string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  required: boolean;
  passed?: boolean;
  helpText?: string;
}

export interface ProcessStep {
  id: number;
  name: string;
  isCCP: boolean;
  ccpNumber?: string;
  estimatedTime: number;
  description: string;
  metrics: QualityMetric[];
  materialTypes: ('frozen' | 'chilled' | 'seasonings' | 'packaging')[];
  stage: 'preprocessing' | 'processing' | 'packaging';
}

export type ProcessStage = 'preprocessing' | 'processing' | 'packaging';
