import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useListIncidents, getListIncidentsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";
import { Search, Filter, AlertTriangle, ShieldCheck } from "lucide-react";
export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const { data: incidents, isLoading } = useListIncidents(
    undefined,
    { query: { queryKey: getListIncidentsQueryKey() } }
  );

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
      case 'HIGH': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
      case 'LOW': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <Badge variant="outline" className="border-red-500/50 text-red-400">Open</Badge>;
      case 'INVESTIGATING': return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">Investigating</Badge>;
      case 'RESOLVED': return <Badge variant="outline" className="border-green-500/50 text-green-400">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="border-gray-500/50 text-gray-400">Closed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredIncidents = incidents?.filter(incident => {
    if (statusFilter !== "ALL" && incident.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && incident.severity !== severityFilter) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and investigate system anomalies</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground neon-border-blue">
            Declare Incident
          </Button>
        </div>

        <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-96 relative">
            <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
            <Input placeholder="Search incidents..." className="pl-9 bg-background/50 border-border" />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-background/50 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px] bg-background/50 border-border">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shrink-0 bg-background/50 border-border">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredIncidents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mb-2 opacity-50" />
                      <p>No incidents found matching your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents?.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/30 group">
                    <TableCell className="font-mono text-muted-foreground">INC-{incident.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{incident.title}</div>
                      {incident.rootCause && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          <span className="text-primary/80 font-mono text-[10px] mr-1">AI</span> 
                          {incident.rootCause}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(incident.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/incidents/${incident.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Investigate
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
