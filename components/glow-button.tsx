"use client"

import Link from "next/link"
import type { ReactNode } from "react"

interface GlowButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  variant?: "primary" | "secondary"
  className?: string
  disabled?: boolean
  type?: "button" | "submit"
}

export function GlowButton({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: GlowButtonProps) {
  const baseStyles = `
    relative px-8 py-3 rounded-full font-semibold text-base
    transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const variantStyles = {
    primary: `
      bg-primary text-white
      hover:bg-primary-light hover:shadow-lg glow-soft hover:scale-105
    `,
    secondary: `
      bg-surface border border-border text-foreground
      hover:bg-surface-hover transition-transform
      glow-soft hover:scale-105
    `,
  }

  const buttonClass = `${baseStyles} ${variantStyles[variant]} ${className}`

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={buttonClass}>
      {children}
    </button>
  )
}
