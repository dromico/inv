"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConstructionHatIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  animate?: boolean;
}

export function ConstructionHatIcon({
  className,
  size = 64,
  animate = true,
  ...props
}: ConstructionHatIconProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-black dark:text-white", className)}
      initial={animate ? { y: -5, opacity: 0.8 } : undefined}
      animate={animate ? { y: 0, opacity: 1 } : undefined}
      transition={animate ? { 
        y: { 
          duration: 1.5, 
          repeat: Infinity, 
          repeatType: "reverse", 
          ease: "easeInOut" 
        },
        opacity: { 
          duration: 1.5, 
          repeat: Infinity, 
          repeatType: "reverse", 
          ease: "easeInOut" 
        }
      } : undefined}
      {...props}
    >
      {/* Main Hat Body */}
      <motion.path
        d="M8 40C8 40 16 32 32 32C48 32 56 40 56 40V44H8V40Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 1, delay: 0.2 } : undefined}
      />
      
      {/* Hat Brim */}
      <motion.path
        d="M4 44H60C60 44 56 52 32 52C8 52 4 44 4 44Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 1, delay: 0.4 } : undefined}
      />
      
      {/* Hat Stripe */}
      <motion.path
        d="M32 32V24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 0.5, delay: 0.6 } : undefined}
      />
      
      {/* Hat Top */}
      <motion.path
        d="M24 24H40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 0.5, delay: 0.8 } : undefined}
      />
    </motion.svg>
  );
}
