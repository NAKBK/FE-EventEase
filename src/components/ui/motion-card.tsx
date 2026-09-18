"use client";

import React, { createContext, useContext } from "react";
import { HTMLMotionProps, motion, useReducedMotion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const MotionCardGroupContext = createContext(false);

const groupVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.075,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

type MotionOptions = {
  interactive?: boolean;
  lift?: boolean;
};

type MotionCardGridProps = HTMLMotionProps<"div">;

export function MotionCardGrid({ className, children, ...props }: MotionCardGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionCardGroupContext.Provider value>
      <motion.div
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.12 }}
        variants={groupVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </MotionCardGroupContext.Provider>
  );
}

function useCardAnimation(interactive: boolean, lift: boolean) {
  const grouped = useContext(MotionCardGroupContext);
  const reduceMotion = useReducedMotion();

  return {
    initial: reduceMotion || grouped ? undefined : "hidden",
    whileInView: reduceMotion || grouped ? undefined : "visible",
    viewport: { once: true, amount: 0.18 },
    variants: reduceMotion ? undefined : cardVariants,
    whileHover: reduceMotion || !lift ? undefined : { y: -6, scale: 1.012 },
    whileTap: reduceMotion || !interactive ? undefined : { scale: 0.985, y: -2 },
    transition: { type: "spring" as const, stiffness: 360, damping: 28, mass: 0.7 },
  };
}

const baseClassName =
  "group/ee-card transform-gpu motion-safe:transition-[box-shadow,border-color] motion-safe:duration-300 hover:shadow-md";

export function MotionCard({
  className,
  children,
  interactive = false,
  lift = true,
  ...props
}: HTMLMotionProps<"div"> & MotionOptions) {
  const animation = useCardAnimation(interactive, lift);

  return (
    <motion.div className={cn(baseClassName, className)} {...animation} {...props}>
      {children}
    </motion.div>
  );
}

export function MotionArticle({
  className,
  children,
  interactive = false,
  lift = true,
  ...props
}: HTMLMotionProps<"article"> & MotionOptions) {
  const animation = useCardAnimation(interactive, lift);

  return (
    <motion.article className={cn(baseClassName, className)} {...animation} {...props}>
      {children}
    </motion.article>
  );
}

export function MotionSection({
  className,
  children,
  interactive = false,
  lift = true,
  ...props
}: HTMLMotionProps<"section"> & MotionOptions) {
  const animation = useCardAnimation(interactive, lift);

  return (
    <motion.section className={cn(baseClassName, className)} {...animation} {...props}>
      {children}
    </motion.section>
  );
}

export function MotionAside({
  className,
  children,
  interactive = false,
  lift = true,
  ...props
}: HTMLMotionProps<"aside"> & MotionOptions) {
  const animation = useCardAnimation(interactive, lift);

  return (
    <motion.aside className={cn(baseClassName, className)} {...animation} {...props}>
      {children}
    </motion.aside>
  );
}

export function MotionForm({
  className,
  children,
  lift = true,
  ...props
}: HTMLMotionProps<"form"> & Omit<MotionOptions, "interactive">) {
  const animation = useCardAnimation(false, lift);

  return (
    <motion.form className={cn(baseClassName, className)} {...animation} {...props}>
      {children}
    </motion.form>
  );
}

export function MotionCardButton({
  className,
  children,
  lift = true,
  ...props
}: HTMLMotionProps<"button"> & Omit<MotionOptions, "interactive">) {
  const animation = useCardAnimation(true, lift);

  return (
    <motion.button className={cn(baseClassName, "cursor-pointer", className)} {...animation} {...props}>
      {children}
    </motion.button>
  );
}

export function MotionCardLabel({
  className,
  children,
  lift = true,
  ...props
}: HTMLMotionProps<"label"> & Omit<MotionOptions, "interactive">) {
  const animation = useCardAnimation(true, lift);

  return (
    <motion.label className={cn(baseClassName, "cursor-pointer", className)} {...animation} {...props}>
      {children}
    </motion.label>
  );
}
