import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  Upload,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useUpload } from "@/contexts/upload-context";

export default function GearUploadScreen() {
  const navigate = useNavigate();
  const {
    handlePhotoUpload,
    uploadGearItemsStreamData,
    isUploading: contextIsUploading,
    identifyGearMessage,
    uploadError,
  } = useUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    results: string[];
  }>({ success: 0, failed: 0, results: [] });
  const [completedUploads, setCompletedUploads] = useState<number>(0);
  const [totalUploadsStarted, setTotalUploadsStarted] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Monitor stream completion and handle navigation
  useEffect(() => {
    if (!isUploading || totalUploadsStarted === 0) return;

    const streamData = uploadGearItemsStreamData?.data;

    // Handle successful completion
    if (streamData?.saved === "completed") {
      setCompletedUploads((prev) => {
        const newCompleted = prev + 1;

        // Extract gear name from stream data if available
        if (identifyGearMessage?.includes("Identified:")) {
          const gearName = identifyGearMessage.split("Identified:")[1]?.trim();
          if (gearName) {
            setUploadResults((prevResults) => ({
              ...prevResults,
              results: [...prevResults.results, gearName],
              success: prevResults.success + 1,
            }));
          }
        }

        return newCompleted;
      });
    }

    // Handle failed uploads
    if (
      streamData?.analyzing === "failed" ||
      streamData?.uploading === "failed" ||
      streamData?.saved === "failed"
    ) {
      setCompletedUploads((prev) => prev + 1);
    }
  }, [
    uploadGearItemsStreamData?.data,
    identifyGearMessage,
    isUploading,
    totalUploadsStarted,
  ]);

  // Separate effect to handle final navigation check
  useEffect(() => {
    if (
      isUploading &&
      completedUploads >= totalUploadsStarted &&
      totalUploadsStarted > 0
    ) {
      setIsUploading(false);
      setUploadProgress(null);

      // Show results and navigate after all uploads are truly complete
      setTimeout(() => {
        if (uploadResults.success > 0) {
          navigate("/profile");
        }
      }, 2000);
    }
  }, [
    completedUploads,
    totalUploadsStarted,
    isUploading,
    uploadResults.success,
    navigate,
  ]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const totalFiles = selectedFiles.length + fileArray.length;

    if (totalFiles > 10) {
      alert(
        `You can only select up to 10 items. Currently selected: ${selectedFiles.length}`,
      );
      return;
    }

    setSelectedFiles((prev) => [...prev, ...fileArray]);
  };

  const handleChoosePhotos = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Reset state for new upload batch
    setIsUploading(true);
    setUploadResults({ success: 0, failed: 0, results: [] });
    setCompletedUploads(0);
    setTotalUploadsStarted(selectedFiles.length);

    let failedCount = 0;

    try {
      // Process files sequentially to work with the streaming API
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        setUploadProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentFileName: file.name,
        });

        try {
          // Use the upload context to handle gear uploads
          // The context will handle streaming and provide real-time updates
          // Stream completion will be monitored by the useEffect
          await handlePhotoUpload([file], { type: "gear" });
        } catch (err) {
          console.error(`Failed to upload gear ${i + 1}:`, err);
          failedCount++;

          // Update failed count immediately for failed uploads
          setUploadResults((prev) => ({
            ...prev,
            failed: prev.failed + 1,
          }));
        }

        // Small delay between uploads to respect rate limits
        if (i < selectedFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // If there were any failures, handle final state
      if (failedCount > 0) {
        setUploadResults((prev) => ({
          ...prev,
          failed: failedCount,
        }));
      }
    } catch (err) {
      console.error("Upload process failed:", err);
      setIsUploading(false);
      setUploadProgress(null);
    }
    // Note: setIsUploading(false) and navigation is now handled in useEffect
    // when all streams are truly complete
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadResults({ success: 0, failed: 0, results: [] });
    setCompletedUploads(0);
    setTotalUploadsStarted(0);
    setUploadProgress(null);
  };

  // Show results screen after upload
  if (uploadResults.success > 0 || uploadResults.failed > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Upload Complete
              </h1>
              <p className="text-gray-600 text-sm">
                {uploadResults.success} successful, {uploadResults.failed}{" "}
                failed
              </p>
            </div>
          </div>
        </div>
        {/* Results */}
        <div className="flex-1 p-4 space-y-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {uploadResults.success > 0 && (
              <Card className="p-6 border-green-200 bg-green-50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">
                      Successfully uploaded {uploadResults.success} item
                      {uploadResults.success > 1 ? "s" : ""}!
                    </h3>
                    {uploadResults.results.length > 0 && (
                      <div className="text-sm text-green-800">
                        <p className="mb-1">Identified:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {uploadResults.results.map((result, index) => (
                            <li key={index}>{result}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {uploadResults.failed > 0 && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      {uploadResults.failed} item
                      {uploadResults.failed > 1 ? "s" : ""} failed to upload
                    </h3>
                    <p className="text-sm text-red-800">
                      Please try again with different images or check your
                      connection.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button onClick={() => navigate("/profile")} className="flex-1">
                View My Gear
              </Button>
              <Button
                onClick={resetUpload}
                variant="outline"
                className="flex-1"
              >
                Upload More
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Your Gear</h1>
        <p className="text-gray-600">
          Upload photos of your gear to add them to your collection
        </p>
      </div>
      {/* Upload Options */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
        {/* Take Photo */}
        <button
          onClick={handleTakePhoto}
          className="p-8 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-blue-600">
            Take Photo
          </span>
        </button>

        {/* Choose Photos */}
        <button
          onClick={handleChoosePhotos}
          className="p-8 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center gap-4 px-1.5"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-blue-600">
            Choose Photos
          </span>
        </button>
      </div>
      {/* Selection Counter */}
      {selectedFiles.length > 0 && (
        <div className="text-center">
          <p className="text-gray-500 text-lg">
            {selectedFiles.length} of 10 items selected
          </p>
        </div>
      )}
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-gray-900">
            Selected Items
          </h3>
          <div className="space-y-4">
            {selectedFiles.map((file, index) => {
              const isCurrentlyProcessing =
                isUploading &&
                uploadProgress &&
                index === uploadProgress.current - 1;
              const isCompleted =
                isUploading &&
                uploadProgress &&
                index < uploadProgress.current - 1;

              // Get real-time status from upload stream
              const streamStatus =
                isCurrentlyProcessing && uploadGearItemsStreamData?.data;
              const isAnalyzing = streamStatus?.analyzing === "processing";
              const isUploading_stream =
                streamStatus?.uploading === "processing";
              const isSaved = streamStatus?.saved === "completed";

              return (
                <Card
                  key={index}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected item ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isCurrentlyProcessing ? (
                        <>
                          {isAnalyzing ? (
                            <>
                              <h4 className="text-lg font-semibold text-blue-600 mb-1">
                                Analyzing image...
                              </h4>
                              <p className="text-sm text-gray-500">
                                Identifying gear type
                              </p>
                            </>
                          ) : isUploading_stream ? (
                            <>
                              <h4 className="text-lg font-semibold text-blue-600 mb-1">
                                Uploading gear...
                              </h4>
                              <p className="text-sm text-gray-500">
                                Processing upload
                              </p>
                            </>
                          ) : isSaved ? (
                            <>
                              <h4 className="text-lg font-semibold text-green-600 mb-1">
                                Upload complete!
                              </h4>
                              <p className="text-sm text-gray-500">
                                Gear saved successfully
                              </p>
                            </>
                          ) : (
                            <>
                              <h4 className="text-lg font-semibold text-blue-600 mb-1">
                                Processing...
                              </h4>
                              <p className="text-sm text-gray-500">
                                Preparing upload
                              </p>
                            </>
                          )}
                        </>
                      ) : isCompleted ? (
                        <>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {identifyGearMessage?.includes("Identified:")
                              ? identifyGearMessage
                                  .split("Identified:")[1]
                                  ?.trim() || "Gear Item"
                              : "Gear Item"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Upload completed
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                            {file.name.replace(/\.[^/.]+$/, "")}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Ready to upload
                          </p>
                        </>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {isCurrentlyProcessing ? (
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                          {streamStatus?.analyzing === "failed" ||
                          streamStatus?.uploading === "failed" ||
                          streamStatus?.saved === "failed" ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : isSaved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      ) : isCompleted ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ) : !(isUploading || contextIsUploading) ? (
                        <button
                          onClick={() => removeFile(index)}
                          className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {/* Sticky Bottom Button */}
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleUpload}
              disabled={isUploading || contextIsUploading}
              className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl border-0 shadow-sm"
              size="lg"
            >
              {isUploading || contextIsUploading
                ? `Processing ${uploadProgress?.current || 0} of ${uploadProgress?.total || selectedFiles.length}...`
                : `Process ${selectedFiles.length} Item${selectedFiles.length > 1 ? "s" : ""}`}
            </Button>
            {uploadError && (
              <div className="mt-2 text-center text-red-600 text-sm">
                {uploadError.message}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      {/* Processing Status Section */}
      {(isUploading || contextIsUploading) && (
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your Items
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
            Our AI is analyzing each item through multiple steps to ensure
            accurate identification and categorization.
          </p>
          {uploadGearItemsStreamData?.data?.message && (
            <div className="mt-4 text-sm text-blue-600 font-medium">
              {uploadGearItemsStreamData.data.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
