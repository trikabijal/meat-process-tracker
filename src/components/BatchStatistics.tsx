
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import BatchStatsCard from "./BatchStatsCard";
import { Batch } from "@/types/batch";

interface BatchStatisticsProps {
  batches: Batch[];
}

const BatchStatistics = ({ batches }: BatchStatisticsProps) => {
  const activeBatches = batches.filter(batch => batch.status === 'active');
  const completedBatches = batches.filter(batch => batch.status === 'completed');
  const rejectedBatches = batches.filter(batch => batch.status === 'rejected');
  
  const pendingCCPs = batches.reduce((acc, batch) => {
    const pendingCCPCount = batch.checkpoints.filter(cp => cp.isCCP && cp.status === 'pending').length;
    return acc + pendingCCPCount;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <BatchStatsCard
        title="Active Batches"
        value={activeBatches.length}
        description={`Frozen: ${activeBatches.filter(b => b.rawMaterialType === 'frozen').length} | Chilled: ${activeBatches.filter(b => b.rawMaterialType === 'chilled').length}`}
        icon={Clock}
        color="text-blue-600"
      />
      <BatchStatsCard
        title="Pending CCPs"
        value={pendingCCPs}
        description="Critical checkpoints requiring attention"
        icon={AlertTriangle}
        color="text-orange-600"
      />
      <BatchStatsCard
        title="Completed"
        value={completedBatches.length}
        description="Successfully processed batches"
        icon={CheckCircle}
        color="text-green-600"
      />
      <BatchStatsCard
        title="Rejected"
        value={rejectedBatches.length}
        description="Quality failures"
        icon={XCircle}
        color="text-red-600"
      />
    </div>
  );
};

export default BatchStatistics;
