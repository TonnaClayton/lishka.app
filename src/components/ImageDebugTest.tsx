import React, { useState, useEffect } from "react";
import { getBlobImage } from "@/lib/blob-storage";
import { getFishImageUrl } from "@/lib/fish-image-service";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const ImageDebugTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testFish = [
    { name: "Atlantic Salmon", scientificName: "Salmo salar" },
    { name: "Bluefin Tuna", scientificName: "Thunnus thynnus" },
    { name: "European Seabass", scientificName: "Dicentrarchus labrax" },
  ];

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    console.log("=== STARTING IMAGE DEBUG TESTS ===");

    // Test environment variables
    const envTest = {
      test: "Environment Variables",
      hasOpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
      hasBlobToken: !!import.meta.env.BLOB_READ_WRITE_TOKEN,
      hasSupabase: !!import.meta.env.VITE_SUPABASE_KEY,
      openAILength: import.meta.env.VITE_OPENAI_API_KEY?.length || 0,
      blobTokenLength: import.meta.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    };

    setTestResults((prev) => [...prev, envTest]);

    // Test each fish
    for (const fish of testFish) {
      try {
        console.log(`Testing ${fish.name} (${fish.scientificName})`);

        // Test blob storage directly
        const blobResult = await getBlobImage(fish.scientificName);

        // Test fish image service
        const serviceResult = await getFishImageUrl(
          fish.name,
          fish.scientificName,
        );

        const result = {
          test: `${fish.name}`,
          scientificName: fish.scientificName,
          blobResult: blobResult || "null",
          serviceResult: serviceResult || "null",
          blobSuccess: !!blobResult,
          serviceSuccess:
            !!serviceResult && !serviceResult.includes("placeholder"),
        };

        setTestResults((prev) => [...prev, result]);
      } catch (error) {
        console.error(`Error testing ${fish.name}:`, error);
        setTestResults((prev) => [
          ...prev,
          {
            test: `${fish.name}`,
            error: error.message,
          },
        ]);
      }
    }

    setIsLoading(false);
    console.log("=== IMAGE DEBUG TESTS COMPLETE ===");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Image Loading Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isLoading}>
          {isLoading ? "Running Tests..." : "Run Image Tests"}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <div className="font-medium">{result.test}</div>
                <pre className="text-xs mt-1 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageDebugTest;
