import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Factory, AlertTriangle, CheckCircle, Clock, XCircle, Settings, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BatchCard from "@/components/BatchCard";
import BatchStatsCard from "@/components/BatchStatsCard";
import BatchGrid from "@/components/BatchGrid";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import CheckpointInterface from "@/components/CheckpointInterface";
import ProcessStepsManager from "@/components/ProcessStepsManager";
import QCScannerInterface from "@/components/QCScannerInterface";
import { Batch, Checkpoint, QualityMetric, ProcessStep } from "@/types/batch";
import { frozenChilledProcessSteps } from "@/data/processSteps";
import { createSampleBatch, getCurrentStage, getStageColor } from "@/utils/batchUtils";

const Index = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProcessManager, setShowProcessManager] = useState(false);
  const [showQCScanner, setShowQCScanner] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<{batch: Batch, checkpoint: Checkpoint} | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessStep[]>(frozenChilledProcessSteps);
  const { toast } = useToast();

  // Initialize with sample data including a dispatch-stage batch
  useEffect(() => {
    const sampleBatches: Batch[] = [
      createSampleBatch(
        "batch-001",
        "CHB27F25SYR",
        "Chicken Breast",
        'chilled',
        500,
        "kg",
        2,
        1,
        'active',
        processingSteps
      ),
      createSampleBatch(
        "batch-002",
        "MUT15F25ABC",
        "Mutton Pieces",
        'frozen',
        250,
        "kg",
        4,
        7,
        'active',
        processingSteps
      ),
      createSampleBatch(
        "batch-003",
        "CHW20F25DEF",
        "Chicken Wings",
        'chilled',
        300,
        "kg",
        8,
        12,
        'active',
        processingSteps
      ),
      createSampleBatch(
        "batch-004",
        "BFC18F25GHI",
        "Beef Cuts",
        'frozen',
        180,
        "kg",
        12,
        13,
        'completed',
        processingSteps
      )
    ];

    // Add parallel processing for some batches
    sampleBatches[1].parallelProcesses = [6, 7]; // Processing and cooking can happen in parallel
    sampleBatches[2].parallelProcesses = [10, 11]; // Sterilization and blast freezing

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

  const handleQCBatchSelect = (batch: Batch) => {
    console.log('QC Batch Selected:', batch.batchNumber);
    console.log('Current Step:', batch.currentStep);
    console.log('All Checkpoints:', batch.checkpoints.map(cp => ({ step: cp.stepNumber, status: cp.status })));
    
    // Find the current pending checkpoint
    const currentCheckpoint = batch.checkpoints.find(cp => 
      cp.stepNumber === batch.currentStep && cp.status === 'pending'
    );
    
    console.log('Found Current Checkpoint:', currentCheckpoint);
    
    if (currentCheckpoint) {
      setSelectedCheckpoint({ batch, checkpoint: currentCheckpoint });
      console.log('Opening checkpoint interface for:', currentCheckpoint.name);
    } else {
      // If no exact match, find the next pending checkpoint
      const nextPendingCheckpoint = batch.checkpoints.find(cp => cp.status === 'pending');
      console.log('No current checkpoint found, trying next pending:', nextPendingCheckpoint);
      
      if (nextPendingCheckpoint) {
        setSelectedCheckpoint({ batch, checkpoint: nextPendingCheckpoint });
        console.log('Opening next pending checkpoint:', nextPendingCheckpoint.name);
      } else {
        toast({
          title: "No Inspection Needed",
          description: "This batch has no pending checkpoints for inspection.",
          variant: "destructive"
        });
      }
    }
  };

  const handleBatchCardCheckpointClick = (batch: Batch, checkpoint: Checkpoint) => {
    console.log('Dashboard Card Checkpoint Clicked:', checkpoint.name);
    console.log('Checkpoint Status:', checkpoint.status);
    console.log('Batch:', batch.batchNumber);
    
    setSelectedCheckpoint({ batch, checkpoint });
  };

  // Calculate statistics
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
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/a1b4fd1c-52e2-4679-9f19-853535b5ead5.png" 
                alt="Chatha Foods Limited" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chatha Foods Limited</h1>
                <p className="text-gray-600">Real-time batch monitoring and quality control system</p>
                <p className="text-sm text-gray-500">Process Steps: {processingSteps.length} | Critical Control Points (CCPs): {totalCCPs}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowQCScanner(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Scan className="h-4 w-4" />
                QC Scanner
              </Button>
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <BatchStatsCard
            title="Active Batches"
            value={activeBatches.length}
            description={`Frozen: ${activeBatches.filter(b => b.rawMaterialType === 'frozen').length} | Chilled: ${activeBatches.filter(b => b.rawMaterialType === 'chilled').length}`}
            icon={Clock}
            color="text-blue-600"
          />
          <BatchStatsCard
            title="Pending CCPs"
            value={pendingCCPs}
            description="Critical checkpoints requiring attention"
            icon={AlertTriangle}
            color="text-orange-600"
          />
          <BatchStatsCard
            title="Completed"
            value={completedBatches.length}
            description="Successfully processed batches"
            icon={CheckCircle}
            color="text-green-600"
          />
          <BatchStatsCard
            title="Rejected"
            value={rejectedBatches.length}
            description="Quality failures"
            icon={XCircle}
            color="text-red-600"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Active Production Batches</h2>
            <p className="text-sm text-gray-600">
              Material Types: Frozen & Chilled Foods | {totalCCPs} Critical Control Points (CCPs) configured
            </p>
            <p className="text-xs text-gray-500 mt-1">
              🟠 Orange: Preprocessing Stage | 🟡 Yellow: Processing Stage | 🔵 Blue: Packaging & Dispatch Stage
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>

        {/* Active Batches Grid */}
        <BatchGrid
          batches={activeBatches}
          processingSteps={processingSteps}
          onCheckpointClick={handleBatchCardCheckpointClick}
        />

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
        <div className="mt-12 space-y-8">
          <BatchGrid
            batches={completedBatches}
            processingSteps={processingSteps}
            onCheckpointClick={() => {}}
            readonly={true}
            title="Completed Batches"
          />
          <BatchGrid
            batches={rejectedBatches}
            processingSteps={processingSteps}
            onCheckpointClick={() => {}}
            readonly={true}
            title="Rejected Batches"
          />
        </div>
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

      <QCScannerInterface
        open={showQCScanner}
        onOpenChange={setShowQCScanner}
        batches={batches}
        onBatchSelect={handleQCBatchSelect}
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
