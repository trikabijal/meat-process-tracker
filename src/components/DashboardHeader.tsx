
import { Button } from "@/components/ui/button";
import { Plus, Settings, Scan } from "lucide-react";

interface DashboardHeaderProps {
  totalProcessingSteps: number;
  totalCCPs: number;
  onShowQCScanner: () => void;
  onShowProcessManager: () => void;
  onShowCreateDialog: () => void;
}

const DashboardHeader = ({
  totalProcessingSteps,
  totalCCPs,
  onShowQCScanner,
  onShowProcessManager,
  onShowCreateDialog
}: DashboardHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/a1b4fd1c-52e2-4679-9f19-853535b5ead5.png" 
            alt="Chatha Foods Limited" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chatha Foods Limited</h1>
            <p className="text-gray-600">Real-time batch monitoring and quality control system</p>
            <p className="text-sm text-gray-500">Process Steps: {totalProcessingSteps} | Critical Control Points (CCPs): {totalCCPs}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onShowQCScanner} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Scan className="h-4 w-4" />
            QC Scanner
          </Button>
          <Button 
            onClick={onShowProcessManager} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage Process Steps
          </Button>
          <Button onClick={onShowCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
