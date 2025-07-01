import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Factory, AlertTriangle, CheckCircle, Clock, XCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BatchCard from "@/components/BatchCard";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import CheckpointInterface from "@/components/CheckpointInterface";
import ProcessStepsManager from "@/components/ProcessStepsManager";

export interface Batch {
  id: string;
  batchNumber: string;
  rawMaterial: string;
  quantity: number;
  unit: string;
  startTime: Date;
  currentStep: number;
  status: 'active' | 'completed' | 'rejected';
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  stepNumber: number;
  name: string;
  isCCP: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'reprocess';
  inspector?: string;
  timestamp?: Date;
  notes?: string;
  metrics?: QualityMetric[];
}

export interface QualityMetric {
  id: string;
  name: string;
  type: 'temperature' | 'weight' | 'visual' | 'ph' | 'moisture' | 'count' | 'percentage';
  value?: number | string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  required: boolean;
  passed?: boolean;
}

export interface ProcessStep {
  id: number;
  name: string;
  isCCP: boolean;
  estimatedTime: number; // in minutes
  description: string;
  metrics: QualityMetric[];
}

const defaultProcessingSteps: ProcessStep[] = [
  { 
    id: 1, 
    name: "RECEIVING OF RAW CHICKEN (CHILLED: <4°C, FROZEN: <-18°C)", 
    isCCP: true, 
    estimatedTime: 20,
    description: "Critical Control Point - Temperature verification and documentation",
    metrics: [
      { id: "rrc1", name: "Core Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true },
      { id: "rrc2", name: "Frozen Temperature", type: "temperature", unit: "°C", maxValue: -18, required: false },
      { id: "rrc3", name: "Vehicle Temperature Log", type: "visual", required: true },
      { id: "rrc4", name: "Delivery Documentation", type: "visual", required: true },
      { id: "rrc5", name: "Packaging Integrity", type: "visual", required: true }
    ]
  },
  { 
    id: 2, 
    name: "STORAGE OF FROZEN/CHILLED MEAT (Chiller temp <4°C)", 
    isCCP: false, 
    estimatedTime: 15,
    description: "Proper storage temperature maintenance",
    metrics: [
      { id: "sfm1", name: "Storage Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true },
      { id: "sfm2", name: "Storage Time", type: "count", unit: "hours", required: true },
      { id: "sfm3", name: "Storage Area Cleanliness", type: "visual", required: true }
    ]
  },
  { 
    id: 3, 
    name: "CHILLED MEAT R.O WATER + 0.2% ACETIC ACID DIP", 
    isCCP: false, 
    estimatedTime: 25,
    description: "Chemical treatment as per customer requirement",
    metrics: [
      { id: "aad1", name: "Acetic Acid Concentration", type: "percentage", unit: "%", minValue: 0.18, maxValue: 0.22, required: true },
      { id: "aad2", name: "Water Quality (RO)", type: "visual", required: true },
      { id: "aad3", name: "Dip Time", type: "count", unit: "minutes", minValue: 2, maxValue: 5, required: true },
      { id: "aad4", name: "Solution Temperature", type: "temperature", unit: "°C", minValue: 2, maxValue: 8, required: true }
    ]
  },
  { 
    id: 4, 
    name: "PHYSICAL INSPECTION-03-STAGE (BONES/FEATHERS/FOREIGN MATTER/BLOOD CLOTS/HAIRS)", 
    isCCP: true, 
    estimatedTime: 30,
    description: "Critical 3-stage physical inspection for contaminants",
    metrics: [
      { id: "pi1", name: "Bone Fragments Check", type: "visual", required: true },
      { id: "pi2", name: "Feather Removal Verification", type: "visual", required: true },
      { id: "pi3", name: "Foreign Matter Detection", type: "visual", required: true },
      { id: "pi4", name: "Blood Clot Removal", type: "visual", required: true },
      { id: "pi5", name: "Hair/Bristle Check", type: "visual", required: true },
      { id: "pi6", name: "Inspection Stage Completion", type: "count", unit: "stages", minValue: 3, maxValue: 3, required: true }
    ]
  },
  { 
    id: 5, 
    name: "PROCESSING OF MEAT", 
    isCCP: true, 
    estimatedTime: 45,
    description: "Main meat processing operations with quality controls",
    metrics: [
      { id: "pom1", name: "Processing Temperature", type: "temperature", unit: "°C", minValue: 2, maxValue: 6, required: true },
      { id: "pom2", name: "Processing Time", type: "count", unit: "minutes", required: true },
      { id: "pom3", name: "Equipment Sanitization", type: "visual", required: true },
      { id: "pom4", name: "Operator Hygiene Check", type: "visual", required: true },
      { id: "pom5", name: "Product Weight Loss", type: "percentage", unit: "%", maxValue: 10, required: true }
    ]
  },
  { 
    id: 6, 
    name: "METAL DETECTION", 
    isCCP: true, 
    estimatedTime: 10,
    description: "Critical Control Point - Metal contamination detection",
    metrics: [
      { id: "md1", name: "Metal Detector Calibration", type: "visual", required: true },
      { id: "md2", name: "Test Sample Pass", type: "visual", required: true },
      { id: "md3", name: "Reject System Function", type: "visual", required: true },
      { id: "md4", name: "Detection Sensitivity", type: "count", unit: "mm", maxValue: 2, required: true }
    ]
  },
  { 
    id: 7, 
    name: "PACKAGING", 
    isCCP: false, 
    estimatedTime: 20,
    description: "Product packaging with quality verification",
    metrics: [
      { id: "pkg1", name: "Package Weight Accuracy", type: "weight", unit: "kg", required: true },
      { id: "pkg2", name: "Seal Integrity", type: "visual", required: true },
      { id: "pkg3", name: "Label Verification", type: "visual", required: true },
      { id: "pkg4", name: "Packaging Material Quality", type: "visual", required: true }
    ]
  },
  { 
    id: 8, 
    name: "FINAL QUALITY CHECK", 
    isCCP: true, 
    estimatedTime: 15,
    description: "Final quality verification before storage",
    metrics: [
      { id: "fqc1", name: "Product Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true },
      { id: "fqc2", name: "Visual Quality Assessment", type: "visual", required: true },
      { id: "fqc3", name: "Weight Verification", type: "weight", unit: "kg", required: true },
      { id: "fqc4", name: "Microbiological Sample", type: "visual", required: true },
      { id: "fqc5", name: "Documentation Complete", type: "visual", required: true }
    ]
  },
  { 
    id: 9, 
    name: "COLD STORAGE", 
    isCCP: true, 
    estimatedTime: 10,
    description: "Critical Control Point - Cold storage with temperature monitoring",
    metrics: [
      { id: "cs1", name: "Storage Temperature", type: "temperature", unit: "°C", minValue: -2, maxValue: 2, required: true },
      { id: "cs2", name: "Humidity Level", type: "percentage", unit: "%", minValue: 80, maxValue: 95, required: true },
      { id: "cs3", name: "Storage Area Hygiene", type: "visual", required: true },
      { id: "cs4", name: "Temperature Logger Function", type: "visual", required: true }
    ]
  },
  { 
    id: 10, 
    name: "DISPATCH", 
    isCCP: false, 
    estimatedTime: 15,
    description: "Final dispatch preparation and documentation",
    metrics: [
      { id: "dsp1", name: "Transport Vehicle Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true },
      { id: "dsp2", name: "Loading Documentation", type: "visual", required: true },
      { id: "dsp3", name: "Delivery Schedule Compliance", type: "visual", required: true },
      { id: "dsp4", name: "Vehicle Hygiene Check", type: "visual", required: true }
    ]
  }
];

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProcessManager, setShowProcessManager] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<{batch: Batch, checkpoint: Checkpoint} | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessStep[]>(defaultProcessingSteps);
  const { toast } = useToast();

  // Initialize with sample data
  useEffect(() => {
    const sampleBatches: Batch[] = [
      {
        id: "batch-001",
        batchNumber: "CHB27F25SYR",
        rawMaterial: "Chicken Breast",
        quantity: 500,
        unit: "kg",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        currentStep: 4,
        status: 'active',
        checkpoints: processingSteps.map(step => ({
          id: `${step.id}-001`,
          stepNumber: step.id,
          name: step.name,
          isCCP: step.isCCP,
          status: step.id <= 3 ? 'approved' : step.id === 4 ? 'pending' : 'pending'
        }))
      },
      {
        id: "batch-002",
        batchNumber: "MUT15F25ABC",
        rawMaterial: "Mutton Pieces",
        quantity: 250,
        unit: "kg",
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        currentStep: 7,
        status: 'active',
        checkpoints: processingSteps.map(step => ({
          id: `${step.id}-002`,
          stepNumber: step.id,
          name: step.name,
          isCCP: step.isCCP,
          status: step.id <= 6 ? 'approved' : step.id === 7 ? 'pending' : 'pending'
        }))
      }
    ];
    setBatches(sampleBatches);
  }, []);

  const handleCreateBatch = (batchData: Omit<Batch, 'id' | 'checkpoints' | 'status' | 'currentStep'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      status: 'active',
      currentStep: 1,
      checkpoints: processingSteps.map(step => ({
        id: `${step.id}-${Date.now()}`,
        stepNumber: step.id,
        name: step.name,
        isCCP: step.isCCP,
        status: step.id === 1 ? 'pending' : 'pending',
        metrics: step.metrics.map(metric => ({ ...metric, passed: undefined }))
      }))
    };
    
    setBatches(prev => [...prev, newBatch]);
    setShowCreateDialog(false);
    toast({
      title: "Batch Created",
      description: `Batch ${newBatch.batchNumber} has been started successfully.`,
    });
  };

  const handleCheckpointAction = (batchId: string, checkpointId: string, action: 'approved' | 'rejected' | 'reprocess', notes?: string, metrics?: QualityMetric[]) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === batchId) {
        const updatedCheckpoints = batch.checkpoints.map(checkpoint => {
          if (checkpoint.id === checkpointId) {
            return {
              ...checkpoint,
              status: action,
              inspector: "Current User",
              timestamp: new Date(),
              notes,
              metrics: metrics || checkpoint.metrics
            };
          }
          return checkpoint;
        });
        
        const updatedBatch = { ...batch, checkpoints: updatedCheckpoints };
        
        // Update current step and batch status
        if (action === 'approved') {
          const currentCheckpoint = updatedCheckpoints.find(cp => cp.id === checkpointId);
          if (currentCheckpoint && currentCheckpoint.stepNumber === batch.currentStep) {
            updatedBatch.currentStep = Math.min(batch.currentStep + 1, processingSteps.length);
            if (updatedBatch.currentStep > processingSteps.length) {
              updatedBatch.status = 'completed';
            }
          }
        } else if (action === 'rejected') {
          updatedBatch.status = 'rejected';
        }
        
        return updatedBatch;
      }
      return batch;
    }));
    
    setSelectedCheckpoint(null);
    toast({
      title: "Checkpoint Updated",
      description: `Step ${selectedCheckpoint?.checkpoint.stepNumber} ${action} successfully.`,
    });
  };

  const activeBatches = batches.filter(batch => batch.status === 'active');
  const completedBatches = batches.filter(batch => batch.status === 'completed');
  const rejectedBatches = batches.filter(batch => batch.status === 'rejected');
  const pendingCCPs = batches.reduce((acc, batch) => {
    const pendingCCPCount = batch.checkpoints.filter(cp => cp.isCCP && cp.status === 'pending').length;
    return acc + pendingCCPCount;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Non-Veg Processing Factory</h1>
                <p className="text-gray-600">Real-time batch monitoring and quality control system</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowProcessManager(true)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Process Steps
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeBatches.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending CCPs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCCPs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedBatches.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedBatches.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Active Batches</h2>
            <p className="text-sm text-gray-600">Total {processingSteps.length} process steps configured | {processingSteps.filter(s => s.isCCP).length} Critical Control Points</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>

        {/* Batch Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeBatches.map(batch => (
            <BatchCard 
              key={batch.id} 
              batch={batch} 
              processingSteps={processingSteps}
              onCheckpointClick={(checkpoint) => setSelectedCheckpoint({batch, checkpoint})}
            />
          ))}
        </div>

        {activeBatches.length === 0 && (
          <div className="text-center py-12">
            <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Batches</h3>
            <p className="text-gray-500 mb-4">Start processing by creating a new batch</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Batch
            </Button>
          </div>
        )}

        {/* Completed and Rejected Sections */}
        {(completedBatches.length > 0 || rejectedBatches.length > 0) && (
          <div className="mt-12 space-y-8">
            {completedBatches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Batches</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {completedBatches.map(batch => (
                    <BatchCard 
                      key={batch.id} 
                      batch={batch} 
                      processingSteps={processingSteps}
                      onCheckpointClick={() => {}}
                      readonly
                    />
                  ))}
                </div>
              </div>
            )}
            
            {rejectedBatches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejected Batches</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {rejectedBatches.map(batch => (
                    <BatchCard 
                      key={batch.id} 
                      batch={batch} 
                      processingSteps={processingSteps}
                      onCheckpointClick={() => {}}
                      readonly
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateBatchDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateBatch={handleCreateBatch}
      />

      <ProcessStepsManager
        open={showProcessManager}
        onOpenChange={setShowProcessManager}
        processingSteps={processingSteps}
        onUpdateSteps={setProcessingSteps}
      />

      {selectedCheckpoint && (
        <CheckpointInterface
          open={!!selectedCheckpoint}
          onOpenChange={() => setSelectedCheckpoint(null)}
          batch={selectedCheckpoint.batch}
          checkpoint={selectedCheckpoint.checkpoint}
          processStep={processingSteps.find(step => step.id === selectedCheckpoint.checkpoint.stepNumber)}
          onAction={handleCheckpointAction}
        />
      )}
    </div>
  );
};

export default Index;
