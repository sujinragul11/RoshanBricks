import React, { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";

const AddManufacturerModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",
    businessAddress: "",
    websiteUrl: "",
    contact: {
      phone: "",
      email: "",
      website: "",
      address: "",
    },

    companyInfo: {
      employees: "",
      annualTurnover: "",
      exportCountries: "",
    },
    founders: [{ name: "", experience: "", qualification: "" }],
    specializations: "",
    achievements: "",
    certifications: "",
    description: "",
    established: "",
    location: "",
    rating: "",
    image: "",
    products: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFounderChange = (index, field, value) => {
    const newFounders = [...formData.founders];
    newFounders[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      founders: newFounders,
    }));
  };

  const handleProductChange = (product) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter((p) => p !== product)
        : [...prev.products, product],
    }));
  };

  const addFounder = () => {
    setFormData((prev) => ({
      ...prev,
      founders: [
        ...prev.founders,
        { name: "", experience: "", qualification: "" },
      ],
    }));
  };

  const removeFounder = (index) => {
    setFormData((prev) => ({
      ...prev,
      founders: prev.founders.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    console.log("Validating form with data:", formData);

    // Required fields validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    // Email validation
    if (
      formData.contact.email &&
      !/\S+@\S+\.\S+/.test(formData.contact.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (basic)
    if (
      formData.contact.phone &&
      !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.contact.phone)
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // GST validation (basic Indian GST format)
    if (
      formData.gstNumber &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.gstNumber
      )
    ) {
      newErrors.gstNumber = "Please enter a valid GST number";
    }

    // PAN validation (Indian PAN format)
    if (
      formData.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)
    ) {
      newErrors.panNumber = "Please enter a valid PAN number";
    }

    // Rating validation
    if (
      formData.rating &&
      (parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5)
    ) {
      newErrors.rating = "Rating must be between 0 and 5";
    }

    // Established year validation
    if (
      formData.established &&
      (parseInt(formData.established) < 1800 ||
        parseInt(formData.established) > new Date().getFullYear())
    ) {
      newErrors.established = "Please enter a valid year";
    }

    setErrors(newErrors);
    console.log("Validation errors:", newErrors);
    console.log("Validation result:", Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log("handleSubmit called"); // Added log to confirm function call
    e.preventDefault();

    console.log("Form data:", formData);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    console.log("Form validation passed");

    setLoading(true);

    try {
      const payload = {
        ...formData,
        companyInfo: {
          ...formData.companyInfo,
          employees: formData.companyInfo.employees
            ? parseInt(formData.companyInfo.employees)
            : undefined,
          exportCountries: formData.companyInfo.exportCountries
            ? parseInt(formData.companyInfo.exportCountries)
            : undefined,
        },
        established: formData.established
          ? parseInt(formData.established)
          : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        specializations: formData.specializations
          ? formData.specializations
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
        achievements: formData.achievements
          ? formData.achievements
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
        certifications: formData.certifications
          ? formData.certifications
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
        founders: formData.founders.filter((f) => f.name.trim()),
        // userId: 1, // Remove this to let backend create system user automatically
        productIds: formData.products, // Map products array to productIds for backend
      };

      console.log("Payload to submit:", payload);
      console.log("Calling onSubmit function...");

      await onSubmit(payload);

      console.log("onSubmit completed successfully");

      // Reset form on success
      setFormData({
        companyName: "",
        businessType: "",
        gstNumber: "",
        panNumber: "",
        businessAddress: "",
        websiteUrl: "",
        contact: {
          phone: "",
          email: "",
          website: "",
          address: "",
        },
        companyInfo: {
          employees: "",
          annualTurnover: "",
          exportCountries: "",
        },
        founders: [{ name: "", experience: "", qualification: "" }],
        specializations: "",
        achievements: "",
        certifications: "",
        description: "",
        established: "",
        location: "",
        rating: "",
        image: "",
        products: [],
      });
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: error.message || "Failed to add manufacturer" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-orange-700">Add New Manufacturer</span>}
    >
      <hr className="border-orange-300" />
      <br />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-150 overflow-y-auto"
      >
        {errors.submit && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
            {errors.companyName && (
              <p className="text-orange-600 text-sm mt-1">
                {errors.companyName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Business Type
            </label>
            <input
              type="text"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
        </div>

        {/* GST and PAN */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700">
              PAN Number
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
        </div>

        {/* Address and Website */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Business Address
            </label>
            <textarea
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Website URL
            </label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-orange-300 pt-4">
          <h3 className="text-lg font-medium text-orange-900 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Phone
              </label>
              <input
                type="tel"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Email
              </label>
              <input
                type="email"
                name="contact.email"
                value={formData.contact.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-orange-700">
              Address
            </label>
            <textarea
              name="contact.address"
              value={formData.contact.address}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
        </div>

        {/* Company Info */}
        <div className="border-t border-orange-300 pt-4">
          <h3 className="text-lg font-medium text-orange-900 mb-4">
            Company Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Employees
              </label>
              <input
                type="number"
                name="companyInfo.employees"
                value={formData.companyInfo.employees}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Annual Turnover
              </label>
              <input
                type="text"
                name="companyInfo.annualTurnover"
                value={formData.companyInfo.annualTurnover}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Export Countries
              </label>
              <input
                type="number"
                name="companyInfo.exportCountries"
                value={formData.companyInfo.exportCountries}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Founders */}
        <div className="border-t border-orange-300 pt-4">
          <h3 className="text-lg font-medium text-orange-900 mb-4">Founders</h3>
          {formData.founders.map((founder, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-orange-700">
                  Name
                </label>
                <input
                  type="text"
                  value={founder.name}
                  onChange={(e) =>
                    handleFounderChange(index, "name", e.target.value)
                  }
                  className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-700">
                  Experience
                </label>
                <input
                  type="text"
                  value={founder.experience}
                  onChange={(e) =>
                    handleFounderChange(index, "experience", e.target.value)
                  }
                  className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-700">
                  Qualification
                </label>
                <input
                  type="text"
                  value={founder.qualification}
                  onChange={(e) =>
                    handleFounderChange(index, "qualification", e.target.value)
                  }
                  className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeFounder(index)}
                  className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFounder}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Add Founder
          </button>
          <hr className="mt-6 border-orange-300" />
        </div>

        {/* Arrays */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Specializations (comma separated)
            </label>
            <input
              type="text"
              name="specializations"
              value={formData.specializations}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Achievements (comma separated)
            </label>
            <input
              type="text"
              name="achievements"
              value={formData.achievements}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Certifications (comma separated)
            </label>
            <input
              type="text"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
            />
          </div>
        </div>

        {/* Other fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
               
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Established Year
              </label>
              <input
                type="number"
                name="established"
                value={formData.established}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"

              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
              {errors.location && (
                <p className="text-orange-600 text-sm mt-1">
                  {errors.location}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Rating
              </label>
              <input
                type="number"
                step="0.1"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-700">
                Image URL
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="mt-1 block w-full border border-orange-300 rounded-md shadow-sm p-2 focus:border-orange-500 focus:ring focus:ring-orange-200 text-orange-700 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="bg-red-500 text-white hover:bg-red-600"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-orange-500 text-white hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Manufacturer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddManufacturerModal;
