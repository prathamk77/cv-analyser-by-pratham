import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useCreateAnalysis } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  cvText: z.string().min(50, "CV text must be at least 50 characters long"),
  fileName: z.string().min(1, "File name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAnalysis = useCreateAnalysis();

  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cvText: "",
      fileName: "Pasted CV",
    },
  });

  const handleFileProcess = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyses/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      form.setValue("cvText", data.text);
      form.setValue("fileName", data.fileName);

      toast({
        title: "File uploaded successfully",
        description: "CV text extracted. You can now analyse it.",
      });

    } catch {
      toast({
        title: "Upload failed",
        description: "There was an error uploading the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const onSubmit = (values: FormValues) => {
    createAnalysis.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          toast({
            title: "Analysis started",
            description: "Redirecting to results...",
          });
          setLocation(`/results/${data.id}`);
        },
        onError: () => {
          toast({
            title: "Analysis failed",
            description: "There was an error starting the analysis.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          <span>AI-Powered Screening</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Evaluate candidates in seconds.</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Upload a CV to generate a comprehensive diagnostic report, highlighting strengths, skills, and potential gaps.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-2 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "paste")}>
                <div className="bg-muted/30 border-b px-6 py-4">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload PDF
                    </TabsTrigger>
                    <TabsTrigger value="paste" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Paste Text
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8 md:p-12">
                  <TabsContent value="upload" className="mt-0 outline-none">
                    <div
                      className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out flex flex-col items-center justify-center p-12 text-center
                        ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'}
                        ${form.watch("fileName") !== "Pasted CV" && form.watch("cvText") ? 'border-primary/30 bg-primary/5' : ''}
                      `}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        id="pdf-upload"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="pdf-upload"
                        className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                      >
                        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                          {isUploading ? (
                            <Loader2 className="h-10 w-10 animate-spin" />
                          ) : (
                            <Upload className="h-10 w-10" />
                          )}
                        </div>
                        <div className="mt-6 space-y-2">
                          <h3 className="text-xl font-semibold">
                            {isDragging ? "Drop PDF here" : "Click or drag to upload"}
                          </h3>
                          <p className="text-muted-foreground">Maximum file size: 10MB. PDF format only.</p>
                        </div>
                      </label>
                    </div>

                    {form.watch("fileName") !== "Pasted CV" && form.watch("cvText") && (
                      <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{form.watch("fileName")}</p>
                            <p className="text-xs text-muted-foreground">Ready for analysis</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("cvText", "");
                            form.setValue("fileName", "Pasted CV");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="mt-0 outline-none">
                    <FormField
                      control={form.control}
                      name="cvText"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                placeholder="Paste the full CV text here..."
                                className="min-h-[320px] font-mono text-sm resize-y rounded-xl bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (form.getValues("fileName") !== "Pasted CV") {
                                    form.setValue("fileName", "Pasted CV");
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full h-16 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
            disabled={createAnalysis.isPending || isUploading || !form.watch("cvText")}
          >
            {createAnalysis.isPending ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Analysing Candidate...
              </>
            ) : (
              <>
                Analyse CV
                <ArrowRight className="ml-3 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
