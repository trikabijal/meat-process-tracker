
import { Factory, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import BatchGrid from "./BatchGrid";
import { Batch, ProcessStep, Checkpoint } from "@/types/batch";

interface DashboardContentProps {
  batches: Batch[];
  processingSteps: ProcessStep[];
  onCheckpointClick: (batch: Batch, checkpoint: Checkpoint) => void;
  onShowCreateDialog: () => void;
  totalCCPs: number;
}

const DashboardContent = ({
  batches,
  processingSteps,
  onCheckpointClick,
  onShowCreateDialog,
  totalCCPs
}: DashboardContentProps) => {
  const activeBatches = batches.filter(batch => batch.status === 'active');
  const completedBatches = batches.filter(batch => batch.status === 'completed');
  const rejectedBatches = batches.filter(batch => batch.status === 'rejected');

  return (
    <>
      {/* Actions and Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active Production Batches</h2>
          <p className="text-sm text-gray-600">
            Material Types: Frozen & Chilled Foods | {totalCCPs} Critical Control Points (CCPs) configured
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🟠 Orange: Preprocessing Stage | 🟡 Yellow: Processing Stage | 🔵 Blue: Packaging & Dispatch Stage
          </p>
        </div>
      </div>

      {/* Active Batches Grid */}
      <BatchGrid
        batches={activeBatches}
        processingSteps={processingSteps}
        onCheckpointClick={onCheckpointClick}
      />

      {activeBatches.length === 0 && (
        <div className="text-center py-12">
          <Factory className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Batches</h3>
          <p className="text-gray-500 mb-4">Start processing by creating a new batch for Frozen or Chilled foods</p>
          <Button onClick={onShowCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create First Batch
          </Button>
        </div>
      )}

      {/* Completed and Rejected Sections */}
      <div className="mt-12 space-y-8">
        <BatchGrid
          batches={completedBatches}
          processingSteps={processingSteps}
          onCheckpointClick={() => {}}
          readonly={true}
          title="Completed Batches"
        />
        <BatchGrid
          batches={rejectedBatches}
          processingSteps={processingSteps}
          onCheckpointClick={() => {}}
          readonly={true}
          title="Rejected Batches"
        />
      </div>
    </>
  );
};

export default DashboardContent;
