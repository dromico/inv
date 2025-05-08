"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface ShimmerButtonProps extends ButtonProps {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children: React.ReactNode;
}

export function ShimmerButton({
  shimmerColor = "rgba(255, 255, 255, 0.4)",
  shimmerSize = "0.05em",
  borderRadius = "0.5rem",
  shimmerDuration = "3s",
  background = "rgba(0, 0, 0, 1)",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <Button
      className={cn(
        "relative inline-flex h-10 items-center justify-center overflow-hidden whitespace-nowrap px-6 py-2 font-medium transition-all duration-300",
        className
      )}
      style={{
        borderRadius,
        background,
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{
          WebkitMask: `radial-gradient(${shimmerSize} circle at left, transparent 100%, black 100%) 0 0 / 200% 100%, radial-gradient(${shimmerSize} circle at right, transparent 0%, black 100%) 100% 0 / 200% 100%`,
          mask: `radial-gradient(${shimmerSize} circle at left, transparent 100%, black 100%) 0 0 / 200% 100%, radial-gradient(${shimmerSize} circle at right, transparent 0%, black 100%) 100% 0 / 200% 100%`,
          WebkitMaskComposite: "source-in",
          maskComposite: "source-in",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          animation: `shimmer ${shimmerDuration} infinite`,
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
            transform: "translateX(-100%)",
            animation: `shimmer ${shimmerDuration} infinite`,
          }}
        />
      </span>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Button>
  );
}
