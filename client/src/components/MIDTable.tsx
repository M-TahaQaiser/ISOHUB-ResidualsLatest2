import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RoleAssignmentModal from "@/components/RoleAssignmentModal";
import BulkAssignmentModal from "@/components/BulkAssignmentModal";
import { Download, Eye, Settings, CheckCircle, AlertTriangle, Clock, Users, Zap } from "lucide-react";

interface MIDTableProps {
  data: any[];
  month: string;
}

export default function MIDTable({ data, month }: MIDTableProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedMerchants, setSelectedMerchants] = useState<number[]>([]);
  const [filterProcessor, setFilterProcessor] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: processors } = useQuery({
    queryKey: ["/api/processors"],
  });

  const { data: assignments, refetch: refetchAssignments } = useQuery({
    queryKey: ["/api/assignments", selectedMerchant?.merchants?.id || selectedMerchant?.merchant?.id || selectedMerchant?.merchantId, month],
    enabled: !!(selectedMerchant?.merchants?.id || selectedMerchant?.merchant?.id || selectedMerchant?.merchantId),
  });

  const filteredData = data.filter(item => 
    filterProcessor === "all" || (item.processors?.id || item.processor?.id || item.processorId)?.toString() === filterProcessor
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const getStatusBadge = (merchantData: any) => {
    // This would normally check assignments and audit status
    const hasRevenue = parseFloat(merchantData.monthly_data?.net || merchantData.net || "0") > 0;
    
    if (!hasRevenue) {
      return (
        <Badge className="status-badge status-neutral">
          <Clock className="mr-1 h-3 w-3" />
          No Revenue
        </Badge>
      );
    }

    // Check if assignments exist (would need to be passed as prop or fetched)
    return (
      <Badge className="status-badge status-warning">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Pending Assignment
      </Badge>
    );
  };

  const getProcessorBadge = (processorName: string) => {
    const processorClass: Record<string, string> = {
      "Payment Advisors": "status-badge processor-payment-advisors",
      "Clearent": "status-badge processor-clearent",
      "Micamp Solutions": "status-badge processor-micamp",
      "Global Payments TSYS": "status-badge processor-global-payments",
      "Merchant Lynx": "status-badge processor-merchant-lynx",
    };

    return processorClass[processorName] || "status-badge status-neutral";
  };

  const toggleMerchantSelection = (merchantId: number) => {
    setSelectedMerchants(prev => 
      prev.includes(merchantId) 
        ? prev.filter(id => id !== merchantId)
        : [...prev, merchantId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = paginatedData
      .map(item => item.merchants?.id || item.merchant?.id)
      .filter(Boolean);
    setSelectedMerchants(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const clearSelection = () => {
    setSelectedMerchants([]);
  };

  return (
    <>
      <Card className="bg-zinc-900/80 rounded-lg border border-yellow-400/20 shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <div className="space-y-4">
            {/* Title and Selection Info */}
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-white">MID Matching & Assignment Status</CardTitle>
              {selectedMerchants.length > 0 && (
                <p className="text-sm text-yellow-400 mt-2 font-medium">
                  {selectedMerchants.length} merchant{selectedMerchants.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            
            {/* Controls - Mobile Stack, Desktop Row */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-3">
              {/* Bulk Actions */}
              {selectedMerchants.length > 0 && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button 
                    onClick={() => setShowBulkModal(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 sm:px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Bulk Assign ({selectedMerchants.length})</span>
                    <span className="sm:hidden">Assign ({selectedMerchants.length})</span>
                  </Button>
                  <Button 
                    onClick={clearSelection}
                    className="border border-gray-600 text-gray-300 hover:bg-zinc-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {/* Filter and Export */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-auto">
                <Select value={filterProcessor} onValueChange={setFilterProcessor}>
                  <SelectTrigger className="w-full sm:w-48 border-yellow-400/30 bg-zinc-800 text-gray-200 focus:border-yellow-400 focus:ring-yellow-400">
                    <SelectValue placeholder="Filter by processor" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-yellow-400/30">
                    <SelectItem value="all">All Processors</SelectItem>
                    {(processors as any)?.map((processor: any) => (
                      <SelectItem key={processor.id} value={processor.id.toString()}>
                        {processor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="border border-gray-600 text-gray-300 hover:bg-zinc-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="px-4 py-3 border-b border-yellow-400/20 bg-zinc-800/80">
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={paginatedData.length > 0 && paginatedData.every(item => 
                    selectedMerchants.includes(item.merchants?.id || item.merchant?.id)
                  )}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllVisible();
                    } else {
                      clearSelection();
                    }
                  }}
                  className="rounded border-yellow-400/50 text-yellow-400 focus:ring-yellow-400"
                />
                <span className="text-sm font-medium text-gray-400">Select All</span>
              </div>
            </div>
            <div className="divide-y divide-yellow-400/10">
              {paginatedData.map((item) => {
                const merchantId = item.merchants?.id || item.merchant?.id;
                const isSelected = selectedMerchants.includes(merchantId);
                
                return (
                  <div key={`mobile-${merchantId}-${item.processors?.id || item.processor?.id || item.processorId}`} 
                       className={`p-4 space-y-3 ${isSelected ? 'bg-yellow-400/5' : ''}`}>
                    {/* Header Row - Checkbox and MID */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => merchantId && toggleMerchantSelection(merchantId)}
                          className="rounded border-yellow-400/50 text-yellow-400 focus:ring-yellow-400"
                        />
                        <div>
                          <p className="text-sm font-mono text-white font-medium">
                            {item.merchants?.mid || item.merchant?.mid || item.merchantId || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">MID</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          ${parseFloat(item.monthly_data?.net || item.net || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400">Revenue</p>
                      </div>
                    </div>
                    
                    {/* Merchant Name */}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.merchants?.dba || item.merchants?.legalName || item.merchant?.dba || item.merchant?.legalName || item.merchantName || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">Merchant Name</p>
                    </div>
                    
                    {/* Processor and Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className={getProcessorBadge(item.processors?.name || item.processor?.name || item.processorName || 'Unknown')}>
                          {item.processors?.name || item.processor?.name || item.processorName || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        {getStatusBadge(item)}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMerchant(item)}
                        className="text-yellow-400 hover:bg-yellow-400/10 flex-1"
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Assign
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-zinc-700 flex-1">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-yellow-400/20">
              <thead className="bg-zinc-800/80">
                <tr>
                  <th className="w-16 px-4 lg:px-6 py-3 text-left">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every(item => 
                          selectedMerchants.includes(item.merchants?.id || item.merchant?.id)
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllVisible();
                          } else {
                            clearSelection();
                          }
                        }}
                        className="rounded border-yellow-400/50 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="hidden lg:inline text-xs font-medium text-gray-400 uppercase tracking-wider">Select</span>
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">MID</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Merchant Name</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Processor</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900/50 divide-y divide-yellow-400/10">
                {paginatedData.map((item) => {
                  const merchantId = item.merchants?.id || item.merchant?.id;
                  const isSelected = selectedMerchants.includes(merchantId);
                  
                  return (
                    <tr key={`desktop-${merchantId}-${item.processors?.id || item.processor?.id || item.processorId}`} 
                        className={`hover:bg-zinc-800/50 transition-colors duration-150 ${isSelected ? 'bg-yellow-400/5' : ''}`}>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => merchantId && toggleMerchantSelection(merchantId)}
                          className="rounded border-yellow-400/50 text-yellow-400 focus:ring-yellow-400"
                        />
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                        {item.merchants?.mid || item.merchant?.mid || item.merchantId || 'N/A'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-white max-w-xs truncate">
                        {item.merchants?.dba || item.merchants?.legalName || item.merchant?.dba || item.merchant?.legalName || item.merchantName || "Unknown"}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Badge className={getProcessorBadge(item.processors?.name || item.processor?.name || item.processorName || 'Unknown')}>
                          {item.processors?.name || item.processor?.name || item.processorName || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        ${parseFloat(item.monthly_data?.net || item.net || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 lg:space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMerchant(item)}
                            className="text-yellow-400 hover:bg-yellow-400/10 px-2 lg:px-3"
                          >
                            <Settings className="mr-1 h-4 w-4" />
                            <span className="hidden lg:inline">Assign</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-zinc-700 px-2 lg:px-3">
                            <Eye className="mr-1 h-4 w-4" />
                            <span className="hidden lg:inline">View</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-yellow-400/20 bg-zinc-800/50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-300 text-center sm:text-left">
                Showing{" "}
                <span className="font-medium text-white">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-medium text-white">
                  {Math.min(currentPage * pageSize, filteredData.length)}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span> results
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-600 text-gray-300 hover:bg-zinc-700 disabled:opacity-50 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <div className="hidden sm:flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page 
                          ? "bg-yellow-400 text-black hover:bg-yellow-500" 
                          : "border-gray-600 text-gray-300 hover:bg-zinc-700"
                        }
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <span className="sm:hidden text-sm text-gray-300 px-2 py-1 whitespace-nowrap">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-600 text-gray-300 hover:bg-zinc-700 disabled:opacity-50 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedMerchant && (
        <RoleAssignmentModal
          merchant={selectedMerchant.merchants || selectedMerchant.merchant}
          monthlyData={selectedMerchant.monthly_data || selectedMerchant}
          month={month}
          isOpen={!!selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
          onSuccess={() => {
            setSelectedMerchant(null);
            refetchAssignments();
          }}
        />
      )}

      {showBulkModal && (
        <BulkAssignmentModal
          merchants={selectedMerchants.map(id => 
            data.find(item => (item.merchants?.id || item.merchant?.id) === id)
          ).filter(Boolean)}
          month={month}
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            setSelectedMerchants([]);
            refetchAssignments();
          }}
        />
      )}
    </>
  );
}
