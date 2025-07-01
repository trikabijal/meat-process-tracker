import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, AlertTriangle, Clock } from "lucide-react";
import { ProcessStep, QualityMetric } from "@/types/batch";

interface ProcessStepsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processingSteps: ProcessStep[];
  onUpdateSteps: (steps: ProcessStep[]) => void;
}

const ProcessStepsManager = ({ open, onOpenChange, processingSteps, onUpdateSteps }: ProcessStepsManagerProps) => {
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const defaultStep: Partial<ProcessStep> = {
    name: '',
    isCCP: false,
    estimatedTime: 15,
    description: '',
    metrics: []
  };

  const handleSaveStep = (step: ProcessStep) => {
    if (isCreating) {
      const newId = Math.max(...processingSteps.map(s => s.id), 0) + 1;
      const newStep = { ...step, id: newId };
      onUpdateSteps([...processingSteps, newStep]);
    } else {
      onUpdateSteps(processingSteps.map(s => s.id === step.id ? step : s));
    }
    setEditingStep(null);
    setIsCreating(false);
  };

  const handleDeleteStep = (stepId: number) => {
    onUpdateSteps(processingSteps.filter(s => s.id !== stepId));
  };

  const handleCreateNew = () => {
    setEditingStep({ ...defaultStep, id: 0 } as ProcessStep);
    setIsCreating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Process Steps</DialogTitle>
          <DialogDescription>
            Configure processing steps, add new ones, or modify existing ones. Critical Control Points (CCPs) are highlighted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Process Steps ({processingSteps.length})</h3>
            <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Step
            </Button>
          </div>

          <div className="grid gap-4">
            {processingSteps.map((step, index) => (
              <Card key={step.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">#{step.id}</Badge>
                      <CardTitle className="text-lg">{step.name}</CardTitle>
                      {step.isCCP && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          CCP
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.estimatedTime}min
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingStep(step)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.metrics.map(metric => (
                      <Badge key={metric.id} variant="secondary" className="text-xs">
                        {metric.name} {metric.unit && `(${metric.unit})`}
                        {metric.required && <span className="text-red-600 ml-1">*</span>}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {editingStep && (
          <StepEditor
            step={editingStep}
            isCreating={isCreating}
            onSave={handleSaveStep}
            onCancel={() => {
              setEditingStep(null);
              setIsCreating(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const StepEditor = ({ 
  step, 
  isCreating, 
  onSave, 
  onCancel 
}: { 
  step: ProcessStep; 
  isCreating: boolean; 
  onSave: (step: ProcessStep) => void; 
  onCancel: () => void; 
}) => {
  const [formData, setFormData] = useState(step);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle>{isCreating ? 'Create New Step' : 'Edit Step'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stepName">Step Name *</Label>
            <Input
              id="stepName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Initial Inspection"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Time (minutes) *</Label>
            <Input
              id="estimatedTime"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
              min="1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what happens in this step..."
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isCCP"
            checked={formData.isCCP}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCCP: checked }))}
          />
          <Label htmlFor="isCCP" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Critical Control Point (CCP)
          </Label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {isCreating ? 'Create Step' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessStepsManager;
