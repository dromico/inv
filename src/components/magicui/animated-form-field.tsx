"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function AnimatedFormField({
  children,
  className,
  index = 0,
  ...props
}: AnimatedFormFieldProps) {
  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: 0.1 + (index * 0.05),
        ease: "easeOut"
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
