import React, { useState, useRef } from "react";
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
import { cn } from "@/lib/utils";
import { uploadGearImage } from "@/lib/gear-upload-service";
import { useProfile } from "@/hooks/queries";
import { useAuth } from "@/contexts/auth-context";

interface GearUploadScreenProps {
  onUpload?: (files: FileList) => Promise<void>;
}

export default function GearUploadScreen({
  onUpload,
}: GearUploadScreenProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    setIsUploading(true);
    setUploadResults({ success: 0, failed: 0, results: [] });

    const userLocation = profile?.location || "";
    let successCount = 0;
    let failedCount = 0;
    const results: string[] = [];

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        setUploadProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentFileName: file.name,
        });

        try {
          const result = await uploadGearImage(file, userLocation);

          if (result.success && result.metadata?.gearInfo) {
            const gearInfo = result.metadata.gearInfo;
            if (gearInfo.name !== "Unknown Gear") {
              results.push(
                `${gearInfo.name} (${Math.round((gearInfo.confidence || 0) * 100)}% confident)`,
              );
            } else {
              results.push(`Gear item ${i + 1}`);
            }
            successCount++;
          } else {
            console.error(`Failed to upload gear ${i + 1}:`, result.error);
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to upload gear ${i + 1}:`, err);
          failedCount++;
        }

        // Small delay between uploads to respect rate limits
        if (i < selectedFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setUploadResults({ success: successCount, failed: failedCount, results });

      // Auto-navigate back after successful upload
      if (successCount > 0 && failedCount === 0) {
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      }
    } catch (err) {
      console.error("Upload process failed:", err);
      setUploadResults({
        success: successCount,
        failed: failedCount + (selectedFiles.length - successCount),
        results,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadResults({ success: 0, failed: 0, results: [] });
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
              const isProcessing =
                isUploading && uploadProgress && index < uploadProgress.current;
              const isCurrentlyProcessing =
                isUploading &&
                uploadProgress &&
                index === uploadProgress.current - 1;
              const isCompleted =
                isUploading &&
                uploadProgress &&
                index < uploadProgress.current - 1;

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
                          <h4 className="text-lg font-semibold text-blue-600 mb-1">
                            Identifying gear type...
                          </h4>
                          <p className="text-sm text-gray-500">40% complete</p>
                        </>
                      ) : isCompleted ? (
                        <>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            Outdoor Backpack
                          </h4>
                          <p className="text-sm text-gray-500">
                            Patagonia • Bags
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
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : isCompleted ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ) : !isUploading ? (
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
              disabled={isUploading}
              className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl border-0 shadow-sm"
              size="lg"
            >
              {isUploading
                ? `Processing ${uploadProgress?.current || 0} of ${uploadProgress?.total || selectedFiles.length}...`
                : `Process ${selectedFiles.length} Item${selectedFiles.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
      {/* Hidden file inputs */}
      <div className="p-6 rounded-2xl px-[0px] py-[0px] bg-transparent">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Selected Items
        </h3>

        <div className="space-y-4">
          {/* Completed Item */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80"
                  alt="Winter Jacket"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  Winter Jacket
                </h4>
                <p className="text-lg text-gray-500">
                  The North Face • Outerwear
                </p>
              </div>

              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Processing Item */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80"
                  alt="Processing Item"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-semibold text-blue-600 mb-1">
                  Identifying gear type...
                </h4>
                <p className="text-lg text-gray-500">40% complete</p>
              </div>

              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          </Card>

          {/* Removable Item */}
          <Card className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                  alt="Sneakers"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  Running Shoes
                </h4>
                <p className="text-lg text-gray-500">Ready to upload</p>
              </div>

              <button className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                <X className="w-6 h-6 text-red-600" />
              </button>
            </div>
          </Card>
        </div>
      </div>
      {/* Processing Status Section */}
      {isUploading && (
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your Items
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
            Our AI is analyzing each item through multiple steps to ensure
            accurate identification and categorization.
          </p>
        </div>
      )}
      {/* Processing Status Section */}
      {isUploading && (
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your Items
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
            Our AI is analyzing each item through multiple steps to ensure
            accurate identification and categorization.
          </p>
        </div>
      )}
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-bold text-gray-900 text-[sm] mb-[2]">
          Processing Your Items
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed mx-auto text-[xs] h-[fit] text-[12px]">
          Our AI is analyzing each item through multiple steps to ensure
          accurate identification and categorization.
        </p>
      </div>
    </div>
  );
}
