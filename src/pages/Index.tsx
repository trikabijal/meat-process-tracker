
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Factory, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BatchCard from "@/components/BatchCard";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import CheckpointInterface from "@/components/CheckpointInterface";

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
}

const processingSteps = [
  { id: 1, name: "Raw Material Reception", isCCP: false },
  { id: 2, name: "Initial Inspection", isCCP: true },
  { id: 3, name: "Cleaning & Washing", isCCP: false },
  { id: 4, name: "Temperature Check", isCCP: true },
  { id: 5, name: "Processing", isCCP: true },
  { id: 6, name: "Quality Control", isCCP: true },
  { id: 7, name: "Packaging", isCCP: false },
  { id: 8, name: "Final Inspection", isCCP: true },
  { id: 9, name: "Cold Storage", isCCP: true },
  { id: 10, name: "Dispatch", isCCP: false }
];

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<{batch: Batch, checkpoint: Checkpoint} | null>(null);
  const { toast } = useToast();

  // Initialize with sample data
  useEffect(() => {
    const sampleBatches: Batch[] = [
      {
        id: "batch-001",
        batchNumber: "CHK-2025-001",
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
        batchNumber: "MUT-2025-002",
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
        status: step.id === 1 ? 'pending' : 'pending'
      }))
    };
    
    setBatches(prev => [...prev, newBatch]);
    setShowCreateDialog(false);
    toast({
      title: "Batch Created",
      description: `Batch ${newBatch.batchNumber} has been started successfully.`,
    });
  };

  const handleCheckpointAction = (batchId: string, checkpointId: string, action: 'approved' | 'rejected' | 'reprocess', notes?: string) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === batchId) {
        const updatedCheckpoints = batch.checkpoints.map(checkpoint => {
          if (checkpoint.id === checkpointId) {
            return {
              ...checkpoint,
              status: action,
              inspector: "Current User",
              timestamp: new Date(),
              notes
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
      description: `Checkpoint ${action} successfully.`,
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
          <div className="flex items-center gap-3 mb-2">
            <Factory className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Non-Veg Processing Factory</h1>
          </div>
          <p className="text-gray-600">Real-time batch monitoring and quality control system</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Active Batches</h2>
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

      {selectedCheckpoint && (
        <CheckpointInterface
          open={!!selectedCheckpoint}
          onOpenChange={() => setSelectedCheckpoint(null)}
          batch={selectedCheckpoint.batch}
          checkpoint={selectedCheckpoint.checkpoint}
          onAction={handleCheckpointAction}
        />
      )}
    </div>
  );
};

export default Index;
