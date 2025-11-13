import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { loginUser, isAuthenticated } from "../../../lib/auth";
import Button from "../../../components/ui/Button";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { truck3, white } from "../../../../public/lottie/lottie";
import {
  User,
  Factory,
  Wrench,
  Phone,
  Key,
  Loader2,
  Truck,
} from "lucide-react";

const API_BASE_URL = "http://localhost:7700/api";

export default function UserLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(""); // Default phone number
  const [otp, setOtp] = useState(""); // Default OTP
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userData, setUserData] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // If in role selection mode, handle role selection
    if (showRoleSelection) {
      if (!selectedRole) {
        setError("Please select a role to continue");
        return;
      }

      // Update user info with selected role
      const currentUser = JSON.parse(localStorage.getItem("rt_user") || "{}");
      localStorage.setItem(
        "rt_user",
        JSON.stringify({
          ...currentUser,
          selectedRole: selectedRole,
          activeRole: selectedRole,
        })
      );

      // Redirect based on selected role
      if (selectedRole === "agent") {
        navigate("/agents/dashboard");
      } else if (selectedRole === "manufacturer") {
        navigate("/manufacturers/dashboard");
      } else if (selectedRole === "truckowner") {
        navigate("/truck-owners/dashboard");
      } else if (selectedRole === "driver") {
        navigate("/drivers/dashboard");
      } else {
        navigate("/");
      }
      return;
    }

    // Initial login flow
    if (!phone || !otp) {
      setError("Please enter both mobile number and OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check user status and get employee details if needed
      const statusResponse = await fetch(
        `${API_BASE_URL}/admins/check-user-status/${phone}`
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to check user status");
      }

      const userStatus = await statusResponse.json();

      if (!userStatus.exists) {
        setError(userStatus.message);
        setIsLoading(false);
        return;
      }

      if (userStatus.status !== "APPROVED") {
        setError(userStatus.message);
        setIsLoading(false);
        return;
      }

      // For truck owners, fetch employee ID - with improved error handling
      let employeeId = null;
      const approvedUser = userStatus.user;
      const userRoles = Array.isArray(approvedUser.roles)
        ? approvedUser.roles
        : [approvedUser.roles];
      const normalizedUserRoles = userRoles.map((role) =>
        role.toLowerCase().replace(" ", "")
      );

      if (normalizedUserRoles.includes("truckowner")) {
        try {
          const empResponse = await fetch(
            `${API_BASE_URL}/employees/by-phone?phone=${encodeURIComponent(
              phone
            )}&role=Truck%20Owner`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (empResponse.ok) {
            const empData = await empResponse.json();
            employeeId = empData.id;
          } else if (empResponse.status === 404) {
            // Employee record not found - this might be expected for some truck owners
            console.warn(
              "Employee record not found for truck owner, continuing login..."
            );
            employeeId = null;
          } else {
            throw new Error(`HTTP error! status: ${empResponse.status}`);
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
          // Don't block login for truck owners if employee details fail
          // Just log the error and continue with null employeeId
          employeeId = null;
        }
      }

      // User is approved, proceed with login

      // Handle both single role (string) and multiple roles (array)

      // If user has multiple roles, authenticate first then show role selection
      if (normalizedUserRoles.length > 1) {
        // Authenticate the user
        const res = await loginUser({
          phone,
          otp,
          selectedRoles: normalizedUserRoles,
          userData: approvedUser,
        });

        if (!res.success) {
          setError(res.error || "Login failed");
          setIsLoading(false);
          return;
        }

        // Store user info with appropriate display name based on user type
        let displayName = approvedUser.name || "Unknown";
        if (
          approvedUser.userType === "Manufacturer" &&
          approvedUser.companyName
        ) {
          displayName = approvedUser.companyName;
        } else if (
          approvedUser.userType === "Agent" &&
          approvedUser.agentCode
        ) {
          displayName = `${approvedUser.name} (${approvedUser.agentCode})`;
        }

        const currentUser = JSON.parse(localStorage.getItem("rt_user") || "{}");
        localStorage.setItem("rt_user", JSON.stringify({
          ...currentUser,
          name: displayName,
          displayName: displayName,
        }));

        // Show role selection after successful login
        setUserData(approvedUser);
        setAvailableRoles(normalizedUserRoles);
        setShowRoleSelection(true);
        setIsLoading(false);
        return;
      }

      // Single role user - proceed with login
      const res = await loginUser({
        phone,
        otp,
        selectedRoles: normalizedUserRoles,
        userData: approvedUser,
      });

      if (!res.success) {
        setError(res.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store user info with appropriate display name based on user type
      let displayName = approvedUser.name || "Unknown";
      if (
        approvedUser.userType === "Manufacturer" &&
        approvedUser.companyName
      ) {
        displayName = approvedUser.companyName;
      } else if (approvedUser.userType === "Agent" && approvedUser.agentCode) {
        displayName = `${approvedUser.name} (${approvedUser.agentCode})`;
      }

      // Store user data in rt_user key with employee ID if available
      localStorage.setItem(
        "rt_user",
        JSON.stringify({
          id: approvedUser.id,
          employeeId: employeeId || approvedUser.employeeId || null,
          roles: normalizedUserRoles,
          activeRole: normalizedUserRoles[0],
          phone: approvedUser.phone,
          email: approvedUser.email,
          name: displayName,
          displayName: displayName,
          userType: approvedUser.userType,
        })
      );

      // Redirect based on role
      const firstRole = normalizedUserRoles[0];
      if (firstRole === "agent") {
        navigate("/agents/dashboard");
      } else if (firstRole === "manufacturer") {
        navigate("/manufacturers/dashboard");
      } else if (firstRole === "truckowner") {
        navigate("/truck-owners/dashboard");
      } else if (firstRole === "driver") {
        navigate("/drivers/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  }

  const handleSignUp = () => {
    navigate("/signup");
  };

  const userTypes = [
    { value: "agent", label: "Agent", icon: <User className="w-5 h-5" /> },
    {
      value: "manufacturer",
      label: "Manufacturer",
      icon: <Factory className="w-5 h-5" />,
    },
    {
      value: "truckowner",
      label: "Truck Owner",
      icon: <Truck className="w-5 h-5" />,
    },
    { value: "driver", label: "Driver", icon: <Wrench className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center relative ">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 w-200">
        <div className="flex rounded-2xl border bg-white shadow-xl overflow-hidden">
          <div className="flex flex-col justify-between rounded-l-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
            <div className="items-center gap- mt-10 ml-5">
              <img src={white} alt="Roshan Traders" className="h-13 w-35" />
            </div>
            <DotLottieReact
              src={truck3}
              loop
              autoplay
              style={{ width: 260, height: 260 }}
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-6 ">
              <h1 className="text-2xl font-semibold tracking-tight text-center mr-3">
                User Login
              </h1>
              <p className="mt-1 text-sm text-gray-600 text-center">
                Login with approved account only
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {showRoleSelection && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {userTypes
                      .filter((type) => availableRoles.includes(type.value))
                      .map((type) => {
                        const isSelected = selectedRole === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedRole(type.value)}
                            className={`flex flex-col items-center justify-center h-16 rounded-xl border text-sm font-medium transition-all relative ${isSelected
                                ? "bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                              }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {type.icon}
                              <span className="text-xs">{type.label}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  {selectedRole && (
                    <p className="text-xs text-indigo-600 mt-2">
                      Selected:{" "}
                      {userTypes.find((t) => t.value === selectedRole)?.label}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile number
                </label>
                <div className="relative flex rounded-xl border bg-white focus-within:ring-2 focus-within:ring-indigo-200">
                  <span className="px-3 inline-flex items-center text-gray-500 border-r select-none">
                    +91
                  </span>
                  <Phone className="absolute left-16 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      const newPhone = e.target.value;
                      setPhone(newPhone);
                      setShowRoleSelection(false);
                      setSelectedRole("");
                      setError("");
                    }}
                    className="w-full pl-12 pr-3 py-2 rounded-r-xl outline-none placeholder:text-gray-400"
                    placeholder="Enter registered mobile number"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use the phone number you registered with
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl border pl-10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 placeholder:text-gray-400"
                    placeholder="Enter OTP"
                    required
                  />
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter any OTP (demo purpose)
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-[15px] flex items-center justify-center gap-2 cursor-pointer transition duration-200"
                  disabled={isLoading || (showRoleSelection && !selectedRole)}
                >
                  {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
                  {isLoading
                    ? "Logging in..."
                    : showRoleSelection
                      ? "Continue"
                      : "Login"}
                </Button>
              </div>

              <div className="mt-6 text-center text-sm">
                <p>
                  Not a member?{" "}
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="text-indigo-600 font-semibold hover:underline hover:text-indigo-700 cursor-pointer"
                  >
                    Sign up now
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Your account needs admin approval before you can login
                </p>
              </div>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                <strong>Note:</strong> Only approved accounts can login. Check
                your email/SMS for approval notification.
              </p>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              By continuing you agree to our{" "}
              <span className="underline underline-offset-2">Terms</span> and{" "}
              <span className="underline underline-offset-2">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
