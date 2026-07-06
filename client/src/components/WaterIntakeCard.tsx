import { useState } from "react";
import { Droplet, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function WaterIntakeCard() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: dailyData, isLoading } = trpc.water.getDaily.useQuery({});
  const logIntakeMutation = trpc.water.logIntake.useMutation({
    onSuccess: () => {
      utils.water.getDaily.invalidate();
      toast.success("Water logged!");
      setSelectedPreset(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log water");
    },
  });

  const presets = [
    { label: "250ml", value: 250 },
    { label: "500ml", value: 500 },
    { label: "1L", value: 1000 },
  ];

  const handleLogWater = (amount: number) => {
    logIntakeMutation.mutate({ amount });
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            Hydration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const percentage = dailyData?.percentage || 0;
  const totalAmount = dailyData?.totalAmount || 0;
  const goal = dailyData?.goal || 2000;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" />
          Hydration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Circle */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{Math.round(percentage)}%</span>
              <span className="text-xs text-gray-600">{totalAmount}ml / {goal}ml</span>
            </div>
          </div>
        </div>

        {/* Quick Log Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              onClick={() => handleLogWater(preset.value)}
              disabled={logIntakeMutation.isPending}
              variant={selectedPreset === preset.value ? "default" : "outline"}
              size="sm"
              className="text-xs h-11 sm:h-auto min-h-11 sm:min-h-0"
            >
              {logIntakeMutation.isPending ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  {preset.label}
                </>
              )}
            </Button>
          ))}
        </div>

        {/* Goal Status */}
        <div className="text-center text-sm">
          {percentage >= 100 ? (
            <p className="text-green-600 font-medium">✓ Daily goal reached!</p>
          ) : (
            <p className="text-gray-600">
              {goal - totalAmount}ml to go
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
