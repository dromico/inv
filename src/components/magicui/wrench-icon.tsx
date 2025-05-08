"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WrenchIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  animate?: boolean;
}

export function WrenchIcon({
  className,
  size = 64,
  animate = true,
  ...props
}: WrenchIconProps) {
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
      {/* Wrench Head */}
      <motion.path
        d="M44 16C44 11.5817 40.4183 8 36 8C31.5817 8 28 11.5817 28 16C28 16.7 28.1 17.4 28.2 18L16 30.2C15.4 30.1 14.7 30 14 30C9.58172 30 6 33.5817 6 38C6 42.4183 9.58172 46 14 46C18.4183 46 22 42.4183 22 38C22 37.3 21.9 36.6 21.8 36L34 23.8C34.6 23.9 35.3 24 36 24C40.4183 24 44 20.4183 44 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 1, delay: 0.2 } : undefined}
      />
      
      {/* Wrench Handle */}
      <motion.path
        d="M34 30L50 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={animate ? { duration: 0.8, delay: 0.4 } : undefined}
      />
      
      {/* Wrench Detail */}
      <motion.path
        d="M36 16C36 16.5523 35.5523 17 35 17C34.4477 17 34 16.5523 34 16C34 15.4477 34.4477 15 35 15C35.5523 15 36 15.4477 36 16Z"
        fill="currentColor"
        initial={animate ? { scale: 0 } : undefined}
        animate={animate ? { scale: 1 } : undefined}
        transition={animate ? { duration: 0.5, delay: 0.6 } : undefined}
      />
      
      <motion.path
        d="M14 38C14 38.5523 13.5523 39 13 39C12.4477 39 12 38.5523 12 38C12 37.4477 12.4477 37 13 37C13.5523 37 14 37.4477 14 38Z"
        fill="currentColor"
        initial={animate ? { scale: 0 } : undefined}
        animate={animate ? { scale: 1 } : undefined}
        transition={animate ? { duration: 0.5, delay: 0.8 } : undefined}
      />
    </motion.svg>
  );
}
