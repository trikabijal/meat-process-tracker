
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Batch } from "@/pages/Index";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBatch: (batch: Omit<Batch, 'id' | 'checkpoints' | 'status' | 'currentStep'>) => void;
}

const rawMaterials = [
  "Chicken Breast",
  "Chicken Thigh",
  "Chicken Wings",
  "Mutton Pieces",
  "Goat Meat",
  "Fish Fillet",
  "Prawns",
  "Beef Cuts"
];

const CreateBatchDialog = ({ open, onOpenChange, onCreateBatch }: CreateBatchDialogProps) => {
  const [formData, setFormData] = useState({
    batchNumber: '',
    rawMaterial: '',
    quantity: '',
    unit: 'kg'
  });

  const generateBatchNumber = () => {
    const prefix = formData.rawMaterial.substring(0, 3).toUpperCase();
    const date = new Date();
    const year = date.getFullYear();
    const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}-${sequence}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rawMaterial || !formData.quantity) {
      return;
    }

    const batchNumber = formData.batchNumber || generateBatchNumber();
    
    onCreateBatch({
      batchNumber,
      rawMaterial: formData.rawMaterial,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      startTime: new Date()
    });

    // Reset form
    setFormData({
      batchNumber: '',
      rawMaterial: '',
      quantity: '',
      unit: 'kg'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Start a new processing batch. A unique batch number will be generated if not provided.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
            <Input
              id="batchNumber"
              placeholder="Auto-generated if empty"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({...prev, batchNumber: e.target.value}))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rawMaterial">Raw Material *</Label>
            <Select
              value={formData.rawMaterial}
              onValueChange={(value) => setFormData(prev => ({...prev, rawMaterial: value}))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select raw material" />
              </SelectTrigger>
              <SelectContent>
                {rawMaterials.map(material => (
                  <SelectItem key={material} value={material}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: e.target.value}))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({...prev, unit: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pieces">pieces</SelectItem>
                  <SelectItem value="boxes">boxes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBatchDialog;
