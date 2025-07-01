
import { Batch, ProcessStep } from "@/types/batch";
import BatchCard from "./BatchCard";

interface BatchGridProps {
  batches: Batch[];
  processingSteps: ProcessStep[];
  onCheckpointClick: (batch: Batch, checkpoint: any) => void;
  readonly?: boolean;
  title?: string;
}

const BatchGrid = ({ batches, processingSteps, onCheckpointClick, readonly = false, title }: BatchGridProps) => {
  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map(batch => (
          <BatchCard 
            key={batch.id} 
            batch={batch} 
            processingSteps={processingSteps}
            onCheckpointClick={(checkpoint) => onCheckpointClick(batch, checkpoint)}
            readonly={readonly}
          />
        ))}
      </div>
    </div>
  );
};

export default BatchGrid;
