
import { Batch, ProcessStep, ProcessStage } from "@/types/batch";

export const getStageColor = (stage: ProcessStage): string => {
  switch (stage) {
    case 'preprocessing':
      return 'border-l-orange-500 bg-orange-50';
    case 'processing':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'packaging':
      return 'border-l-blue-500 bg-blue-50';
    default:
      return 'border-l-gray-500 bg-gray-50';
  }
};

export const getCurrentStage = (batch: Batch, processingSteps: ProcessStep[]): ProcessStage => {
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
