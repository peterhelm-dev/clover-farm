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

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast.error("No image selected");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Step 1: Upload image to S3
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const uploadResult = await uploadImageMutation.mutateAsync({
          imageData: base64,
          fileName: imageFile.name,
        });

        // Step 2: Analyze image with LLM
        const analysis = await analyzeImageMutation.mutateAsync({
          imageUrl: uploadResult.url,
        });

        setAnalysisResult({
          ...analysis,
          imageUrl: uploadResult.url,
        });
        toast.success("Image analyzed! Review the results below.");
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
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
      onSuccess?.();
    } catch (error) {
      console.error("Log error:", error);
      toast.error("Failed to log meal. Please try again.");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Camera className="w-4 h-4" />
        Log Meal with Photo
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Meal from Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!analysisResult ? (
              <>
                {/* Image Selection */}
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

                {/* Image Preview with Crop/Rotate Controls */}
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
                    
                    {/* Crop/Rotate Controls */}
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

                {/* Hidden file inputs */}
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
                {/* Analysis Results */}
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
