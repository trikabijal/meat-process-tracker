
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
  rawMaterialType: 'frozen' | 'chilled' | 'seasonings' | 'packaging';
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
  ccpNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reprocess';
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
}

const frozenChilledProcessSteps: ProcessStep[] = [
  {
    id: 0,
    name: "VEHICLE INSPECTION CHECK",
    isCCP: false,
    estimatedTime: 15,
    description: "Inspection of delivery vehicle and transportation conditions",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "vic1", name: "Vehicle Temperature Log", type: "visual", required: true, helpText: "Check vehicle temperature records for entire journey" },
      { id: "vic2", name: "Vehicle Cleanliness", type: "visual", required: true, helpText: "Inspect cargo area for cleanliness and contamination" },
      { id: "vic3", name: "Documentation Complete", type: "visual", required: true, helpText: "Verify delivery documents and health certificates" },
      { id: "vic4", name: "Seal Integrity", type: "visual", required: true, helpText: "Check if vehicle seals are intact" }
    ]
  },
  {
    id: 1,
    name: "RECEIVING OF RAW CHICKEN (CHILLED: ≤4°C, FROZEN: ≤-18°C)",
    isCCP: true,
    ccpNumber: "CCP-01",
    estimatedTime: 20,
    description: "Critical Control Point - Temperature verification and intake documentation",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "rrc1", name: "Surface Temperature - Chilled", type: "temperature", unit: "°C", maxValue: 4, required: true, helpText: "Use digital probe on multiple cartons. Sample from different areas." },
      { id: "rrc2", name: "Core Temperature - Frozen", type: "temperature", unit: "°C", maxValue: -18, required: false, helpText: "Use core probe or IR gun. Take core temp if feasible." },
      { id: "rrc3", name: "Visual Condition Assessment", type: "visual", required: true, helpText: "Check for signs of thawing, discoloration, or damage. Attach photo for any deviation." },
      { id: "rrc4", name: "Time from Unloading to Storage", type: "time", unit: "minutes", maxValue: 30, required: true, helpText: "Record time in/time out. System triggers alert if delayed." },
      { id: "rrc5", name: "Packaging Integrity", type: "visual", required: true, helpText: "Check for torn packages, vacuum loss, or contamination" }
    ]
  },
  {
    id: 2,
    name: "STORAGE OF FROZEN/CHILLED MEAT (Chiller temp <4°C)",
    isCCP: false,
    estimatedTime: 10,
    description: "Proper storage temperature maintenance and monitoring",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "sfm1", name: "Storage Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true, helpText: "Monitor cold room temperature continuously" },
      { id: "sfm2", name: "Storage Duration", type: "time", unit: "hours", required: true, helpText: "Track storage time before processing" },
      { id: "sfm3", name: "Storage Area Hygiene", type: "visual", required: true, helpText: "Check cleanliness and pest control" }
    ]
  },
  {
    id: 3,
    name: "THAWING (Meat temp <4°C) - FROZEN ONLY",
    isCCP: false,
    estimatedTime: 120,
    description: "Controlled thawing process for frozen meat",
    materialTypes: ['frozen'],
    metrics: [
      { id: "thaw1", name: "Thawing Temperature", type: "temperature", unit: "°C", maxValue: 4, required: true, helpText: "Monitor meat temperature during thawing" },
      { id: "thaw2", name: "Thawing Time", type: "time", unit: "hours", required: true, helpText: "Track total thawing duration" },
      { id: "thaw3", name: "Surface Condition", type: "visual", required: true, helpText: "Check for proper thawing without spoilage" }
    ]
  },
  {
    id: 4,
    name: "CHILLED MEAT R.O WATER + 0.2% ACETIC ACID DIP",
    isCCP: false,
    estimatedTime: 25,
    description: "Chemical treatment as per customer requirement",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "aad1", name: "Acetic Acid Concentration", type: "percentage", unit: "%", minValue: 0.18, maxValue: 0.22, required: true, helpText: "Test solution concentration with pH meter" },
      { id: "aad2", name: "RO Water Quality", type: "visual", required: true, helpText: "Check water clarity and test reports" },
      { id: "aad3", name: "Dip Duration", type: "time", unit: "minutes", minValue: 2, maxValue: 5, required: true, helpText: "Time each batch in solution" },
      { id: "aad4", name: "Solution Temperature", type: "temperature", unit: "°C", minValue: 2, maxValue: 8, required: true, helpText: "Monitor dip solution temperature" }
    ]
  },
  {
    id: 5,
    name: "PHYSICAL INSPECTION-3-STAGE (BONES/FEATHERS/FOREIGN MATTER/BLOOD CLOTS/HAIRS)",
    isCCP: false,
    estimatedTime: 30,
    description: "Critical 3-stage physical inspection for contaminants",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "pi1", name: "Bone Fragments Check", type: "visual", required: true, helpText: "Inspect for any remaining bone pieces - Stage 1" },
      { id: "pi2", name: "Feather Removal Verification", type: "visual", required: true, helpText: "Check complete feather removal - Stage 2" },
      { id: "pi3", name: "Foreign Matter Detection", type: "visual", required: true, helpText: "Look for plastic, metal, or other foreign objects - Stage 3" },
      { id: "pi4", name: "Blood Clot Removal", type: "visual", required: true, helpText: "Ensure all blood clots are removed" },
      { id: "pi5", name: "Hair/Bristle Check", type: "visual", required: true, helpText: "Final check for any remaining hair or bristles" },
      { id: "pi6", name: "Inspection Stages Completed", type: "count", unit: "stages", minValue: 3, maxValue: 3, required: true, helpText: "Confirm all 3 inspection stages completed" }
    ]
  },
  {
    id: 6,
    name: "PROCESSING OF MEAT - WEIGHING & ISSUANCE OF R.M.",
    isCCP: false,
    estimatedTime: 20,
    description: "Accurate weighing and raw material issuance",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "weigh1", name: "Batch Weight Accuracy", type: "weight", unit: "kg", required: true, helpText: "Verify weight against specifications" },
      { id: "weigh2", name: "Scale Calibration", type: "visual", required: true, helpText: "Check scale calibration certificate" },
      { id: "weigh3", name: "Issuance Documentation", type: "visual", required: true, helpText: "Complete issuance forms and batch records" }
    ]
  },
  {
    id: 7,
    name: "COOKING TO CORE TEMP (Oven/Steam/Smoking) ≥75°C",
    isCCP: true,
    ccpNumber: "CCP-02",
    estimatedTime: 45,
    description: "Critical Control Point - Ensure pathogens are eliminated",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "cook1", name: "Core Temperature at Thickest Part", type: "temperature", unit: "°C", minValue: 75, required: true, helpText: "Insert probe in thickest part. Record highest temp. Measure multiple spots." },
      { id: "cook2", name: "Cooking Cycle Time", type: "time", unit: "minutes", required: true, helpText: "Minimum validated time for equipment. Auto-logged if integrated." },
      { id: "cook3", name: "Batch Size vs Capacity", type: "visual", required: true, helpText: "Flag if overloaded - risk of undercooking" },
      { id: "cook4", name: "Equipment Temperature Calibration", type: "visual", required: true, helpText: "Verify oven/steamer calibration" }
    ]
  },
  {
    id: 8,
    name: "PACKAGING/VACUUM PACKING/LABELLING (Product temp ≤50°C)",
    isCCP: true,
    ccpNumber: "CCP-03",
    estimatedTime: 25,
    description: "Critical Control Point - Prevent bacterial growth after cooking",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "pack1", name: "Product Surface Temperature", type: "temperature", unit: "°C", maxValue: 50, required: true, helpText: "Use infrared temp gun. Spot-check packs from start/middle/end of batch." },
      { id: "pack2", name: "Time from Cook to Pack", type: "time", unit: "minutes", required: true, helpText: "Auto or manual timestamp. Alerts if outside window." },
      { id: "pack3", name: "Packaging Integrity", type: "visual", required: true, helpText: "Check for leaks, proper seal. Attach photo of defective pack." },
      { id: "pack4", name: "Label Accuracy", type: "visual", required: true, helpText: "Verify batch codes, dates, and product information" }
    ]
  },
  {
    id: 9,
    name: "METAL DETECTION (1.2mmFe, 1.5mmNFe, 1.8mmSS)",
    isCCP: true,
    ccpNumber: "CCP-04",
    estimatedTime: 15,
    description: "Critical Control Point - Prevent physical contamination",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "md1", name: "Test Piece Detection - Fe", type: "visual", required: true, helpText: "Insert Fe ≥1.2mm test piece. Auto-prompt with photo if fail." },
      { id: "md2", name: "Test Piece Detection - NFe", type: "visual", required: true, helpText: "Insert NFe ≥1.5mm test piece. Pass/Fail record." },
      { id: "md3", name: "Test Piece Detection - SS", type: "visual", required: true, helpText: "Insert SS ≥1.8mm test piece. Pass/Fail record." },
      { id: "md4", name: "Reject Mechanism Function", type: "visual", required: true, helpText: "Test reject system works properly" },
      { id: "md5", name: "Product Rejection Rate", type: "percentage", unit: "%", required: true, helpText: "High rejection rate triggers investigation" }
    ]
  },
  {
    id: 10,
    name: "STERILIZATION (RETORT) 121°C @ 15 psi for 9-12 mins",
    isCCP: true,
    ccpNumber: "CCP-05",
    estimatedTime: 30,
    description: "Critical Control Point - Kill spores & extend shelf life",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "ster1", name: "Retort Chamber Temperature", type: "temperature", unit: "°C", minValue: 119, maxValue: 123, required: true, helpText: "Auto-log from retort sensor. Alert if drop detected." },
      { id: "ster2", name: "Retort Pressure", type: "pressure", unit: "psi", minValue: 14, maxValue: 16, required: true, helpText: "Auto-log pressure readings" },
      { id: "ster3", name: "Sterilization Cycle Time", type: "time", unit: "minutes", minValue: 9, maxValue: 12, required: true, helpText: "SOP defined time - auto-logged" },
      { id: "ster4", name: "Seal Integrity After Retort", type: "visual", required: true, helpText: "Check random pack sample for burst or loose seals" },
      { id: "ster5", name: "Process Validation", type: "visual", required: true, helpText: "Confirm all process parameters met" }
    ]
  },
  {
    id: 11,
    name: "BLAST FREEZING (<-18°C CORE)",
    isCCP: false,
    estimatedTime: 60,
    description: "Rapid freezing to required core temperature",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "blast1", name: "Core Temperature Achievement", type: "temperature", unit: "°C", maxValue: -18, required: true, helpText: "Verify core temperature reaches -18°C" },
      { id: "blast2", name: "Freezing Time", type: "time", unit: "minutes", required: true, helpText: "Record time to reach core temperature" },
      { id: "blast3", name: "Product Quality Post-Freeze", type: "visual", required: true, helpText: "Check for freezer burn or quality issues" }
    ]
  },
  {
    id: 12,
    name: "FINAL PACKING & DISPATCH (-18°C & transport <-2°C)",
    isCCP: false,
    estimatedTime: 20,
    description: "Final packaging and dispatch temperature control",
    materialTypes: ['frozen', 'chilled'],
    metrics: [
      { id: "disp1", name: "Final Product Temperature", type: "temperature", unit: "°C", maxValue: -18, required: true, helpText: "Check product temperature before dispatch" },
      { id: "disp2", name: "Transport Vehicle Temperature", type: "temperature", unit: "°C", maxValue: -2, required: true, helpText: "Verify transport vehicle temperature" },
      { id: "disp3", name: "Loading Documentation", type: "visual", required: true, helpText: "Complete dispatch documents and temperature logs" },
      { id: "disp4", name: "Vehicle Hygiene Check", type: "visual", required: true, helpText: "Inspect transport vehicle cleanliness" }
    ]
  }
];

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProcessManager, setShowProcessManager] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<{batch: Batch, checkpoint: Checkpoint} | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessStep[]>(frozenChilledProcessSteps);
  const { toast } = useToast();

  // Initialize with sample data
  useEffect(() => {
    const sampleBatches: Batch[] = [
      {
        id: "batch-001",
        batchNumber: "CHB27F25SYR",
        rawMaterial: "Chicken Breast",
        rawMaterialType: 'chilled',
        quantity: 500,
        unit: "kg",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        currentStep: 1,
        status: 'active',
        checkpoints: processingSteps
          .filter(step => step.materialTypes.includes('chilled'))
          .map(step => ({
            id: `${step.id}-001`,
            stepNumber: step.id,
            name: step.name,
            isCCP: step.isCCP,
            ccpNumber: step.ccpNumber,
            status: step.id === 0 ? 'approved' : step.id === 1 ? 'pending' : 'pending' as const,
            metrics: step.metrics.map(metric => ({ ...metric, passed: undefined }))
          }))
      },
      {
        id: "batch-002",
        batchNumber: "MUT15F25ABC",
        rawMaterial: "Mutton Pieces",
        rawMaterialType: 'frozen',
        quantity: 250,
        unit: "kg",
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        currentStep: 7,
        status: 'active',
        checkpoints: processingSteps
          .filter(step => step.materialTypes.includes('frozen'))
          .map(step => ({
            id: `${step.id}-002`,
            stepNumber: step.id,
            name: step.name,
            isCCP: step.isCCP,
            ccpNumber: step.ccpNumber,
            status: step.id <= 6 ? 'approved' : step.id === 7 ? 'pending' : 'pending' as const,
            metrics: step.metrics.map(metric => ({ ...metric, passed: undefined }))
          }))
      }
    ];
    setBatches(sampleBatches);
  }, []);

  const handleCreateBatch = (batchData: Omit<Batch, 'id' | 'checkpoints' | 'status' | 'currentStep'>) => {
    const relevantSteps = processingSteps.filter(step => 
      step.materialTypes.includes(batchData.rawMaterialType)
    );
    
    const newBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      status: 'active',
      currentStep: relevantSteps[0]?.id || 0,
      checkpoints: relevantSteps.map(step => ({
        id: `${step.id}-${Date.now()}`,
        stepNumber: step.id,
        name: step.name,
        isCCP: step.isCCP,
        ccpNumber: step.ccpNumber,
        status: step.id === relevantSteps[0]?.id ? 'pending' : 'pending' as const,
        metrics: step.metrics.map(metric => ({ ...metric, passed: undefined }))
      }))
    };
    
    setBatches(prev => [...prev, newBatch]);
    setShowCreateDialog(false);
    toast({
      title: "Batch Created",
      description: `Batch ${newBatch.batchNumber} (${newBatch.rawMaterialType.toUpperCase()}) has been started successfully.`,
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
            const nextStep = batch.checkpoints.find(cp => cp.stepNumber > batch.currentStep);
            updatedBatch.currentStep = nextStep ? nextStep.stepNumber : batch.currentStep;
            if (!nextStep) {
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
      description: `${selectedCheckpoint?.checkpoint.ccpNumber || `Step ${selectedCheckpoint?.checkpoint.stepNumber}`} ${action} successfully.`,
    });
  };

  const activeBatches = batches.filter(batch => batch.status === 'active');
  const completedBatches = batches.filter(batch => batch.status === 'completed');
  const rejectedBatches = batches.filter(batch => batch.status === 'rejected');
  const pendingCCPs = batches.reduce((acc, batch) => {
    const pendingCCPCount = batch.checkpoints.filter(cp => cp.isCCP && cp.status === 'pending').length;
    return acc + pendingCCPCount;
  }, 0);

  const totalCCPs = processingSteps.filter(step => step.isCCP).length;

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
                <p className="text-gray-600">Real-time batch monitoring and HACCP compliance system</p>
                <p className="text-sm text-gray-500">Process Steps: {processingSteps.length} | Critical Control Points (CCPs): {totalCCPs}</p>
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
              <p className="text-xs text-muted-foreground">
                Frozen: {activeBatches.filter(b => b.rawMaterialType === 'frozen').length} | 
                Chilled: {activeBatches.filter(b => b.rawMaterialType === 'chilled').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending CCPs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCCPs}</div>
              <p className="text-xs text-muted-foreground">Critical checkpoints requiring attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedBatches.length}</div>
              <p className="text-xs text-muted-foreground">Successfully processed batches</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedBatches.length}</div>
              <p className="text-xs text-muted-foreground">Quality failures</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Active Production Batches</h2>
            <p className="text-sm text-gray-600">
              Material Types: Frozen & Chilled Foods | {totalCCPs} Critical Control Points (CCPs) configured
            </p>
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
            <p className="text-gray-500 mb-4">Start processing by creating a new batch for Frozen or Chilled foods</p>
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
