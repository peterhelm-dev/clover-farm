import { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertCircle, Check, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageMealLoggerProps {
  onSuccess?: () => void;
}

export function ImageMealLogger({ onSuccess }: ImageMealLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.image.uploadImage.useMutation();
  const analyzeImageMutation = trpc.image.analyzeImage.useMutation();
  const logMealMutation = trpc.image.logMealFromImage.useMutation();

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5MB). Please select a smaller image.");
      return;
    }

    const compressedFile = await compressImage(file);
    setImageFile(compressedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast.error("No image selected");
      return;
    }

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          if (!base64) throw new Error("Failed to encode image");

          const uploadResult = await uploadImageMutation.mutateAsync({
            imageData: base64,
            fileName: imageFile.name,
          });

          // Convert relative URL to absolute URL for LLM vision API
          const absoluteUrl = uploadResult.url.startsWith('http')
            ? uploadResult.url
            : `${window.location.origin}${uploadResult.url}`;

          const analysis = await analyzeImageMutation.mutateAsync({
            imageUrl: absoluteUrl,
          });

          setAnalysisResult({
            ...analysis,
            imageUrl: uploadResult.url,
          });
          toast.success("Image analyzed! Review the results below.");
          setIsAnalyzing(false);
        } catch (innerError: any) {
          console.error("Analysis error:", innerError);
          toast.error(innerError?.message || "Failed to analyze image. Please try again.");
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error?.message || "Failed to process image. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndLog = async () => {
    if (!analysisResult) return;

    try {
      await logMealMutation.mutateAsync({
        imageUrl: analysisResult.imageUrl,
        foodDescription: analysisResult.foodDescription,
        calories: analysisResult.calories || 0,
        protein: analysisResult.protein || 0,
        carbs: analysisResult.carbs || 0,
        fat: analysisResult.fat || 0,
        fiber: analysisResult.fiber || 0,
        allergens: analysisResult.allergens || [],
        confidence: analysisResult.confidence || "medium",
      });

      toast.success("Meal logged successfully!");
      setIsOpen(false);
      setImageFile(null);
      setImagePreview("");
      setAnalysisResult(null);
      setRotation(0);
      setScale(1);
      onSuccess?.();
    } catch (error: any) {
      console.error("Log error:", error);
      toast.error(error?.message || "Failed to log meal. Please try again.");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2 h-11 sm:h-auto min-w-11 sm:min-w-0"
      >
        <Camera className="w-4 h-4" />
        <span className="hidden sm:inline">Log Meal with Photo</span>
        <span className="sm:hidden">Photo</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Meal from Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!analysisResult ? (
              <>
                {!imagePreview && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      variant="outline"
                      className="h-24 flex-col gap-2"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-sm">Take Photo</span>
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-24 flex-col gap-2"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Upload Photo</span>
                    </Button>
                  </div>
                )}

                {imagePreview && (
                  <div className="space-y-3">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-64">
                      <img
                        src={imagePreview}
                        alt="Meal preview"
                        className="max-w-full max-h-full"
                        style={{
                          transform: `rotate(${rotation}deg) scale(${scale})`,
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex gap-2 items-center">
                        <Button
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <RotateCw className="w-4 h-4" />
                          Rotate
                        </Button>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-gray-600 whitespace-nowrap">Zoom:</span>
                          <input
                            type="range"
                            min="0.8"
                            max="1.5"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-600 w-10 text-right">{(scale * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                          setRotation(0);
                          setScale(1);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Change Photo
                      </Button>
                      <Button
                        onClick={handleAnalyzeImage}
                        disabled={isAnalyzing}
                        className="flex-1 gap-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze Meal"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </>
            ) : (
              <>
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Analysis Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Meal Description</p>
                      <p className="font-medium">{analysisResult.foodDescription}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Calories</p>
                        <p className="font-semibold">{analysisResult.calories} kcal</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Protein</p>
                        <p className="font-semibold">{analysisResult.protein}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Carbs</p>
                        <p className="font-semibold">{analysisResult.carbs}g</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fat</p>
                        <p className="font-semibold">{analysisResult.fat}g</p>
                      </div>
                    </div>

                    {analysisResult.allergens?.length > 0 && (
                      <div className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Allergens detected:</p>
                          <p className="text-sm text-amber-800">{analysisResult.allergens.join(", ")}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Button
                        onClick={() => setAnalysisResult(null)}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleConfirmAndLog}
                        disabled={logMealMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        {logMealMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Logging...
                          </>
                        ) : (
                          "Confirm & Log"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
