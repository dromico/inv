"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
}

export function AnimatedButton({
  children,
  className,
  glowEffect = true,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      className={cn(
        "relative",
        glowEffect && "group",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {glowEffect && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/50 to-indigo-500/50 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <Button className="relative z-10" {...props}>
        {children}
      </Button>
    </motion.div>
  );
}
