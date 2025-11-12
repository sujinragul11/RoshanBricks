import React, { useState, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Edit, Trash2, Truck, Plus } from 'lucide-react'
import { getCurrentUser } from '../../../lib/auth'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:7700/api'

export default function TruckManagement() {
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Get headers for API calls - FIXED: Include required headers for auth middleware
  const getHeaders = () => {
    const user = getCurrentUser();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add development headers that your auth middleware requires
    headers['X-Employee-Id'] = user?.employeeId || '1'; // Required by your auth middleware
    headers['X-User-Roles'] = 'Truck Owner'; // Required by your auth middleware
    
    // Add authorization if you have token-based auth
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/truck-owners/trucks`, {
          headers: getHeaders()
        })

        console.log('Trucks response status:', response.status);

        if (response.status === 401) {
          throw new Error('Unauthorized access');
        }

        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Access forbidden - check your headers');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch trucks`);
        }

        const data = await response.json();
        if (data.success) {
          setTrucks(data.data);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to fetch trucks');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching trucks:', err);
        setTrucks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrucks();
  }, [navigate])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTruck, setEditingTruck] = useState(null)
  const [viewingTruck, setViewingTruck] = useState(null)
  const [formData, setFormData] = useState({
    truckNo: '',
    type: '',
    capacity: '',
    rcDetails: '',
    status: 'Active',
    rcFile: null,
    insuranceFile: null,
    fitnessFile: null,
    registrationYear: new Date().getFullYear(),
    chassisNumber: '',
    engineNumber: '',
    fuelType: 'Diesel',
    insuranceNumber: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    permitExpiry: '',
    nextService: ''
  })

  const handleAdd = () => {
    setEditingTruck(null)
    setFormData({ 
      truckNo: '', 
      type: '', 
      capacity: '', 
      rcDetails: '', 
      status: 'Active', 
      rcFile: null, 
      insuranceFile: null, 
      fitnessFile: null,
      registrationYear: new Date().getFullYear(),
      chassisNumber: '',
      engineNumber: '',
      fuelType: 'Diesel',
      insuranceNumber: '',
      insuranceExpiry: '',
      fitnessExpiry: '',
      permitExpiry: '',
      nextService: ''
    })
    setIsModalOpen(true)
  }

  const handleEdit = (truck) => {
    setEditingTruck(truck)
    setFormData({ 
      truckNo: truck.truckNo,
      type: truck.type,
      capacity: truck.capacity,
      rcDetails: truck.rcDetails || '',
      status: truck.status,
      rcFile: null,
      insuranceFile: null,
      fitnessFile: null,
      registrationYear: truck.registrationYear || new Date().getFullYear(),
      chassisNumber: truck.chassisNumber || '',
      engineNumber: truck.engineNumber || '',
      fuelType: truck.fuelType || 'Diesel',
      insuranceNumber: truck.insuranceNumber || '',
      insuranceExpiry: truck.insuranceExpiry || '',
      fitnessExpiry: truck.fitnessExpiry || '',
      permitExpiry: truck.permitExpiry || '',
      nextService: truck.nextService || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/truck-owners/trucks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete truck');
      }

      const result = await response.json();
      if (result.success) {
        setTrucks(trucks.filter(truck => truck.id !== id));
      } else {
        throw new Error(result.message || 'Failed to delete truck');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting truck:', err);
    }
  }

  const handleView = (truck) => {
    setViewingTruck(truck);
  }

  const validateTruckNumber = (truckNo) => {
    // Indian vehicle registration number pattern
    const pattern = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
    return pattern.test(truckNo.toUpperCase());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate truck number
    if (!validateTruckNumber(formData.truckNo)) {
      alert('Please enter a valid vehicle registration number (e.g., TN01AB1234)');
      return;
    }

    try {
      const truckData = {
        truckNo: formData.truckNo.toUpperCase(),
        type: formData.type,
        capacity: formData.capacity,
        rcDetails: formData.rcDetails,
        status: formData.status,
        registrationYear: parseInt(formData.registrationYear),
        chassisNumber: formData.chassisNumber || null,
        engineNumber: formData.engineNumber || null,
        fuelType: formData.fuelType,
        insuranceNumber: formData.insuranceNumber || null,
        insuranceExpiry: formData.insuranceExpiry || null,
        fitnessExpiry: formData.fitnessExpiry || null,
        permitExpiry: formData.permitExpiry || null,
        nextService: formData.nextService || null
      };

      const url = editingTruck 
        ? `${API_BASE_URL}/truck-owners/trucks/${editingTruck.id}`
        : `${API_BASE_URL}/truck-owners/trucks`;

      const method = editingTruck ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(truckData)
      });

      console.log('Save truck response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingTruck ? 'update' : 'create'} truck`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (editingTruck) {
          setTrucks(trucks.map(truck => truck.id === editingTruck.id ? data.data : truck));
        } else {
          setTrucks([...trucks, data.data]);
        }
        
        setIsModalOpen(false);
        setError(null);
      } else {
        throw new Error(data.message || `Failed to ${editingTruck ? 'update' : 'create'} truck`);
      }

    } catch (err) {
      setError(err.message);
      console.error(`Error ${editingTruck ? 'updating' : 'creating'} truck:`, err);
    }
  }

  const [currentTruckId, setCurrentTruckId] = useState(null);

  const fileInputRefs = {
    'RC Book': React.createRef(),
    'Insurance': React.createRef(),
    'Fitness Certificate': React.createRef()
  };

  const handleUploadClick = async (truckId, docType) => {
    setCurrentTruckId(truckId);
    if (fileInputRefs[docType] && fileInputRefs[docType].current) {
      fileInputRefs[docType].current.click();
    }
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (file && currentTruckId) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 
          docType === 'RC Book' ? 'RC_BOOK' :
          docType === 'Insurance' ? 'INSURANCE' :
          'FITNESS_CERTIFICATE'
        );

        const response = await fetch(`${API_BASE_URL}/truck-owners/trucks/${currentTruckId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            // Note: Don't set Content-Type for FormData, let browser set it
          },
          body: formData
        });

        if (response.ok) {
          // Update local state to show document is uploaded
          setTrucks(trucks.map(truck =>
            truck.id === currentTruckId ? { 
              ...truck, 
              [`${docType.toLowerCase().replace(' ', '')}File`]: 'Uploaded'
            } : truck
          ));
          alert(`${docType} uploaded successfully`);
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.error('Error uploading document:', err);
        alert('Upload failed. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading trucks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center">
              <Truck className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Truck Management</h1>
              <p className="text-slate-600">Manage your fleet of trucks</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="bg-[#F08344] hover:bg-[#e07334]">
            <Plus className="size-4 mr-2" />
            Add Truck
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRefs['RC Book']}
        onChange={(e) => handleFileChange(e, 'RC Book')}
        style={{ display: 'none' }}
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <input
        type="file"
        ref={fileInputRefs['Insurance']}
        onChange={(e) => handleFileChange(e, 'Insurance')}
        style={{ display: 'none' }}
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <input
        type="file"
        ref={fileInputRefs['Fitness Certificate']}
        onChange={(e) => handleFileChange(e, 'Fitness Certificate')}
        style={{ display: 'none' }}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Trucks List as Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Next Service</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trucks.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  No trucks found. Add your first truck to get started.
                </td>
              </tr>
            ) : trucks.map((truck) => (
              <tr key={truck.id}>
                <td className="px-6 py-4 whitespace-nowrap text-center font-medium">{truck.truckNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{truck.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{truck.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{truck.fuelType || 'Diesel'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    truck.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {truck.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {truck.nextService ? formatDate(truck.nextService) : 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex gap-1 justify-center">
                    {['RC Book', 'Insurance', 'Fitness Certificate'].map((docType) => (
                      <button
                        key={docType}
                        onClick={() => handleUploadClick(truck.id, docType)}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                          truck[`${docType.toLowerCase().replace(' ', '')}File`] === 'Uploaded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {docType}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => handleView(truck)} variant="outline" size="sm">
                      View
                    </Button>
                    <Button onClick={() => handleEdit(truck)} variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    <Button onClick={() => handleDelete(truck.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Truck Details Modal */}
      <Modal isOpen={viewingTruck !== null} onClose={() => setViewingTruck(null)}>
        <h2 className="text-xl font-bold mb-4">Truck Details - {viewingTruck?.truckNo}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Type:</strong> {viewingTruck?.type}
          </div>
          <div>
            <strong>Capacity:</strong> {viewingTruck?.capacity}
          </div>
          <div>
            <strong>Fuel Type:</strong> {viewingTruck?.fuelType || 'Diesel'}
          </div>
          <div>
            <strong>Registration Year:</strong> {viewingTruck?.registrationYear}
          </div>
          <div>
            <strong>Chassis Number:</strong> {viewingTruck?.chassisNumber || 'Not set'}
          </div>
          <div>
            <strong>Engine Number:</strong> {viewingTruck?.engineNumber || 'Not set'}
          </div>
          <div>
            <strong>Insurance Expiry:</strong> {viewingTruck?.insuranceExpiry ? formatDate(viewingTruck.insuranceExpiry) : 'Not set'}
          </div>
          <div>
            <strong>Fitness Expiry:</strong> {viewingTruck?.fitnessExpiry ? formatDate(viewingTruck.fitnessExpiry) : 'Not set'}
          </div>
          <div>
            <strong>Permit Expiry:</strong> {viewingTruck?.permitExpiry ? formatDate(viewingTruck.permitExpiry) : 'Not set'}
          </div>
          <div>
            <strong>Next Service:</strong> {viewingTruck?.nextService ? formatDate(viewingTruck.nextService) : 'Not set'}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setViewingTruck(null)} variant="outline">
            Close
          </Button>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="large">
        <h2 className="text-xl font-bold mb-4">{editingTruck ? 'Edit Truck' : 'Add New Truck'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Truck Number *</label>
              <input
                type="text"
                value={formData.truckNo}
                onChange={(e) => setFormData({ ...formData, truckNo: e.target.value.toUpperCase() })}
                className="w-full p-2 border rounded"
                placeholder="e.g., TN01AB1234"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Type</option>
                <option value="Container Truck">Container Truck</option>
                <option value="Open Truck">Open Truck</option>
                <option value="Trailer">Trailer</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Tanker">Tanker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity *</label>
              <select
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Capacity</option>
                <option value="5 Ton">5 Ton</option>
                <option value="10 Ton">10 Ton</option>
                <option value="15 Ton">15 Ton</option>
                <option value="20 Ton">20 Ton</option>
                <option value="25 Ton">25 Ton</option>
                <option value="30 Ton">30 Ton</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration Year</label>
              <input
                type="number"
                value={formData.registrationYear}
                onChange={(e) => setFormData({ ...formData, registrationYear: e.target.value })}
                className="w-full p-2 border rounded"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">RC Details</label>
              <input
                type="text"
                value={formData.rcDetails}
                onChange={(e) => setFormData({ ...formData, rcDetails: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="RC validity details"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chassis Number</label>
              <input
                type="text"
                value={formData.chassisNumber}
                onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Engine Number</label>
              <input
                type="text"
                value={formData.engineNumber}
                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
              <input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Service</label>
              <input
                type="date"
                value={formData.nextService}
                onChange={(e) => setFormData({ ...formData, nextService: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="col-span-2 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="col-span-2 flex gap-2 justify-end pt-4 border-t">
            <Button type="submit" className="bg-[#F08344] hover:bg-[#e07334]">
              {editingTruck ? 'Update' : 'Add'} Truck
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      
    </div>
  );
}