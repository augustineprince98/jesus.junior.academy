import * as React from "react"

import { cn } from "@/lib/utils"

interface DialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
}

const DialogTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => children

const DialogContent = ({ children }: { children: React.ReactNode }) => children

const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>

const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold">{children}</h2>

const DialogDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-600">{children}</p>

const DialogFooter = ({ children }: { children: React.ReactNode }) => <div className="mt-4 flex justify-end space-x-2">{children}</div>

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
