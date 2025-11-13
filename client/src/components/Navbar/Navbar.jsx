import { Menu, PanelLeftClose, PanelLeftOpen, Bell, Search, Settings, LogOut, User } from 'lucide-react'
import { getCurrentUser, logout } from '../../lib/auth'
import { getCurrentUserActiveRole } from '../../lib/roles'
import Button from '../ui/Button'
import { useState, useEffect } from 'react'

export default function Navbar({ onToggleSidebar, onToggleDesktopSidebar, isDesktopSidebarCollapsed }) {
  const user = getCurrentUser()
  const [activeRole, setActiveRole] = useState(() => getCurrentUserActiveRole())

  useEffect(() => {
    const handleRoleChange = () => {
      const newActiveRole = getCurrentUserActiveRole()
      if (newActiveRole !== activeRole) setActiveRole(newActiveRole)
    }
    window.addEventListener('storage', handleRoleChange)
    return () => window.removeEventListener('storage', handleRoleChange)
  }, [activeRole])

  // Get user data from localStorage for name display
  const currentUser = JSON.parse(localStorage.getItem('rt_user') || '{}')

  const getRoleDisplayName = (role) => {
    const roleNames = {
      superadmin: 'Super Admin',
      agent: 'Agent',
      manufacturer: 'Manufacturer',
      truckowner: 'Truck Owner',
      driver: 'Driver'
    }
    return roleNames[role] || role
  }

  const getUserInitials = () => {
    // For Super Admin, always show "SA"
    if (activeRole === 'superadmin') {
      return 'SA'
    }

    // For regular users, show their name initials
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
    }
    if (currentUser.firstName) {
      return currentUser.firstName.charAt(0).toUpperCase()
    }
    return getRoleDisplayName(activeRole).charAt(0).toUpperCase()
  }

  const getUserDisplayName = () => {
    // For Super Admin, always show "Super Admin"
    if (activeRole === 'superadmin') {
      return 'Super Admin'
    }

    // For regular users, show their display name if available, otherwise fallback to firstName + lastName
    if (currentUser.displayName) {
      return currentUser.displayName
    }
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`
    }
    if (currentUser.firstName) {
      return currentUser.firstName
    }
    return getRoleDisplayName(activeRole)
  }

  const getDisplayRole = () => {
    // For Super Admin, you can show empty or specific text
    if (activeRole === 'superadmin') {
      return 'Administrator' // or leave empty if you prefer
    }
    return getRoleDisplayName(activeRole)
  }

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          onClick={onToggleSidebar}
          aria-label="Toggle mobile menu"
        >
          <Menu className="size-4 sm:size-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          className={`hidden md:block p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors ${isDesktopSidebarCollapsed ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
            }`}
          onClick={onToggleDesktopSidebar}
          aria-label="Toggle sidebar"
        >
          {isDesktopSidebarCollapsed ? (
            <PanelLeftOpen className="size-4 sm:size-5" />
          ) : (
            <PanelLeftClose className="size-4 sm:size-5" />
          )}
        </button>

        {/* Page Title - Hidden on very small screens */}
        <div className="hidden sm:block">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-500 -mt-0.5 sm:-mt-1 truncate">Welcome back to your workspace</p>
        </div>

        {/* Mobile Page Title - Only on very small screens */}
        <div className="block sm:hidden">
          <h2 className="text-base font-bold text-slate-900">Dashboard</h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Search Button (Mobile & Tablet) */}
        <button className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
          <Search className="size-4 sm:size-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
          <Bell className="size-4 sm:size-5" />
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
          </span>
        </button>

        {/* Settings - Hidden on small screens */}
        <button className="hidden md:block p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors">
          <Settings className="size-4 sm:size-5" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          {/* User Details - Hidden on mobile */}
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-slate-900 truncate max-w-24 lg:max-w-32">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-slate-500 -mt-0.5 truncate max-w-24 lg:max-w-32">
              {getDisplayRole()}
            </p>
          </div>

          {/* User Avatar */}
          <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm ${activeRole === 'superadmin'
            ? 'bg-gradient-to-br from-purple-600 to-purple-700'
            : 'bg-gradient-to-br from-blue-600 to-blue-700'
            }`}>
            {getUserInitials()}
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="primary"
          className="ml-1 sm:ml-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 font-medium px-2 sm:px-4 py-1.5 sm:py-2 text-sm"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">
            <LogOut className="size-4" />
          </span>
        </Button>
      </div>
    </header>
  )
}