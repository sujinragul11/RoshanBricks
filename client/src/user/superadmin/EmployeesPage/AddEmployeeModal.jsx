import React, { useState } from "react";
import Button from "../../../components/ui/Button";

const AddEmployeeModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    status: "Available",
    salary: "",
    image: null, // store File object
  });

  const [preview, setPreview] = useState(null); // Fixed: Added preview state variable
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  

  // Fixed: Added the missing handleImageUpload function
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic validation
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!form.role.trim()) {
      setError('Role is required');
      return;
    }

    const newEmployee = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      role: form.role.trim(),
      status: form.status,
      salary: parseFloat(form.salary) || 0,
      image: form.image
        ? URL.createObjectURL(form.image)
        : "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=800&auto=format&fit=crop", // default avatar
    };

    try {
      await onAdd(newEmployee);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to add employee');
      // Modal stays open so user can fix the error
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-0 transform transition-all overflow-hidden">
        {/* Header */}
        <div className="bg-[#F08344] px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Add New Employee</h3>
          <p className="text-white/90 text-sm mt-1">Fill in the details below to add a new employee</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-l-4 border-red-400">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter employee name"
              value={form.name}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Role</label>
            <input
              type="text"
              name="role"
              placeholder="Enter job role"
              value={form.role}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none"
              required
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
            <input
              type="number"
              name="salary"
              placeholder="Enter salary amount"
              value={form.salary}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 text-sm outline-none bg-white"
            >
              <option>Available</option>
              <option>On Job</option>
              <option>Unavailable</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <input
              type="file"
              name="image" // Fixed: Added name attribute
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm text-gray-500 border-2 border-gray-200 focus:border-[#F08344] focus:ring-2 focus:ring-[#F08344]/20 rounded-lg px-4 py-3 outline-none bg-white" // Fixed: Removed duplicate classes
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Upload photo or leave blank for default avatar
            </p>
            {/* Fixed: Use preview state instead of form.image for display */}
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-2 h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              />
            )}
          </div>

          {/* Actions */}
         <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
  <Button 
    type="button" 
    variant="primary" 
    onClick={onClose} 
    className="px-6 py-2.5 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
  >
    Cancel
  </Button>
  <Button 
    type="submit" 
    variant="primary" 
    className="px-6 py-2.5 bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500"
  >
    Add Employee
  </Button>
</div>
</form>
</div>
</div>
);
};

export default AddEmployeeModal;
