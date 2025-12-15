import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileSearch, Brain, CheckCircle, Sparkles } from "lucide-react";

interface AnalysisProgressProps {
  isAnalyzing: boolean;
}

const stages = [
  { label: "Reading documents", icon: FileSearch },
  { label: "Analyzing skills", icon: Brain },
  { label: "Matching requirements", icon: Sparkles },
  { label: "Generating insights", icon: CheckCircle },
];

export function AnalysisProgress({ isAnalyzing }: AnalysisProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 100);

    // Stage advancement
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= stages.length - 1) return prev;
        return prev + 1;
      });
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress bar */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
      </div>

      {/* Stages */}
      <div className="grid grid-cols-4 gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStage;
          const isComplete = index < currentStage;

          return (
            <div
              key={stage.label}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-500",
                isActive && "bg-primary/10 scale-105",
                isComplete && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full transition-all duration-500",
                  isActive && "bg-primary text-primary-foreground animate-pulse",
                  isComplete && "bg-accent text-accent-foreground",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center transition-colors duration-300",
                  isActive && "text-primary",
                  isComplete && "text-accent",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current stage text */}
      <p className="text-center text-sm text-muted-foreground animate-pulse">
        {stages[currentStage].label}...
      </p>
    </div>
  );
}
