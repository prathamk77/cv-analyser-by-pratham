import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  useListAnalyses,
  useGetAnalysisStats,
  useDeleteAnalysis,
  getListAnalysesQueryKey,
  getGetAnalysisStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  BarChart2,
  ChevronRight,
  Search,
  XCircle
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: analyses = [], isLoading: isLoadingAnalyses } = useListAnalyses({
    query: { queryKey: getListAnalysesQueryKey() }
  });

  const { data: stats, isLoading: isLoadingStats } = useGetAnalysisStats({
    query: { queryKey: getGetAnalysisStatsQueryKey() }
  });

  const deleteAnalysis = useDeleteAnalysis();

  const handleDelete = (id: number) => {
    deleteAnalysis.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Analysis deleted" });
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Failed to delete",
            description: "An error occurred while deleting the analysis.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const filteredAnalyses = analyses.filter(a => {
    const search = searchTerm.toLowerCase();
    return (
      a.fileName.toLowerCase().includes(search) ||
      (a.roleTitle && a.roleTitle.toLowerCase().includes(search)) ||
      a.status.toLowerCase().includes(search)
    );
  });

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400";
    if (score >= 50) return "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400";
    return "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Review and manage past candidate evaluations.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, roles..."
            className="pl-9 h-11 bg-card border-2 border-border/50 rounded-xl focus-visible:border-primary focus-visible:ring-0 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Processed</p>
            <div className="mt-4 flex items-end gap-3">
              <h3 className="text-4xl font-black">
                {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : stats?.totalAnalyses || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Average Score</p>
            <div className="mt-4 flex items-end gap-3">
              <h3 className="text-4xl font-black text-primary">
                {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : Math.round(stats?.averageScore || 0)}
              </h3>
              <span className="text-muted-foreground font-medium mb-1">/ 100</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4 h-full">
              <div className="p-3 bg-primary/10 rounded-xl mt-1 shrink-0">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 w-full overflow-hidden">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Skills Demanded</p>
                {isLoadingStats ? (
                  <div className="flex gap-2"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {stats?.topSkills && stats.topSkills.length > 0 ? (
                      stats.topSkills.map((item, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 bg-secondary hover:bg-secondary text-sm font-medium">
                          {item.skill} <span className="ml-2 px-1.5 py-0.5 rounded-md bg-background/50 text-xs font-bold opacity-80">{item.count}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No data available</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {isLoadingAnalyses ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Loading history...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-muted/20">
              <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No analyses found</h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-lg">
                {searchTerm ? "We couldn't find any results matching your search." : "You haven't analysed any CVs yet."}
              </p>
              {!searchTerm && (
                <Button size="lg" asChild className="rounded-xl px-8">
                  <Link href="/">Analyse First CV</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b-border/50">
                    <TableHead className="py-5 font-semibold text-foreground uppercase tracking-wider text-xs">Candidate</TableHead>
                    <TableHead className="py-5 font-semibold text-foreground uppercase tracking-wider text-xs">Role / Target</TableHead>
                    <TableHead className="py-5 font-semibold text-foreground uppercase tracking-wider text-xs">Date</TableHead>
                    <TableHead className="py-5 font-semibold text-foreground uppercase tracking-wider text-xs text-center">Score</TableHead>
                    <TableHead className="py-5 font-semibold text-foreground uppercase tracking-wider text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id} className="group cursor-pointer hover:bg-muted/30 transition-colors border-b-border/50">
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-semibold truncate max-w-[200px]" title={analysis.fileName}>
                            {analysis.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {analysis.roleTitle ? (
                          <Badge variant="outline" className="font-medium bg-background border-border/50 truncate max-w-[200px]">
                            {analysis.roleTitle}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">General Analysis</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm py-4 font-medium">
                        {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {analysis.status === "completed" ? (
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${getScoreColor(analysis.overallScore)}`}>
                            {analysis.overallScore}
                          </div>
                        ) : analysis.status === "pending" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold">
                            <Loader2 className="h-3 w-3 animate-spin" /> Processing
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
                            <XCircle className="h-3 w-3" /> Failed
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" className="h-9 font-medium hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                            <Link href={`/results/${analysis.id}`}>
                              Review <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the analysis for <span className="font-semibold text-foreground">"{analysis.fileName}"</span>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(analysis.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  {deleteAnalysis.isPending && deleteAnalysis.variables?.id === analysis.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
