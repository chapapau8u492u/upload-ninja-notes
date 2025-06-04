
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFSplitter } from "@/components/PDFSplitter";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PDFSplit = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 mb-4" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">PDF Splitter</h1>
        <p className="text-gray-500">
          Split PDF files into smaller documents by page ranges
        </p>
      </div>
      
      <PDFSplitter />
    </div>
  );
};

export default PDFSplit;
