import * as React from "react"

import { cn } from "@/lib/utils"

interface AlertDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange?.(false)}>
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
}

const AlertDialogTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => children

const AlertDialogContent = ({ children }: { children: React.ReactNode }) => children

const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>

const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold">{children}</h2>

const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-600">{children}</p>

const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => <div className="mt-4 flex justify-end space-x-2">{children}</div>

const AlertDialogAction = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <button onClick={onClick} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
    {children}
  </button>
)

const AlertDialogCancel = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <button onClick={onClick} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
    {children}
  </button>
)

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
