
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Batch } from "@/types/batch";

interface QCScannerInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: Batch[];
  onBatchSelect: (batch: Batch) => void;
}

const QCScannerInterface = ({ open, onOpenChange, batches, onBatchSelect }: QCScannerInterfaceProps) => {
  const [scannedBatch, setScannedBatch] = useState("");
  const [foundBatch, setFoundBatch] = useState<Batch | null>(null);

  const handleScan = () => {
    const batch = batches.find(b => b.batchNumber.toLowerCase() === scannedBatch.toLowerCase());
    setFoundBatch(batch || null);
  };

  const handleSelectBatch = () => {
    if (foundBatch) {
      onBatchSelect(foundBatch);
      onOpenChange(false);
      setScannedBatch("");
      setFoundBatch(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            QC Batch Scanner
          </DialogTitle>
          <DialogDescription>
            Scan or enter batch number to start quality inspection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanner Input */}
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <div className="flex gap-2">
              <Input
                id="batchNumber"
                placeholder="Enter or scan batch number (e.g., CHB27F25SYR)"
                value={scannedBatch}
                onChange={(e) => setScannedBatch(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleScan} variant="outline">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Result */}
          {scannedBatch && (
            <div className="space-y-4">
              {foundBatch ? (
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-mono">{foundBatch.batchNumber}</CardTitle>
                      <Badge variant="outline" className={getStatusColor(foundBatch.status)}>
                        {foundBatch.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {foundBatch.rawMaterial} - {foundBatch.quantity} {foundBatch.unit}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Material Type:</span>
                        <br />
                        <Badge variant="outline" className="mt-1">
                          {foundBatch.rawMaterialType.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Current Step:</span>
                        <br />
                        <span className="text-blue-600 font-mono">#{foundBatch.currentStep}</span>
                      </div>
                    </div>

                    {/* Process Status */}
                    <div className="space-y-2">
                      <span className="font-medium text-sm">Process Status:</span>
                      <div className="flex flex-wrap gap-1">
                        {foundBatch.checkpoints.slice(0, 6).map((checkpoint) => (
                          <div key={checkpoint.id} className="flex items-center gap-1">
                            {checkpoint.status === 'approved' && <CheckCircle className="h-3 w-3 text-green-600" />}
                            {checkpoint.status === 'in_progress' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                            {checkpoint.status === 'rejected' && <XCircle className="h-3 w-3 text-red-600" />}
                            {checkpoint.status === 'pending' && <div className="h-3 w-3 rounded-full bg-gray-300" />}
                            <span className="text-xs">#{checkpoint.stepNumber}</span>
                          </div>
                        ))}
                        {foundBatch.checkpoints.length > 6 && (
                          <span className="text-xs text-gray-500">+{foundBatch.checkpoints.length - 6} more</span>
                        )}
                      </div>
                    </div>

                    <Button onClick={handleSelectBatch} className="w-full bg-green-600 hover:bg-green-700">
                      Start Quality Inspection
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Batch not found</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Please check the batch number and try again.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Access to Recent Batches */}
          {!scannedBatch && (
            <div className="space-y-3">
              <Label>Recent Active Batches</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {batches.filter(b => b.status === 'active').slice(0, 5).map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setScannedBatch(batch.batchNumber);
                      setFoundBatch(batch);
                    }}
                  >
                    <div>
                      <span className="font-mono text-sm font-medium">{batch.batchNumber}</span>
                      <div className="text-xs text-gray-500">{batch.rawMaterial}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Step #{batch.currentStep}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QCScannerInterface;
