import { NavLink, useNavigate } from 'react-router-dom'; // ✅ Add this import at the top
import {
  Factory, Building2, Store, UserRound, UserCheck, Users, LogOut, X,
  TrendingUp, FileText, CreditCard, Package, LayoutDashboard, ShoppingCart,
  DollarSign, User, BarChart3, Truck, Gift, File
} from 'lucide-react';
import { logout } from '../../lib/auth';
import { getCurrentUserRole, getCurrentUserRoles, getCurrentUserActiveRole, setCurrentUserActiveRole } from '../../lib/roles';
import Button from '../ui/Button';
import { useState, useEffect } from 'react';

const black = '/lottie/Roshan_black.png';

const linkBase = "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200 group relative";
const active = ({ isActive }) =>
  isActive
    ? `${linkBase} bg-[#F08344] text-white shadow-lg shadow-[#F08344]/25`
    : `${linkBase} text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm`;

const MENU_CONFIG = {
  superadmin: [
    { to: '/dashboard/home', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/manufacturers', label: 'Manufacturers', icon: Factory },
    { to: '/dashboard/agents', label: 'Agents', icon: UserRound },
    // { to: '/dashboard/companies', label: 'Companies', icon: Building2 },
    { to: '/dashboard/employees', label: 'Employees', icon: Gift },
    { to: '/dashboard/acting-labours', label: 'Acting Labours', icon: Users },
    { to: '/dashboard/products', label: 'Products', icon: Package },
    // { to: '/dashboard/users', label: 'Users', icon: Users },
    { to: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/dashboard/paymentreports', label: 'Payment Reports', icon: CreditCard },
    { to: '/dashboard/report', label: 'Reports', icon: FileText },
    { to: '/dashboard/signup-approval', label: 'SignUp Approval', icon: UserCheck },
    // { to : '/dashboard/product-stock', label: 'Product Stock', icon: Store },
    { to: '/dashboard/project-requirement', label: 'PRD', icon: File },
  ],
  agent: [
    { to: '/dashboard/agent-dashboard', label: 'Dashboard', icon: TrendingUp },
    { to: '/dashboard/agent-products', label: 'Products', icon: Package },
    { to: '/dashboard/agent-orders', label: 'My Orders', icon: ShoppingCart },
    { to: '/dashboard/agent-payment-report', label: 'Payment Report', icon: DollarSign },
    { to: '/dashboard/agent-profile', label: 'Profile', icon: User },
    { to: '/dashboard/agent-reports', label: 'Reports', icon: BarChart3 },
  ],
  manufacturer: [
    { to: '/dashboard/manufacturer-dashboard', label: 'Dashboard', icon: TrendingUp },
    { to: '/dashboard/manufacturer-products', label: 'Products', icon: Package },
    { to: '/dashboard/manufacturer-orders', label: 'Customer Orders', icon: ShoppingCart },
    { to: '/dashboard/manufacturer-employees', label: 'Employees', icon: Gift },
    { to: '/dashboard/manufacturer-payments', label: 'Payments', icon: DollarSign },
    { to: '/dashboard/manufacturer-reports', label: 'Reports', icon: BarChart3 },
    { to: '/dashboard/manufacturer-profile', label: 'Profile', icon: User },
  ],
  truckowner: [
    { to: '/dashboard/truck-owners', label: 'Dashboard', icon: Truck },
    { to: '/dashboard/truck-owners/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/dashboard/truck-owners/driver-management', label: 'Driver Management', icon: Users },
    { to: '/dashboard/truck-owners/truck-management', label: 'Truck Management', icon: Truck },
    { to: '/dashboard/truck-owners/trips', label: 'Trips', icon: Package },
    { to: '/dashboard/truck-owners/payments', label: 'Payments', icon: DollarSign },
    { to: '/dashboard/truck-owners/profile', label: 'Profile', icon: User },
  ],
  driver: [
    { to: '/dashboard/drivers', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/drivers/load', label: 'Loads For Delivery', icon: Package },
    { to: '/dashboard/drivers/trip-details', label: 'Delivery Trips', icon: Truck },
    { to: '/dashboard/drivers/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/dashboard/drivers/profile', label: 'Profile', icon: User },
  ],
};

export default function Sidebar({ isCollapsed, onClose, mobile }) {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(() => getCurrentUserActiveRole() || 'guest');
  const userRoles = getCurrentUserRoles() || [];

  useEffect(() => {
    const handleRoleChange = () => {
      const newActiveRole = getCurrentUserActiveRole() || 'guest';
      if (newActiveRole !== activeRole) setActiveRole(newActiveRole);
    };
    window.addEventListener('storage', handleRoleChange);
    return () => window.removeEventListener('storage', handleRoleChange);
  }, [activeRole]);

  const menu = MENU_CONFIG[activeRole] || [];

  const handleRoleSwitch = (role) => {
    setCurrentUserActiveRole(role);
    setActiveRole(role);
    // Navigate to the appropriate dashboard for the new role without page refresh
    const dashboardRoutes = {
      agent: '/dashboard/agent-dashboard',
      manufacturer: '/dashboard/manufacturer-dashboard',
      truckowner: '/dashboard/truck-owners',
      driver: '/dashboard/drivers'
    };
    const route = dashboardRoutes[role] || '/';
    navigate(route);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          ${mobile
            ? 'fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col shadow-2xl transform transition-transform duration-300 md:hidden'
            : `h-screen bg-white border-r border-slate-200 sticky top-0 hidden md:flex flex-col transition-all duration-300 shadow-sm ${isCollapsed ? 'w-16 lg:w-20' : 'w-64 lg:w-72'}`
          }
        `}
      >
        {/* Header */}
        <div
          className={`h-14 sm:h-16 border-b border-slate-200 flex items-center px-3 sm:px-6 bg-gradient-to-r from-slate-50 to-white ${isCollapsed && !mobile ? 'justify-center' : 'justify-between'}`}
        >
          <div className={`flex items-center gap-2 sm:gap-3 ${isCollapsed && !mobile ? 'justify-center' : ''}`}>
            {(!isCollapsed || mobile) && (
              <div>
                <img src={black} alt="Roshan Traders" className="h-10 w-35" />
              </div>
            )}
          </div>
          {(mobile || (!isCollapsed && onClose)) && (
            <button
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="size-4 sm:size-5" />
            </button>
          )}
        </div>

        {/* Role Switcher */}
        {userRoles.length > 1 && (!isCollapsed || mobile) && (
          <div className="px-3 sm:px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <p className="text-xs font-medium text-slate-600 mb-2">Switch Role</p>
            <div className="flex flex-wrap gap-2">
              {userRoles.map((role) => {
                const roleLabels = {
                  agent: 'Agent',
                  manufacturer: 'Manufacturer',
                  truckOwner: 'Truck Owner',
                  driver: 'Driver'
                };
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${isActive
                      ? 'bg-[#F08344] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                  >
                    {roleLabels[role] || role}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={`flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto ${isCollapsed && !mobile ? 'flex flex-col items-center' : ''}`}
        >
          {menu.map((item) => {
            const Icon = item.icon;
            if (item.label === 'PRD') {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={active}
                  onClick={mobile ? onClose : undefined}
                  end
                >
                  <Icon className="size-4 sm:size-5 flex-shrink-0" />
                  {(!isCollapsed || mobile) && (
                    <span className="group-hover:translate-x-0.5 transition-transform truncate">
                      {item.label}
                    </span>
                  )}
                  {(!isCollapsed || mobile) && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                    </div>
                  )}
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={active}
                onClick={mobile ? onClose : undefined}
                end
              >
                <Icon className="size-4 sm:size-5 flex-shrink-0" />
                {(!isCollapsed || mobile) && (
                  <span className="group-hover:translate-x-0.5 transition-transform truncate">
                    {item.label}
                  </span>
                )}
                {(!isCollapsed || mobile) && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div
          className={`p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 ${isCollapsed && !mobile ? 'flex justify-center' : ''}`}
        >
          <Button
            variant="primary"
            className={`w-full flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 font-medium text-sm ${isCollapsed && !mobile ? 'justify-center px-2 py-2' : 'px-3 sm:px-4 py-2 sm:py-2.5'}`}
            onClick={() => {
              logout();
              window.location.href = '/user/login';
            }}
          >
            <LogOut className="size-4 flex-shrink-0" />
            {(!isCollapsed || mobile) && <span className="truncate">Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}