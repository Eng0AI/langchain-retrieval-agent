"use client";

import { useState, type FormEvent } from "react";
import DEFAULT_RETRIEVAL_TEXT from "@/data/DefaultRetrievalText";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Loader2, Upload } from "lucide-react";

export function UploadDocumentsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState(DEFAULT_RETRIEVAL_TEXT);
  const [uploaded, setUploaded] = useState(false);

  const ingest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/retrieval/ingest", {
      method: "POST",
      body: JSON.stringify({
        text: document,
      }),
    });
    if (response.status === 200) {
      setUploaded(true);
    } else {
      const json = await response.json();
      if (json.error) {
        setDocument(json.error);
      }
    }
    setIsLoading(false);
  };

  if (uploaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-medium">Document uploaded successfully!</p>
        <p className="text-xs text-muted-foreground">You can now ask questions about it.</p>
      </div>
    );
  }

  return (
    <form onSubmit={ingest} className="flex flex-col gap-4 w-full">
      <Textarea
        className="min-h-[400px] text-sm font-mono resize-none"
        value={document}
        onChange={(e) => setDocument(e.target.value)}
        placeholder="Paste your document text here..."
      />
      <Button type="submit" disabled={isLoading || !document.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </>
        )}
      </Button>
    </form>
  );
}
