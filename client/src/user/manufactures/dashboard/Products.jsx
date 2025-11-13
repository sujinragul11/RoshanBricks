import React, { useState, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FilterBar from '../../../components/ui/FilterBar'
import { Card } from '../../../components/ui/Card'
import { Package, Plus, Trash2, Edit, Eye, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../Context/AuthContext'

const API_BASE_URL = 'http://localhost:7700/api'

export default function ProductsPage() {
  const { currentUser } = useAuth()
  const [products, setProducts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addForm, setAddForm] = useState({
    name: '',
    priceAmount: '',
    description: '',
    image: '',
    stockQuantity: '',
    category: 'General'
  })
  const [editForm, setEditForm] = useState({
    name: '',
    priceAmount: '',
    description: '',
    image: '',
    stockQuantity: '',
    category: 'General'
  })
  const [addErrors, setAddErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch products on component mount and when user changes
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 useEffect: Current user ID changed to:', currentUser.id)
      fetchProducts()
    } else {
      console.log('🔄 useEffect: No current user ID')
      setProducts([])
    }
  }, [currentUser?.id])

  const fetchProducts = async () => {
    if (!currentUser?.id) {
      console.log('❌ fetchProducts: No user ID found')
      return
    }

    console.log('🔄 fetchProducts: Fetching for user ID:', currentUser.id)
      console.log('🔄 fetchProducts: API URL:', `${API_BASE_URL}/manufacturer-products/user/${currentUser.id}`)

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/manufacturer-products/user/${currentUser.id}`)
      
      console.log('📡 fetchProducts: Response status:', response.status)
      console.log('📡 fetchProducts: Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ fetchProducts: Products fetched successfully:', data)
        console.log('✅ fetchProducts: Number of products:', data.length)
        setProducts(data)
      } else {
        console.error('❌ fetchProducts: Failed to fetch products, status:', response.status)
        const errorText = await response.text()
        console.error('❌ fetchProducts: Error response:', errorText)
        setProducts([])
      }
    } catch (error) {
      console.error('🚨 fetchProducts: Network error:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (form) => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Product name is required'
    if (!form.priceAmount || form.priceAmount <= 0) errors.priceAmount = 'Valid price is required'
    if (!form.stockQuantity || form.stockQuantity < 0) errors.stockQuantity = 'Valid stock quantity is required'
    if (!form.description.trim()) errors.description = 'Description is required'
    if (!form.image.trim()) errors.image = 'Image URL is required'
    
    if (form.stockQuantity > 2147483647) {
      errors.stockQuantity = 'Stock quantity is too large. Maximum allowed: 2,147,483,647'
    }
    
    return errors
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validateForm(addForm)
    if (Object.keys(newErrors).length > 0) {
      setAddErrors(newErrors)
      return
    }

    try {
      const payload = {
        manufacturerId: currentUser?.id,
        name: addForm.name,
        category: addForm.category,
        priceAmount: parseFloat(addForm.priceAmount),
        imageUrl: addForm.image,
        stockQuantity: parseInt(addForm.stockQuantity),
        description: addForm.description,
      }

      console.log('🔄 handleAddSubmit: Sending payload:', payload)

      const response = await fetch(`${API_BASE_URL}/manufacturer-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newProduct = await response.json()
        console.log('✅ handleAddSubmit: Product added successfully:', newProduct)
        setProducts((prev) => [...prev, newProduct])
        setShowAddModal(false)
        setAddForm({
          name: '',
          priceAmount: '',
          description: '',
          image: '',
          stockQuantity: '',
          category: 'General'
        })
        setAddErrors({})
        alert('✅ Product added successfully!')
      } else {
        const errorText = await response.text()
        console.error('❌ handleAddSubmit: API Error:', errorText)
        alert(`❌ Failed to add product: ${errorText}`)
      }
      } catch (error) {
        console.error('🚨 handleAddSubmit: Network Error:', error)
        alert(`❌ Error adding product: ${error.message}`)
      }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validateForm(editForm)
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors)
      return
    }

    try {
      const payload = {
        name: editForm.name,
        category: editForm.category,
        priceAmount: parseFloat(editForm.priceAmount),
        imageUrl: editForm.image,
        stockQuantity: parseInt(editForm.stockQuantity),
        description: editForm.description,
      }

      console.log('🔄 handleEditSubmit: Updating product:', selectedProduct.id, 'Payload:', payload)

      const response = await fetch(`${API_BASE_URL}/manufacturer-products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        console.log('✅ handleEditSubmit: Product updated successfully:', updatedProduct)
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p))
        setShowEditModal(false)
        setSelectedProduct(null)
        setEditErrors({})
        alert('✅ Product updated successfully!')
      } else {
        const errorText = await response.text()
        console.error('❌ handleEditSubmit: API Error:', errorText)
        alert(`❌ Failed to update product: ${errorText}`)
      }
      } catch (error) {
        console.error('🚨 handleEditSubmit: Network Error:', error)
        alert(`❌ Error updating product: ${error.message}`)
      }
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('🔄 handleDelete: Deleting product ID:', productId)
        const response = await fetch(`${API_BASE_URL}/manufacturer-products/${productId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          console.log('✅ handleDelete: Product deleted successfully')
          setProducts((prev) => prev.filter((p) => p.id !== productId))
          alert('✅ Product deleted successfully!')
        } else {
          console.error('❌ handleDelete: Failed to delete product')
          alert('❌ Failed to delete product.')
        }
      } catch (error) {
        console.error('🚨 handleDelete: Network error:', error)
        alert('❌ Error deleting product.')
      }
    }
  }

  const handleEdit = (product) => {
    console.log('🔄 handleEdit: Editing product:', product)
    setSelectedProduct(product)
    setEditForm({
      name: product.name || '',
      priceAmount: product.priceAmount || product.priceRange || '',
      description: product.description || '',
      image: product.imageUrl || product.image || '',
      stockQuantity: product.stockQuantity || '',
      category: product.category || 'General'
    })
    setShowEditModal(true)
  }

  const handleView = (product) => {
    console.log('🔄 handleView: Viewing product:', product)
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Package className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
              <p className="text-slate-600">Manage your product inventory</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchProducts}
              variant="outline"
              className="border-[#F08344] text-[#F08344] hover:bg-[#F08344] hover:text-white"
            >
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#F08344] hover:bg-[#e0733a] text-white"
            >
              <Plus className="size-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search products..."
      />

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F08344] mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col h-full">
                <img
                  src={product.imageUrl || product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                  }}
                />
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{product.name}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-2">{product.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xl font-bold text-[#F08344]">
                    ₹{product.priceAmount || product.priceRange || 'N/A'}
                  </p>
                  <p className={`text-sm font-medium ${
                    product.stockQuantity > 10 ? 'text-green-600' : 
                    product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Stock: {product.stockQuantity || 0}
                  </p>
                </div>
                <p className="text-sm text-slate-500 mb-4">Category: {product.category || 'General'}</p>
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => handleView(product)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="size-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No products yet</h3>
          <p className="text-slate-600 mb-4">Add your first product to get started</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#F08344] hover:bg-[#e0733a] text-white"
          >
            Add Product
          </Button>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setAddErrors({})
        }}
        title="Add New Product"
        className="max-w-2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  addErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {addErrors.name && <p className="text-red-500 text-sm mt-1">{addErrors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Price (₹) *</label>
              <input
                type="number"
                value={addForm.priceAmount}
                onChange={(e) => setAddForm({ ...addForm, priceAmount: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  addErrors.priceAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
              {addErrors.priceAmount && <p className="text-red-500 text-sm mt-1">{addErrors.priceAmount}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Stock Quantity *</label>
              <input
                type="number"
                value={addForm.stockQuantity}
                onChange={(e) => setAddForm({ ...addForm, stockQuantity: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  addErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter stock quantity"
                min="0"
                max="2147483647"
              />
              {addErrors.stockQuantity && <p className="text-red-500 text-sm mt-1">{addErrors.stockQuantity}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="General">General</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Construction">Construction</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <textarea
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  addErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows="3"
                placeholder="Enter product description"
              />
              {addErrors.description && <p className="text-red-500 text-sm mt-1">{addErrors.description}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Image URL *</label>
              <input
                type="url"
                value={addForm.image}
                onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  addErrors.image ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              />
              {addErrors.image && <p className="text-red-500 text-sm mt-1">{addErrors.image}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowAddModal(false)
                setAddErrors({})
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F08344] hover:bg-[#e0733a] text-white px-6 py-2 rounded-lg"
            >
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditErrors({})
        }}
        title="Edit Product"
        className="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  editErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {editErrors.name && <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Price (₹) *</label>
              <input
                type="number"
                value={editForm.priceAmount}
                onChange={(e) => setEditForm({ ...editForm, priceAmount: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  editErrors.priceAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
              {editErrors.priceAmount && <p className="text-red-500 text-sm mt-1">{editErrors.priceAmount}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Stock Quantity *</label>
              <input
                type="number"
                value={editForm.stockQuantity}
                onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  editErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter stock quantity"
                min="0"
                max="2147483647"
              />
              {editErrors.stockQuantity && <p className="text-red-500 text-sm mt-1">{editErrors.stockQuantity}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="General">General</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
                <option value="Construction">Construction</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  editErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows="3"
                placeholder="Enter product description"
              />
              {editErrors.description && <p className="text-red-500 text-sm mt-1">{editErrors.description}</p>}
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Image URL *</label>
              <input
                type="url"
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  editErrors.image ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter image URL"
              />
              {editErrors.image && <p className="text-red-500 text-sm mt-1">{editErrors.image}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false)
                setEditErrors({})
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F08344] hover:bg-[#e0733a] text-white px-6 py-2 rounded-lg"
            >
              Update Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Product Details"
        className="max-w-2xl"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={selectedProduct.imageUrl || selectedProduct.image}
                alt={selectedProduct.name}
                className="w-64 h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Product Name</label>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Price</label>
                <p className="text-lg font-bold text-[#F08344]">
                  ₹{selectedProduct.priceAmount || selectedProduct.priceRange || 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                <p className={`text-lg font-semibold ${
                  selectedProduct.stockQuantity > 10 ? 'text-green-600' : 
                  selectedProduct.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedProduct.stockQuantity || 0}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-lg font-semibold">{selectedProduct.category || 'General'}</p>
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-lg">{selectedProduct.description}</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => setShowViewModal(false)}
                className="bg-[#F08344] hover:bg-[#e0733a] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}