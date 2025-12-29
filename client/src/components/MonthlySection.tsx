import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FileUploadCard from "@/components/FileUploadCard";
import MIDTable from "@/components/MIDTable";
import { Lock, DollarSign, Users, AlertTriangle } from "lucide-react";

interface MonthlySectionProps {
  month: string;
  title?: string;
  isActive?: boolean;
  processors: any[];
  data?: any[];
  issues?: any[];
}

export default function MonthlySection({ month, title, isActive = true, processors, data, issues }: MonthlySectionProps) {
  // Generate title if not provided
  const displayTitle = title || `${month} Data Processing`;
  
  // Use traditional props style if data prop is provided
  if (data !== undefined) {
    return (
      <Card className="bg-zinc-900/80 border-yellow-400/20">
        <CardHeader className="bg-yellow-400 text-black rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{displayTitle}</h2>
              <p className="text-black/70 mt-1">Monthly data summary and processing</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{data?.length || 0}</div>
              <div className="text-black/70">Records Processed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <p className="text-gray-400">Monthly data processing complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { data: fileUploads } = useQuery({
    queryKey: ["/api/file-uploads", month],
    enabled: isActive,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/monthly-stats", month],
    enabled: isActive,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/monthly-data", month],
    enabled: isActive,
  });

  // Calculate unique successful uploads
  const successfulUploads = fileUploads?.filter(upload => upload.file_uploads.status === 'completed') || [];
  const uniqueProcessorUploads = new Set(
    successfulUploads
      .filter(upload => upload.file_uploads.type === 'processor' && upload.file_uploads.processorId)
      .map(upload => upload.file_uploads.processorId)
  ).size;
  const hasLeadSheet = successfulUploads.some(upload => upload.file_uploads.type === 'lead_sheet');
  
  const uploadedCount = uniqueProcessorUploads + (hasLeadSheet ? 1 : 0);
  const totalSlots = processors.length + 1; // +1 for lead sheet

  const getHeaderColor = () => {
    if (!isActive) return "bg-zinc-700";
    return "bg-yellow-400";
  };

  const getOpacity = () => {
    if (!isActive) return "opacity-60";
    return "opacity-100";
  };

  if (!isActive) {
    return (
      <Card className={`${getOpacity()} bg-zinc-900/80 border-yellow-400/20`}>
        <CardHeader className={`${getHeaderColor()} text-white rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{displayTitle}</h2>
              <p className="text-gray-300 mt-1">Available after previous month processing complete</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">0/{totalSlots}</div>
              <div className="text-gray-300">Files Uploaded</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Lock className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400">Complete previous month processing to unlock {displayTitle ? displayTitle.split(' ').slice(0, 2).join(' ') : 'this month'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getOpacity()} bg-zinc-900/80 border-yellow-400/20`}>
      <CardHeader className={`${getHeaderColor()} text-black rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{displayTitle}</h2>
            <p className="text-black/70 mt-1">Upload processor files and lead sheets for matching</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{uploadedCount}/{totalSlots}</div>
            <div className="text-black/70">Files Uploaded</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* File Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Lead Sheet Upload */}
          <FileUploadCard
            title="Lead Sheet (CRM)"
            type="lead_sheet"
            month={month}
            processorId={null}
            isUploaded={hasLeadSheet}
            recordCount={successfulUploads.find(f => f.file_uploads.type === "lead_sheet")?.file_uploads.recordsProcessed}
          />

          {/* Processor Files */}
          {processors.map((processor) => {
            const upload = successfulUploads.find(f => 
              f.file_uploads.type === "processor" && 
              f.file_uploads.processorId === processor.id &&
              f.file_uploads.status === "completed"
            );
            return (
              <FileUploadCard
                key={processor.id}
                title={processor.name}
                type="processor"
                month={month}
                processorId={processor.id}
                isUploaded={!!upload}
                recordCount={upload?.file_uploads.recordsProcessed}
              />
            );
          })}
        </div>

        {/* Processing Summary */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300">Total MIDs Matched</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalMids}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300">Revenue Processed</p>
                  <p className="text-3xl font-bold text-green-400">${parseFloat(stats.totalRevenue).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300">Pending Assignments</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pendingAssignments}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* MID Matching Table */}
        {monthlyData && monthlyData.length > 0 && (
          <MIDTable data={monthlyData} month={month} />
        )}
      </CardContent>
    </Card>
  );
}
