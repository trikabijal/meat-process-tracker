import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import BatchStatistics from "@/components/BatchStatistics";
import DashboardContent from "@/components/DashboardContent";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import CheckpointInterface from "@/components/CheckpointInterface";
import ProcessStepsManager from "@/components/ProcessStepsManager";
import QCScannerInterface from "@/components/QCScannerInterface";
import { Batch, Checkpoint, QualityMetric, ProcessStep } from "@/types/batch";
import { frozenChilledProcessSteps } from "@/data/processSteps";
import { createSampleBatch } from "@/utils/batchUtils";

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

  const totalCCPs = processingSteps.filter(step => step.isCCP).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          totalProcessingSteps={processingSteps.length}
          totalCCPs={totalCCPs}
          onShowQCScanner={() => setShowQCScanner(true)}
          onShowProcessManager={() => setShowProcessManager(true)}
          onShowCreateDialog={() => setShowCreateDialog(true)}
        />

        <BatchStatistics batches={batches} />

        <DashboardContent
          batches={batches}
          processingSteps={processingSteps}
          onCheckpointClick={handleBatchCardCheckpointClick}
          onShowCreateDialog={() => setShowCreateDialog(true)}
          totalCCPs={totalCCPs}
        />
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
