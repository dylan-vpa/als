import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
    completedSteps: boolean[];
    onStepClick?: (step: number) => void;
}

export default function StepIndicator({
    steps,
    currentStep,
    completedSteps,
    onStepClick
}: StepIndicatorProps) {
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="mb-8">
            {/* Barra de progreso */}
            <div className="relative h-2 bg-border rounded-full mb-6 overflow-hidden">
                <div
                    className="absolute h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Indicadores de pasos */}
            <div className="flex justify-between items-start">
                {steps.map((label, index) => {
                    const isCompleted = completedSteps[index];
                    const isCurrent = index === currentStep;
                    const isClickable = onStepClick && (isCompleted || index < currentStep);

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1"
                            onClick={() => isClickable && onStepClick(index)}
                        >
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                  ${isCurrent ? 'bg-primary text-white scale-110 shadow-lg' : ''}
                  ${isCompleted && !isCurrent ? 'bg-green-500 text-white' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                `}
                            >
                                {isCompleted && !isCurrent ? (
                                    <Check size={20} />
                                ) : (
                                    <span className="font-semibold">{index + 1}</span>
                                )}
                            </div>
                            <span
                                className={`
                  text-xs text-center font-medium transition-colors
                  ${isCurrent ? 'text-primary' : ''}
                  ${isCompleted && !isCurrent ? 'text-green-600' : ''}
                  ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                `}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
