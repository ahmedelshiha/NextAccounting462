import React, { createContext, useContext, useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const PopoverContext = createContext<{open:boolean; setOpen:(v:boolean)=>void}|undefined>(undefined)

function Popover({ children, defaultOpen = false }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<boolean>(defaultOpen)
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div data-slot="popover" className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({ children }: { children: React.ReactNode }) {
  const ctx = useContext(PopoverContext)
  if (!ctx) return <>{children}</>
  const { open, setOpen } = ctx
  const child = React.Children.only(children) as React.ReactElement
  return React.cloneElement(child, {
    onClick: (e: any) => {
      setOpen(!open)
      if (typeof child.props.onClick === "function") child.props.onClick(e)
    }
  })
}

function PopoverContent({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ctx = useContext(PopoverContext)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ctx || !ref.current) return
      if (!ref.current.contains(e.target as Node)) ctx.setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [ctx])
  if (!ctx) return <>{children}</>
  if (!ctx.open) return null
  return (
    <div
      ref={ref}
      data-slot="popover-content"
      className={cn("z-50 rounded-md border bg-popover p-1 shadow-md absolute right-0 mt-1", className)}
      style={style}
      role="dialog"
    >
      {children}
    </div>
  )
}

function PopoverArrow() {
  return <div data-slot="popover-arrow" className="h-2 w-2 rotate-45 bg-popover absolute right-3 -top-1 shadow-sm" />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow }
