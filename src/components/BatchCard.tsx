import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Thermometer, Scale, Eye } from "lucide-react";
import { Batch, Checkpoint, ProcessStep } from "@/types/batch";
import { getCurrentStage, getStageColor } from "@/utils/batchUtils";

interface BatchCardProps {
  batch: Batch;
  processingSteps: ProcessStep[];
  onCheckpointClick: (checkpoint: Checkpoint) => void;
  readonly?: boolean;
}

const BatchCard = ({ batch, processingSteps, onCheckpointClick, readonly = false }: BatchCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-white" />;
      case 'reprocess':
        return <RotateCcw className="h-4 w-4 text-white" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'reprocess':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const approvedSteps = batch.checkpoints.filter(cp => cp.status === 'approved').length;
  const totalSteps = batch.checkpoints.length;
  const progress = (approvedSteps / totalSteps) * 100;

  const currentCheckpoint = batch.checkpoints.find(cp => cp.stepNumber === batch.currentStep && cp.status === 'pending');
  const pendingCCPs = batch.checkpoints.filter(cp => cp.isCCP && cp.status === 'pending');
  const inProgressSteps = batch.checkpoints.filter(cp => cp.status === 'in_progress');

  const timeElapsed = Math.floor((Date.now() - batch.startTime.getTime()) / (1000 * 60 * 60));
  const currentStepInfo = processingSteps.find(step => step.id === batch.currentStep);
  
  // Calculate estimated completion time
  const remainingSteps = processingSteps.filter(step => step.id >= batch.currentStep);
  const estimatedMinutesRemaining = remainingSteps.reduce((acc, step) => acc + (step.estimatedTime || 15), 0);

  // Get current stage and apply color - fix for completed batches
  const currentStage = getCurrentStage(batch, processingSteps);
  let stageColor = getStageColor(currentStage);
  
  // Override color for completed batches to show green
  if (batch.status === 'completed') {
    stageColor = 'border-l-green-600 bg-green-100';
  }

  // Stage display names
  const stageNames = {
    'preprocessing': 'Pre-Processing (Orange Trays)',
    'processing': 'Processing (Yellow Trays)', 
    'packaging': 'Packaging & Dispatch (Blue Trays)'
  };

  return (
    <Card className={`h-full border-l-4 ${stageColor}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-mono">{batch.batchNumber}</CardTitle>
            <CardDescription className="font-medium">{batch.rawMaterial} - {batch.quantity} {batch.unit}</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={
              batch.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              batch.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-red-100 text-red-800 border-red-200'
            }
          >
            {batch.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Stage Indicator */}
          <div className="bg-white p-2 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Stage:</span>
              <Badge variant="outline" className="text-xs">
                {batch.status === 'completed' ? 'Completed & Dispatched' : stageNames[currentStage]}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Current Step:</span> #{batch.currentStep}
            </div>
            <div>
              <span className="font-medium">Time Elapsed:</span> {timeElapsed}h
            </div>
            <div>
              <span className="font-medium">Progress:</span> {approvedSteps}/{totalSteps} steps
            </div>
            <div>
              <span className="font-medium">Est. Remaining:</span> ~{Math.ceil(estimatedMinutesRemaining / 60)}h
            </div>
          </div>
          
          <Progress value={progress} className="w-full h-2" />
          
          {currentStepInfo && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-blue-900">Current: {currentStepInfo.name}</span>
                <Badge variant="outline" className="text-xs">
                  ~{currentStepInfo.estimatedTime || 15}min
                </Badge>
              </div>
              {currentStepInfo.isCCP && (
                <div className="flex items-center gap-1 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Critical Control Point
                </div>
              )}
            </div>
          )}

          {/* Parallel Processing Indicator */}
          {inProgressSteps.length > 1 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                {inProgressSteps.length} processes running in parallel
              </span>
            </div>
          )}

          {pendingCCPs.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                {pendingCCPs.length} Critical Control Point{pendingCCPs.length > 1 ? 's' : ''} pending
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {batch.checkpoints.slice(0, 8).map((checkpoint) => {
            const stepInfo = processingSteps.find(step => step.id === checkpoint.stepNumber);
            return (
              <div key={checkpoint.id} className={`flex items-center justify-between p-2 rounded-lg border ${getStatusColor(checkpoint.status)}`}>
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="outline" className="text-xs font-mono min-w-[24px] bg-white text-gray-900 border-gray-300">
                    #{checkpoint.stepNumber}
                  </Badge>
                  {getStatusIcon(checkpoint.status)}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{checkpoint.name}</span>
                    {checkpoint.inspector && checkpoint.timestamp && (
                      <span className="text-xs opacity-75">
                        {checkpoint.inspector} - {checkpoint.timestamp.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    {checkpoint.isCCP && (
                      <Badge variant="outline" className="text-xs bg-white text-red-700 border-red-300">
                        CCP
                      </Badge>
                    )}
                    {stepInfo?.estimatedTime && (
                      <Badge variant="outline" className="text-xs bg-white text-gray-600 border-gray-300">
                        {stepInfo.estimatedTime}m
                      </Badge>
                    )}
                  </div>
                </div>
                
                {!readonly && (checkpoint.status === 'pending' || checkpoint.status === 'in_progress') && checkpoint.stepNumber <= batch.currentStep && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onCheckpointClick(checkpoint)}
                    className="text-xs ml-2"
                  >
                    Inspect
                  </Button>
                )}
              </div>
            );
          })}
          
          {batch.checkpoints.length > 8 && (
            <div className="text-xs text-gray-500 text-center">
              +{batch.checkpoints.length - 8} more steps...
            </div>
          )}
        </div>

        {currentCheckpoint && !readonly && (
          <Button 
            onClick={() => onCheckpointClick(currentCheckpoint)}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
          >
            <div className="text-center">
              <div className="font-medium">
                {currentCheckpoint.isCCP ? 'Process Critical Checkpoint' : 'Process Current Step'}
              </div>
              <div className="text-xs opacity-90">
                Step #{currentCheckpoint.stepNumber}: {currentCheckpoint.name}
              </div>
            </div>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchCard;
