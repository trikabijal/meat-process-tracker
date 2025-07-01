
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Batch, Checkpoint } from "@/pages/Index";

interface BatchCardProps {
  batch: Batch;
  processingSteps: Array<{id: number; name: string; isCCP: boolean}>;
  onCheckpointClick: (checkpoint: Checkpoint) => void;
  readonly?: boolean;
}

const BatchCard = ({ batch, processingSteps, onCheckpointClick, readonly = false }: BatchCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'reprocess':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reprocess':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const approvedSteps = batch.checkpoints.filter(cp => cp.status === 'approved').length;
  const totalSteps = batch.checkpoints.length;
  const progress = (approvedSteps / totalSteps) * 100;

  const currentCheckpoint = batch.checkpoints.find(cp => cp.stepNumber === batch.currentStep && cp.status === 'pending');
  const pendingCCPs = batch.checkpoints.filter(cp => cp.isCCP && cp.status === 'pending');

  const timeElapsed = Math.floor((Date.now() - batch.startTime.getTime()) / (1000 * 60 * 60));

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{batch.batchNumber}</CardTitle>
            <CardDescription>{batch.rawMaterial} - {batch.quantity} {batch.unit}</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={
              batch.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              batch.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-red-100 text-red-800 border-red-200'
            }
          >
            {batch.status}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {approvedSteps}/{totalSteps} steps</span>
            <span>{timeElapsed}h elapsed</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {pendingCCPs.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800 font-medium">
              {pendingCCPs.length} Critical Control Point{pendingCCPs.length > 1 ? 's' : ''} pending
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {batch.checkpoints.slice(0, 6).map((checkpoint) => (
            <div key={checkpoint.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                {getStatusIcon(checkpoint.status)}
                <span className="text-sm font-medium">{checkpoint.name}</span>
                {checkpoint.isCCP && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    CCP
                  </Badge>
                )}
              </div>
              
              {!readonly && checkpoint.status === 'pending' && checkpoint.stepNumber <= batch.currentStep && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCheckpointClick(checkpoint)}
                  className="text-xs"
                >
                  Inspect
                </Button>
              )}
            </div>
          ))}
          
          {batch.checkpoints.length > 6 && (
            <div className="text-xs text-gray-500 text-center">
              +{batch.checkpoints.length - 6} more steps...
            </div>
          )}
        </div>

        {currentCheckpoint && !readonly && (
          <Button 
            onClick={() => onCheckpointClick(currentCheckpoint)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {currentCheckpoint.isCCP ? 'Process Critical Checkpoint' : 'Process Current Step'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchCard;
