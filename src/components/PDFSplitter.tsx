
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Plus, X, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

export const PDFSplitter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPdfs, setSplitPdfs] = useState<Array<{ name: string; url: string }>>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedFile(file);
      
      // Get total pages
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      setTotalPages(pageCount);
      
      toast({
        title: "PDF loaded",
        description: `PDF has ${pageCount} pages`,
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast({
        title: "Error loading PDF",
        description: "Please try again with a valid PDF file",
        variant: "destructive",
      });
    }
  };

  const addSplitRange = () => {
    const newRange: SplitRange = {
      id: Math.random().toString(36).substr(2, 9),
      start: 1,
      end: totalPages,
      name: `Split ${splitRanges.length + 1}`
    };
    setSplitRanges(prev => [...prev, newRange]);
  };

  const updateSplitRange = (id: string, field: keyof SplitRange, value: string | number) => {
    setSplitRanges(prev => 
      prev.map(range => 
        range.id === id ? { ...range, [field]: value } : range
      )
    );
  };

  const removeSplitRange = (id: string) => {
    setSplitRanges(prev => prev.filter(range => range.id !== id));
  };

  const splitPDF = async () => {
    if (!selectedFile || splitRanges.length === 0) {
      toast({
        title: "Missing requirements",
        description: "Please select a PDF file and add at least one split range",
        variant: "destructive",
      });
      return;
    }

    // Validate ranges
    for (const range of splitRanges) {
      if (range.start < 1 || range.end > totalPages || range.start > range.end) {
        toast({
          title: "Invalid range",
          description: `Range "${range.name}" has invalid page numbers`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSplitting(true);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      const results: Array<{ name: string; url: string }> = [];

      for (const range of splitRanges) {
        const newPdf = await PDFDocument.create();
        
        // Copy pages from original PDF
        const pageIndices = [];
        for (let i = range.start - 1; i < range.end; i++) {
          pageIndices.push(i);
        }
        
        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        // Set metadata
        newPdf.setTitle(`${range.name} - Pages ${range.start}-${range.end}`);
        newPdf.setProducer("upload-ninja-notes PDF splitter");
        newPdf.setCreator("upload-ninja-notes");
        
        // Generate PDF
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        results.push({
          name: `${range.name}_pages_${range.start}-${range.end}.pdf`,
          url
        });
      }

      setSplitPdfs(results);
      
      toast({
        title: "PDF split successfully",
        description: `Created ${results.length} PDF files`,
      });

    } catch (error) {
      console.error("Error splitting PDF:", error);
      toast({
        title: "Error splitting PDF",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSplitting(false);
    }
  };

  const downloadPdf = (name: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    splitPdfs.forEach(pdf => {
      setTimeout(() => downloadPdf(pdf.name, pdf.url), 100);
    });
  };

  const resetSplitter = () => {
    setSelectedFile(null);
    setSplitRanges([]);
    setTotalPages(0);
    if (splitPdfs.length > 0) {
      splitPdfs.forEach(pdf => URL.revokeObjectURL(pdf.url));
      setSplitPdfs([]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            PDF Splitter
          </CardTitle>
          <CardDescription>
            Split a PDF file into multiple documents by specifying page ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pdf-file">Select PDF File</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-sm text-gray-500">({totalPages} pages)</span>
              </div>
            </div>
          )}

          {totalPages > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Split Ranges</h4>
                <Button onClick={addSplitRange} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Range
                </Button>
              </div>

              {splitRanges.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {splitRanges.map((range) => (
                    <div
                      key={range.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                    >
                      <Input
                        placeholder="Range name"
                        value={range.name}
                        onChange={(e) => updateSplitRange(range.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Pages:</span>
                        <Input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={range.start}
                          onChange={(e) => updateSplitRange(range.id, 'start', parseInt(e.target.value) || 1)}
                          className="w-16"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <Input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={range.end}
                          onChange={(e) => updateSplitRange(range.id, 'end', parseInt(e.target.value) || totalPages)}
                          className="w-16"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSplitRange(range.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={splitPDF}
                  disabled={splitRanges.length === 0 || isSplitting}
                  className="flex-1"
                >
                  {isSplitting ? (
                    <>
                      <Scissors className="mr-2 h-4 w-4 animate-pulse" />
                      Splitting...
                    </>
                  ) : (
                    <>
                      <Scissors className="mr-2 h-4 w-4" />
                      Split PDF
                    </>
                  )}
                </Button>
                
                {(selectedFile || splitRanges.length > 0) && (
                  <Button variant="outline" onClick={resetSplitter}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {splitPdfs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Split PDFs Ready ({splitPdfs.length})
            </CardTitle>
            <CardDescription>
              Your PDF has been successfully split
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={downloadAll} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download All PDFs
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Individual Downloads:</h4>
              {splitPdfs.map((pdf, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm font-medium truncate">{pdf.name}</span>
                  <Button
                    size="sm"
                    onClick={() => downloadPdf(pdf.name, pdf.url)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
