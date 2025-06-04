
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Plus, X, Merge } from "lucide-react";
import PDFMergerLib from "pdf-merger-js/browser";

interface SelectedFile {
  file: File;
  id: string;
}

export const PDFMerger = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9)
      }));

    if (newFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const mergePDFs = async () => {
    if (selectedFiles.length < 2) {
      toast({
        title: "Insufficient files",
        description: "Please select at least 2 PDF files to merge",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMerging(true);
      
      const merger = new PDFMergerLib();

      // Add each file to the merger
      for (const selectedFile of selectedFiles) {
        await merger.add(selectedFile.file);
      }

      // Set metadata
      await merger.setMetadata({
        producer: "upload-ninja-notes PDF merger",
        creator: "upload-ninja-notes",
        title: "Merged PDF Document"
      });

      // Get the merged PDF as a blob
      const mergedPdf = await merger.saveAsBlob();
      
      // Create a URL for the merged PDF
      const url = URL.createObjectURL(mergedPdf);
      setMergedPdfUrl(url);

      toast({
        title: "PDFs merged successfully",
        description: "Your PDF files have been merged successfully",
      });

    } catch (error) {
      console.error("Error merging PDFs:", error);
      toast({
        title: "Error merging PDFs",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const downloadMergedPDF = () => {
    if (!mergedPdfUrl) return;

    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetMerger = () => {
    setSelectedFiles([]);
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            PDF Merger
          </CardTitle>
          <CardDescription>
            Select multiple PDF files to merge them into a single document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pdf-files">Select PDF Files</Label>
            <Input
              id="pdf-files"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((selectedFile, index) => (
                  <div
                    key={selectedFile.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm truncate max-w-[200px]">
                        {selectedFile.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(selectedFile.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={mergePDFs}
              disabled={selectedFiles.length < 2 || isMerging}
              className="flex-1"
            >
              {isMerging ? (
                <>
                  <Plus className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="mr-2 h-4 w-4" />
                  Merge PDFs
                </>
              )}
            </Button>
            
            {selectedFiles.length > 0 && (
              <Button variant="outline" onClick={resetMerger}>
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {mergedPdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Merged PDF Ready
            </CardTitle>
            <CardDescription>
              Your PDF files have been successfully merged
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={downloadMergedPDF} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Merged PDF
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <iframe
                src={mergedPdfUrl}
                className="w-full h-96"
                title="Merged PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
