import React, { useState } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { generateTextWithAI } from "@/lib/ai";

const OpenAITestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    text?: string;
  } | null>(null);

  const testOpenAI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { text } = await generateTextWithAI({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", type: "text", content: "Say hello" }],
        maxTokens: 10,
      });

      setResult({
        success: true,
        message: "OpenAI connection successful!",
        text: text,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={testOpenAI} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          "Test OpenAI Connection"
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? "success" : "destructive"}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OpenAITestButton;
