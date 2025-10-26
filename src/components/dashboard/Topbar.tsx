'use client'

'use client'

import { useState } from 'react'
import { Search, Bell, Settings, User, ChevronDown, HelpCircle } from 'lucide-react'

export default function Topbar() {
  const [open, setOpen] = useState<'none' | 'notifications' | 'profile'>('none')
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen('none')
  }
  return (
    <header className="bg-background border-b border-border px-6 py-3" onKeyDown={onKeyDown}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg">
            <span className="font-medium text-foreground">Accounting Firm</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground">Accountant tools</button>
        </div>
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className="w-full pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground" placeholder="Search transactions, clients, bookings..." />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-muted-foreground hover:text-foreground"><HelpCircle className="w-5 h-5" /></button>
          <div className="relative">
            <button
              aria-haspopup="menu"
              aria-expanded={open === 'notifications'}
              onClick={() => setOpen((v) => (v === 'notifications' ? 'none' : 'notifications'))}
              className="relative p-2 text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {open === 'notifications' && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover rounded-lg shadow-lg border border-border py-2 z-50 text-sm text-popover-foreground" role="menu" aria-label="Notifications">
                <div className="px-4 pb-2 font-medium">Notifications</div>
                <div className="px-4 py-6 text-center text-muted-foreground">No new notifications</div>
              </div>
            )}
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground"><Settings className="w-5 h-5" /></button>
          <div className="relative">
            <button
              aria-haspopup="menu"
              aria-expanded={open === 'profile'}
              onClick={() => setOpen((v) => (v === 'profile' ? 'none' : 'profile'))}
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full grid place-items-center"><User className="w-4 h-4 text-white" /></div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {open === 'profile' && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50" role="menu" aria-label="Profile">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-popover-foreground">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@example.com</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted">Profile Settings</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
