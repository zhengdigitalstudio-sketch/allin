'use client'

import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  keyProp: string
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export function PageTransition({ children, keyProp }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}