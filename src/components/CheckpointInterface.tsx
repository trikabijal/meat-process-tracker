
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw, AlertTriangle, Clock } from "lucide-react";
import { Batch, Checkpoint } from "@/pages/Index";

interface CheckpointInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch;
  checkpoint: Checkpoint;
  onAction: (batchId: string, checkpointId: string, action: 'approved' | 'rejected' | 'reprocess', notes?: string) => void;
}

const CheckpointInterface = ({ open, onOpenChange, batch, checkpoint, onAction }: CheckpointInterfaceProps) => {
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | 'reprocess' | null>(null);

  const handleAction = (action: 'approved' | 'rejected' | 'reprocess') => {
    onAction(batch.id, checkpoint.id, action, notes || undefined);
    setNotes('');
    setSelectedAction(null);
  };

  const getActionConfig = (action: 'approved' | 'rejected' | 'reprocess') => {
    switch (action) {
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Approve',
          color: 'bg-green-600 hover:bg-green-700',
          description: 'Continue to next step'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Reject',
          color: 'bg-red-600 hover:bg-red-700',
          description: 'Discard entire batch'
        };
      case 'reprocess':
        return {
          icon: RotateCcw,
          label: 'Reprocess',
          color: 'bg-orange-600 hover:bg-orange-700',
          description: 'Send back for rework'
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="flex items-center gap-2">
              {checkpoint.isCCP && <AlertTriangle className="h-5 w-5 text-red-600" />}
              Checkpoint Inspection
            </DialogTitle>
          </div>
          <DialogDescription>
            Batch {batch.batchNumber} - {batch.rawMaterial}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Checkpoint Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{checkpoint.name}</h3>
              <div className="flex gap-2">
                <Badge variant="outline">Step {checkpoint.stepNumber}</Badge>
                {checkpoint.isCCP && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Critical Control Point
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Quantity: {batch.quantity} {batch.unit}</p>
              <p>Started: {batch.startTime.toLocaleString()}</p>
            </div>
          </div>

          {checkpoint.isCCP && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Critical Control Point</span>
              </div>
              <p className="text-sm text-red-700">
                This is a critical checkpoint. Ensure all safety and quality parameters are met before approval.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Inspection Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any observations, measurements, or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Label>Inspection Result</Label>
            <div className="grid grid-cols-1 gap-3">
              {(['approved', 'reprocess', 'rejected'] as const).map((action) => {
                const config = getActionConfig(action);
                const Icon = config.icon;
                
                return (
                  <Button
                    key={action}
                    onClick={() => handleAction(action)}
                    className={`${config.color} h-auto p-4 justify-start`}
                    variant="default"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs opacity-90">{config.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckpointInterface;
