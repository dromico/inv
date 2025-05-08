"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
  shineColor?: string | string[];
  borderWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ShineBorder({
  duration = 14,
  shineColor = ["#ffffff", "#7b68ee", "#4169e1"],
  borderWidth = 1,
  className,
  style,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor : [shineColor];
  const gradientColors = colors.map((color) => `${color}`).join(", ");

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          inset: `-${borderWidth * 4}px`,
          borderRadius: "inherit",
          background: `conic-gradient(from 0deg, transparent 0%, ${gradientColors}, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-[1px] rounded-[inherit] bg-background"
        style={{
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
