"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShineBorder } from "./shine-border";

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  shineBorderProps?: React.ComponentProps<typeof ShineBorder>;
  hoverEffect?: boolean;
}

export function MagicCard({
  children,
  className,
  shineBorderProps,
  hoverEffect = true,
  ...props
}: MagicCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl bg-background shadow-md dark:shadow-primary/5",
        hoverEffect && "transition-transform duration-300 hover:scale-[1.01]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <ShineBorder
        shineColor={["#ffffff", "#7b68ee", "#4169e1"]}
        duration={10}
        borderWidth={1}
        {...shineBorderProps}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
