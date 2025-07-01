
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
  { name: "Chicken Breast", code: "CHB" },
  { name: "Chicken Thigh", code: "CHT" },
  { name: "Chicken Wings", code: "CHW" },
  { name: "Chicken Drumstick", code: "CHD" },
  { name: "Whole Chicken", code: "WHC" },
  { name: "Mutton Pieces", code: "MUT" },
  { name: "Mutton Leg", code: "MUL" },
  { name: "Mutton Shoulder", code: "MUS" },
  { name: "Goat Meat", code: "GMT" },
  { name: "Fish Fillet", code: "FIF" },
  { name: "Fish Whole", code: "FIW" },
  { name: "Prawns Large", code: "PRL" },
  { name: "Prawns Medium", code: "PRM" },
  { name: "Beef Cuts", code: "BFC" },
  { name: "Beef Mince", code: "BFM" },
  { name: "Duck Breast", code: "DCB" },
  { name: "Turkey Breast", code: "TKB" }
];

const supplierCodes = [
  "SYR", "ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZA"
];

const monthCodes = {
  1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F",
  7: "G", 8: "H", 9: "I", 10: "J", 11: "K", 12: "L"
};

const CreateBatchDialog = ({ open, onOpenChange, onCreateBatch }: CreateBatchDialogProps) => {
  const [formData, setFormData] = useState({
    batchNumber: '',
    rawMaterial: '',
    quantity: '',
    unit: 'kg',
    supplierCode: ''
  });

  const generateBatchNumber = () => {
    const selectedMaterial = rawMaterials.find(rm => rm.name === formData.rawMaterial);
    if (!selectedMaterial) return '';
    
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthCodes[date.getMonth() + 1 as keyof typeof monthCodes];
    const year = date.getFullYear().toString().slice(-2);
    const supplier = formData.supplierCode || 'SYR';
    
    return `${selectedMaterial.code}${day}${month}${year}${supplier}`;
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
      unit: 'kg',
      supplierCode: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Start a new processing batch. Batch number format: [Material Code][Day][Month][Year][Supplier Code]
            <br />
            Example: CHB27F25SYR (Chicken Breast, 27th June 2025, Supplier SYR)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rawMaterial">Raw Material *</Label>
            <Select
              value={formData.rawMaterial}
              onValueChange={(value) => {
                setFormData(prev => ({...prev, rawMaterial: value}));
                // Auto-generate batch number when material changes
                if (value && !formData.batchNumber) {
                  setTimeout(() => {
                    setFormData(current => ({
                      ...current, 
                      batchNumber: generateBatchNumber()
                    }));
                  }, 100);
                }
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select raw material" />
              </SelectTrigger>
              <SelectContent>
                {rawMaterials.map(material => (
                  <SelectItem key={material.code} value={material.name}>
                    {material.name} ({material.code})
                  </SelectItem>
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
                  <SelectItem value="tons">tons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierCode">Supplier Code</Label>
            <Select
              value={formData.supplierCode}
              onValueChange={(value) => {
                setFormData(prev => ({...prev, supplierCode: value}));
                // Auto-regenerate batch number when supplier changes
                if (formData.rawMaterial) {
                  setTimeout(() => {
                    setFormData(current => ({
                      ...current, 
                      batchNumber: generateBatchNumber()
                    }));
                  }, 100);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier code" />
              </SelectTrigger>
              <SelectContent>
                {supplierCodes.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              placeholder="Auto-generated based on selections"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({...prev, batchNumber: e.target.value}))}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Format: Material Code + Day + Month + Year + Supplier Code
            </p>
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
