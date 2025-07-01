import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Batch } from "@/types/batch";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBatch: (batch: Omit<Batch, 'id' | 'checkpoints' | 'status' | 'currentStep'>) => void;
}

const rawMaterials = {
  frozen: [
    { name: "Frozen Chicken Breast", code: "CHB" },
    { name: "Frozen Chicken Thigh", code: "CHT" },
    { name: "Frozen Chicken Wings", code: "CHW" },
    { name: "Frozen Chicken Drumstick", code: "CHD" },
    { name: "Frozen Whole Chicken", code: "WHC" },
    { name: "Frozen Mutton Pieces", code: "MUT" },
    { name: "Frozen Mutton Leg", code: "MUL" },
    { name: "Frozen Beef Cuts", code: "BFC" },
    { name: "Frozen Fish Fillet", code: "FIF" },
    { name: "Frozen Prawns Large", code: "PRL" }
  ],
  chilled: [
    { name: "Chilled Chicken Breast", code: "CCB" },
    { name: "Chilled Chicken Thigh", code: "CCT" },
    { name: "Chilled Mutton Pieces", code: "CMT" },
    { name: "Chilled Beef Cuts", code: "CBC" },
    { name: "Chilled Fish Whole", code: "CFW" },
    { name: "Chilled Duck Breast", code: "CDB" }
  ],
  seasonings: [
    { name: "Salt", code: "SLT" },
    { name: "Black Pepper", code: "BPP" },
    { name: "Garlic Powder", code: "GAR" },
    { name: "Onion Powder", code: "ONP" },
    { name: "Paprika", code: "PAP" }
  ],
  packaging: [
    { name: "Vacuum Bags", code: "VBG" },
    { name: "Thermoform Trays", code: "TFT" },
    { name: "Labels", code: "LBL" },
    { name: "Cartons", code: "CTN" }
  ]
};

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
    rawMaterialType: 'frozen' as 'frozen' | 'chilled' | 'seasonings' | 'packaging',
    quantity: '',
    unit: 'kg',
    supplierCode: ''
  });

  const generateBatchNumber = () => {
    const materialsList = rawMaterials[formData.rawMaterialType];
    const selectedMaterial = materialsList.find(rm => rm.name === formData.rawMaterial);
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
    
    if (!formData.rawMaterial || !formData.quantity || !formData.rawMaterialType) {
      return;
    }

    const batchNumber = formData.batchNumber || generateBatchNumber();
    
    onCreateBatch({
      batchNumber,
      rawMaterial: formData.rawMaterial,
      rawMaterialType: formData.rawMaterialType,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      startTime: new Date()
    });

    // Reset form
    setFormData({
      batchNumber: '',
      rawMaterial: '',
      rawMaterialType: 'frozen',
      quantity: '',
      unit: 'kg',
      supplierCode: ''
    });
  };

  const availableMaterials = rawMaterials[formData.rawMaterialType] || [];
  const typeColors = {
    frozen: 'bg-blue-100 text-blue-800 border-blue-200',
    chilled: 'bg-green-100 text-green-800 border-green-200',
    seasonings: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    packaging: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Production Batch</DialogTitle>
          <DialogDescription>
            Start a new processing batch for Frozen/Chilled foods or other materials.
            <br />
            Batch format: [Material Code][Day][Month][Year][Supplier Code]
            <br />
            Example: CHB27F25SYR (Chicken Breast, 27th June 2025, Supplier SYR)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Raw Material Type Selection */}
          <Card className="border-2 border-dashed border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Material Type Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="materialType">Raw Material Type *</Label>
                <Select
                  value={formData.rawMaterialType}
                  onValueChange={(value: 'frozen' | 'chilled' | 'seasonings' | 'packaging') => {
                    setFormData(prev => ({
                      ...prev, 
                      rawMaterialType: value,
                      rawMaterial: '', // Reset material when type changes
                      batchNumber: '' // Reset batch number
                    }));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frozen">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={typeColors.frozen}>Frozen Foods</Badge>
                        <span>Primary focus - Complete process flow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="chilled">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={typeColors.chilled}>Chilled Foods</Badge>
                        <span>Primary focus - Complete process flow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="seasonings">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={typeColors.seasonings}>Seasonings & Condiments</Badge>
                        <span>Secondary material</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="packaging">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={typeColors.packaging}>Packaging Material</Badge>
                        <span>Secondary material</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Material Selection */}
          <div className="space-y-2">
            <Label htmlFor="rawMaterial">Specific Raw Material *</Label>
            <Select
              value={formData.rawMaterial}
              onValueChange={(value) => {
                setFormData(prev => ({...prev, rawMaterial: value, batchNumber: ''}));
                // Auto-generate batch number when material changes
                setTimeout(() => {
                  setFormData(current => ({
                    ...current, 
                    batchNumber: generateBatchNumber()
                  }));
                }, 100);
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${formData.rawMaterialType} material`} />
              </SelectTrigger>
              <SelectContent>
                {availableMaterials.map(material => (
                  <SelectItem key={material.code} value={material.name}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{material.code}</Badge>
                      <span>{material.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity and Unit */}
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
                  <SelectItem value="liters">liters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Supplier Code */}
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

          {/* Generated Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Generated Batch Number</Label>
            <Input
              id="batchNumber"
              placeholder="Auto-generated based on selections"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({...prev, batchNumber: e.target.value}))}
              className="font-mono text-lg"
            />
            <p className="text-xs text-gray-500">
              Format: [Material Code] + [Day] + [Month Code] + [Year] + [Supplier Code]
            </p>
          </div>

          {/* Process Information */}
          {(formData.rawMaterialType === 'frozen' || formData.rawMaterialType === 'chilled') && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={typeColors[formData.rawMaterialType]}>
                    {formData.rawMaterialType.toUpperCase()}
                  </Badge>
                  <span className="font-medium">Complete HACCP Process Flow</span>
                </div>
                <p className="text-sm text-blue-700">
                  This batch will go through the full {formData.rawMaterialType} food processing workflow 
                  with 5 Critical Control Points (CCPs) and comprehensive quality inspections.
                </p>
              </CardContent>
            </Card>
          )}

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
