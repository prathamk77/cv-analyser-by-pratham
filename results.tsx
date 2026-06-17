import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, Zap, Target, Lightbulb } from "lucide-react";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export default function Results() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: analysis, isLoading, isError } = useGetAnalysis(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAnalysisQueryKey(id),
      refetchInterval: (query) => {
        return query.state.data?.status === "pending" ? 2000 : false;
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="bg-primary/10 p-6 rounded-full relative shadow-inner">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Fetching Report...</h2>
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-destructive/10 p-6 rounded-full">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analysis Not Found</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We couldn't locate this report. It may have been deleted or the link is incorrect.
          </p>
        </div>
        <Button size="lg" asChild className="mt-4 rounded-xl px-8">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  if (analysis.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse scale-150" />
          <div className="bg-primary p-6 rounded-full relative shadow-xl shadow-primary/30 text-primary-foreground">
            <SparklesIcon className="h-10 w-10 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Evaluating the CV...</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Extracting skills, parsing experience, and compiling the diagnostic report.
          </p>
        </div>
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/2" style={{ transformOrigin: '0% 50%' }} />
        </div>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-destructive/10 p-6 rounded-full">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Processing Failed</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We encountered an unexpected error while reading the CV content.
          </p>
        </div>
        <Button size="lg" variant="default" asChild className="mt-4 rounded-xl px-8">
          <Link href="/">Upload Different File</Link>
        </Button>
      </div>
    );
  }

  const scoreColor =
    analysis.overallScore >= 75 ? "hsl(173 58% 39%)" :
    analysis.overallScore >= 50 ? "hsl(43 74% 66%)" :
    "hsl(0 84.2% 60.2%)";

  const scoreLabel =
    analysis.overallScore >= 75 ? "Excellent Match" :
    analysis.overallScore >= 50 ? "Potential Match" :
    "Weak Match";

  const scoreData = [
    { name: "Score", value: analysis.overallScore, fill: scoreColor }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
            <Link href="/history" className="hover:text-primary transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to History
            </Link>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Diagnostic Report</h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate max-w-[250px]">{analysis.fileName}</span>
            </div>
            <span className="text-muted-foreground">
              Processed on {format(new Date(analysis.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-xl bg-card relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: scoreColor }} />
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Overall Score
            </div>

            <div className="relative h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="75%"
                  outerRadius="100%"
                  barSize={20}
                  data={scoreData}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: "hsl(var(--muted))" }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center -mt-8">
                <span className="text-6xl font-black tabular-nums tracking-tighter" style={{ color: scoreColor }}>
                  {analysis.overallScore}
                </span>
              </div>
            </div>

            <div className="mt-[-2rem] mb-6">
              <span className="text-lg font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>

            {analysis.roleTitle && (
              <div className="w-full bg-muted/50 p-4 rounded-xl text-sm font-medium border border-border flex items-center justify-center gap-2">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{analysis.roleTitle}</span>
              </div>
            )}

            {analysis.experienceYears != null && (
              <div className="w-full mt-3 flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Experience</span>
                <span className="text-lg font-bold">{analysis.experienceYears} Years</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-lg">
          <CardHeader className="pb-2 border-b border-border/50 px-8 pt-8">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Zap className="h-5 w-5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-lg leading-relaxed text-foreground/90 font-medium">
              {analysis.summary}
            </p>

            <div className="mt-10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Detected Skills</h4>
              <div className="flex flex-wrap gap-2.5">
                {analysis.skillsFound.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold border-none">
                    {skill}
                  </Badge>
                ))}
                {analysis.skillsFound.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">No specific skills detected.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg overflow-hidden bg-card">
          <div className="h-1.5 bg-green-500 w-full" />
          <CardHeader className="bg-green-500/5 pb-4 px-8 pt-6">
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2 font-bold text-xl">
              <CheckCircle2 className="h-6 w-6" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ul className="space-y-5">
              {analysis.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-base text-foreground/90 font-medium leading-snug">{strength}</span>
                </li>
              ))}
              {analysis.strengths.length === 0 && (
                <li className="text-sm text-muted-foreground italic">No specific strengths identified.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden bg-card">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardHeader className="bg-amber-500/5 pb-4 px-8 pt-6">
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2 font-bold text-xl">
              <AlertTriangle className="h-6 w-6" />
              Potential Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ul className="space-y-5">
              {analysis.gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-base text-foreground/90 font-medium leading-snug">{gap}</span>
                </li>
              ))}
              {analysis.gaps.length === 0 && (
                <li className="text-sm text-muted-foreground italic">No significant gaps identified.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recommendations & Next Steps
          </CardTitle>
          <CardDescription className="text-base font-medium">Suggested actions for the hiring manager</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="bg-background rounded-xl p-5 border-2 border-muted hover:border-primary/30 transition-colors shadow-sm relative">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                  {i + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed mt-2">{rec}</p>
              </div>
            ))}
            {analysis.recommendations.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground italic">
                No specific recommendations available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
