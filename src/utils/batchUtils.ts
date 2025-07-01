
import { Batch, ProcessStep, ProcessStage } from "@/types/batch";

export const getStageColor = (stage: ProcessStage): string => {
  switch (stage) {
    case 'preprocessing':
      return 'border-l-orange-600 bg-orange-100';
    case 'processing':
      return 'border-l-yellow-600 bg-yellow-100';
    case 'packaging':
      return 'border-l-blue-600 bg-blue-100';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

export const getCurrentStage = (batch: Batch, processingSteps: ProcessStep[]): ProcessStage => {
  // If batch is completed, determine final stage based on last completed step
  if (batch.status === 'completed') {
    const lastCompletedStep = Math.max(...batch.checkpoints
      .filter(cp => cp.status === 'approved')
      .map(cp => cp.stepNumber)
    );
    
    const lastStepData = processingSteps.find(step => step.id === lastCompletedStep);
    return lastStepData?.stage || 'packaging'; // Default to packaging if completed
  }
  
  const currentStepData = processingSteps.find(step => step.id === batch.currentStep);
  return currentStepData?.stage || 'preprocessing';
};

export const createSampleBatch = (
  id: string,
  batchNumber: string,
  rawMaterial: string,
  rawMaterialType: 'frozen' | 'chilled' | 'seasonings' | 'packaging',
  quantity: number,
  unit: string,
  hoursAgo: number,
  currentStep: number,
  status: 'active' | 'completed' | 'rejected',
  processingSteps: ProcessStep[]
): Batch => {
  return {
    id,
    batchNumber,
    rawMaterial,
    rawMaterialType,
    quantity,
    unit,
    startTime: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    currentStep,
    status,
    checkpoints: processingSteps
      .filter(step => step.materialTypes.includes(rawMaterialType))
      .map(step => ({
        id: `${step.id}-${id}`,
        stepNumber: step.id,
        name: step.name,
        isCCP: step.isCCP,
        ccpNumber: step.ccpNumber,
        status: step.id < currentStep ? 'approved' : 
                step.id === currentStep ? 'in_progress' : 'pending' as const,
        metrics: step.metrics.map(metric => ({ ...metric, passed: undefined }))
      }))
  };
};
