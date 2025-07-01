
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, RotateCcw, AlertTriangle, Clock, Thermometer, Scale, Eye, Droplets, Percent, HelpCircle, Timer, Gauge } from "lucide-react";
import { Batch, Checkpoint, ProcessStep, QualityMetric } from "@/pages/Index";

interface CheckpointInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch;
  checkpoint: Checkpoint;
  processStep?: ProcessStep;
  onAction: (batchId: string, checkpointId: string, action: 'approved' | 'rejected' | 'reprocess', notes?: string, metrics?: QualityMetric[]) => void;
}

const CheckpointInterface = ({ open, onOpenChange, batch, checkpoint, processStep, onAction }: CheckpointInterfaceProps) => {
  const [notes, setNotes] = useState('');
  const [metrics, setMetrics] = useState<QualityMetric[]>(checkpoint.metrics || []);
  const [inspector, setInspector] = useState('');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'weight': return <Scale className="h-4 w-4" />;
      case 'visual': return <Eye className="h-4 w-4" />;
      case 'moisture': return <Droplets className="h-4 w-4" />;
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'time': return <Timer className="h-4 w-4" />;
      case 'pressure': return <Gauge className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const updateMetric = (metricId: string, value: string | number, passed?: boolean) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === metricId 
        ? { ...metric, value, passed }
        : metric
    ));
  };

  const validateMetric = (metric: QualityMetric): boolean => {
    if (!metric.value && metric.required) return false;
    
    if (typeof metric.value === 'number' && metric.minValue !== undefined && metric.maxValue !== undefined) {
      return metric.value >= metric.minValue && metric.value <= metric.maxValue;
    }
    
    if (typeof metric.value === 'number' && metric.maxValue !== undefined && metric.minValue === undefined) {
      return metric.value <= metric.maxValue;
    }
    
    if (typeof metric.value === 'number' && metric.minValue !== undefined && metric.maxValue === undefined) {
      return metric.value >= metric.minValue;
    }
    
    return true;
  };

  const allRequiredMetricsPassed = () => {
    return metrics.every(metric => !metric.required || (metric.value && validateMetric(metric)));
  };

  const handleAction = (action: 'approved' | 'rejected' | 'reprocess') => {
    if (action === 'approved' && !allRequiredMetricsPassed()) {
      return; // Prevent approval if required metrics are not filled
    }
    
    const updatedMetrics = metrics.map(metric => ({
      ...metric,
      passed: validateMetric(metric)
    }));
    
    onAction(batch.id, checkpoint.id, action, notes || undefined, updatedMetrics);
    setNotes('');
    setInspector('');
  };

  const getActionConfig = (action: 'approved' | 'rejected' | 'reprocess') => {
    switch (action) {
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Approve & Continue',
          color: 'bg-green-600 hover:bg-green-700',
          description: 'All checks passed - proceed to next step'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Reject Batch',
          color: 'bg-red-600 hover:bg-red-700',
          description: 'Critical failure - discard entire batch'
        };
      case 'reprocess':
        return {
          icon: RotateCcw,
          label: 'Send for Reprocessing',
          color: 'bg-orange-600 hover:bg-orange-700',
          description: 'Issues found - send back for rework'
        };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">Step #{checkpoint.stepNumber}</Badge>
            {checkpoint.isCCP && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">
                {checkpoint.ccpNumber}
              </Badge>
            )}
            <Badge variant="outline" className={
              batch.rawMaterialType === 'frozen' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              batch.rawMaterialType === 'chilled' ? 'bg-green-100 text-green-800 border-green-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            }>
              {batch.rawMaterialType.toUpperCase()}
            </Badge>
            <DialogTitle className="flex items-center gap-2">
              {checkpoint.isCCP && <AlertTriangle className="h-5 w-5 text-red-600" />}
              Quality Inspection Interface
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            <div className="font-mono font-semibold text-lg text-blue-600">{checkpoint.name}</div>
            <div className="mt-1">Batch {batch.batchNumber} - {batch.rawMaterial} ({batch.quantity} {batch.unit})</div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Process Info */}
          <Card className="bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Process Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Step:</span> {checkpoint.stepNumber} 
              </div>
              <div>
                <span className="font-medium">Est. Time:</span> {processStep?.estimatedTime || 15} minutes
              </div>
              <div className="col-span-2">
                <span className="font-medium">Description:</span> {processStep?.description || 'No description available'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Material Types:</span> {processStep?.materialTypes?.join(', ') || 'All types'}
              </div>
            </CardContent>
          </Card>

          {/* CCP Warning */}
          {checkpoint.isCCP && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Critical Control Point ({checkpoint.ccpNumber})</span>
                </div>
                <p className="text-sm text-red-700">
                  This is a critical checkpoint in the HACCP system. All quality parameters must be verified and within acceptable limits before approval. 
                  Documentation is mandatory for compliance.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics & Measurements ({metrics.filter(m => m.required).length} Required)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.type)}
                      <span className="font-medium">{metric.name}</span>
                      {metric.required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
                      {metric.helpText && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowHelp(showHelp === metric.id ? null : metric.id)}
                        >
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                    {metric.unit && (
                      <Badge variant="secondary" className="text-xs">{metric.unit}</Badge>
                    )}
                  </div>

                  {/* Help Text */}
                  {showHelp === metric.id && metric.helpText && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                      <div className="font-medium mb-1">📱 Mobile Guidance:</div>
                      {metric.helpText}
                    </div>
                  )}

                  {metric.type === 'visual' ? (
                    <Select 
                      value={metric.value as string} 
                      onValueChange={(value) => updateMetric(metric.id, value, value === 'pass')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select inspection result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">✅ Pass - Acceptable</SelectItem>
                        <SelectItem value="fail">❌ Fail - Unacceptable</SelectItem>
                        <SelectItem value="marginal">⚠️ Marginal - Review needed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder={`Enter ${metric.name.toLowerCase()}`}
                        value={metric.value || ''}
                        onChange={(e) => {
                          const numValue = parseFloat(e.target.value);
                          updateMetric(metric.id, numValue, validateMetric({...metric, value: numValue}));
                        }}
                        className={
                          metric.value && !validateMetric(metric) 
                            ? 'border-red-500 bg-red-50' 
                            : metric.value && validateMetric(metric)
                            ? 'border-green-500 bg-green-50'
                            : ''
                        }
                      />
                      {(metric.minValue !== undefined || metric.maxValue !== undefined) && (
                        <p className="text-xs text-gray-600">
                          🎯 Target: {metric.minValue ?? 'No min'} - {metric.maxValue ?? 'No max'} {metric.unit}
                        </p>
                      )}
                    </div>
                  )}

                  {metric.value && !validateMetric(metric) && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      ⚠️ Value outside acceptable range - requires attention
                    </p>
                  )}
                  
                  {metric.value && validateMetric(metric) && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      ✅ Within acceptable range
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Inspector & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspector">Inspector Name *</Label>
              <Input
                id="inspector"
                placeholder="Enter your name"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes & Observations</Label>
              <Textarea
                id="notes"
                placeholder="Any observations, deviations, or corrective actions taken..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">📱 Inspector Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['approved', 'reprocess', 'rejected'] as const).map((action) => {
                const config = getActionConfig(action);
                const Icon = config.icon;
                const isDisabled = action === 'approved' && !allRequiredMetricsPassed();
                
                return (
                  <Button
                    key={action}
                    onClick={() => handleAction(action)}
                    disabled={isDisabled}
                    className={`${config.color} h-auto p-4 justify-start w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              
              {!allRequiredMetricsPassed() && (
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  📱 Please complete all required metrics before approving this checkpoint.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel Inspection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckpointInterface;
