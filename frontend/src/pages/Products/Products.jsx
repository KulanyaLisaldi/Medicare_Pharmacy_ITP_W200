import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

// Local assets for common products
import ImgParacetamol from '../../assets/paracetamol.jpg'
import ImgMetformin from '../../assets/metformin.jpg'
import ImgAmoxicillin from '../../assets/Amoxcillin.jpg'
import ImgSalbutamol from '../../assets/salbutamol_inhaler.jpg'
import ImgFolicAcid from '../../assets/FOLIC-ACID.webp'
import ImgAllermine from '../../assets/Allermine.jpg'
import ImgOmeprazole from '../../assets/omeprazole.jpg'
import ImgDefault from '../../assets/illustration.jpg'

// Resolve a sensible image for a product using uploaded images first, then local assets
function getProductImage(product) {
	if (!product) return ImgDefault
	
	// First priority: Use uploaded product image if available
	if (product.image && product.image.trim() !== '') {
		return product.image
	}
	
	// Second priority: Use local assets based on product name/brand
	const name = `${product.name || ''} ${product.brand || ''}`.toLowerCase()

	if (name.includes('paracetamol') || name.includes('acetaminophen')) return ImgParacetamol
	if (name.includes('metformin')) return ImgMetformin
	if (name.includes('amoxicillin') || name.includes('amoxcillin')) return ImgAmoxicillin
	if (name.includes('salbutamol') || name.includes('inhaler')) return ImgSalbutamol
	if (name.includes('folic')) return ImgFolicAcid
	if (name.includes('allermine') || name.includes('cetirizine') || name.includes('antihistamine')) return ImgAllermine
    if (name.includes('omeprazole') || name.includes('prilosec')) return ImgOmeprazole

	// Fallback to default image
	return ImgDefault
}

const Products = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const load = async (query = '') => {
    try {
      const res = await fetch(`http://localhost:5001/api/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load products')
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Refresh products when cart is updated (to show updated stock)
  useEffect(() => {
    const handleCartUpdate = () => {
      // Show a brief loading state to indicate stock is being updated
      setLoading(true)
      load()
    }
    
    window.addEventListener('cart:update', handleCartUpdate)
    window.addEventListener('order:placed', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cart:update', handleCartUpdate)
      window.removeEventListener('order:placed', handleCartUpdate)
    }
  }, [])

  const { user } = useAuth()
  const navigate = useNavigate()

  const addToCart = async (p) => {
    if (!user) {
      navigate('/login')
      return
    }
    
    // Check if product is available (considering reserved stock)
    const availableStock = (p.stock ?? 0) - (p.reservedStock ?? 0)
    if (availableStock <= 0) {
      alert('This product is currently out of stock and cannot be added to cart.')
      return
    }
    
    const raw = localStorage.getItem('cart')
    const cart = raw ? JSON.parse(raw) : []
    const idx = cart.findIndex(i => i._id === p._id)
    
    let quantityToReserve = 1
    if (idx >= 0) {
      // Check if adding one more would exceed available stock
      const currentQuantity = cart[idx].quantity || 1
      const newQuantity = currentQuantity + 1
      if (newQuantity > availableStock) {
        alert(`Cannot add more items. Only ${availableStock} units available in stock.`)
        return
      }
      quantityToReserve = 1 // Only reserve the additional quantity
    }
    
    try {
      // Reserve stock immediately when adding to cart
      const response = await fetch('http://localhost:5001/api/orders/reserve-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: p._id,
          quantity: quantityToReserve
        })
      })
      
      const data = await response.json()
      if (!response.ok) {
        alert(data.message || 'Failed to reserve stock')
        return
      }
      
      // Update cart after successful stock reservation
      if (idx >= 0) {
        cart[idx].quantity = cart[idx].quantity + 1
      } else {
        cart.push({ _id: p._id, name: p.name, price: p.price, quantity: 1 })
      }
      
      localStorage.setItem('cart', JSON.stringify(cart))
      // notify navbar to update badge and refresh products
      window.dispatchEvent(new Event('cart:update'))
      window.dispatchEvent(new Event('order:placed'))
      
    } catch (error) {
      alert('Failed to add item to cart. Please try again.')
      console.error('Add to cart error:', error)
    }
  }

  const activeCategory = searchParams.get('category') || ''

  const groupedByCategory = useMemo(() => {
    const groups = items.reduce((acc, p) => {
      const key = p.category || 'Uncategorized'
      if (!acc[key]) acc[key] = []
      acc[key].push(p)
      return acc
    }, {})
    return groups
  }, [items])

  const categoryOptions = useMemo(() => {
    return Object.keys(groupedByCategory)
  }, [groupedByCategory])

  const filteredItemsByCategory = useMemo(() => {
    if (!activeCategory) return items
    return items.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase())
  }, [items, activeCategory])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            {activeCategory && (
              <div className="text-gray-500 text-lg mb-2"> {activeCategory}</div>
            )}
            <div className="flex justify-center">
              <div className="flex gap-2 flex-wrap justify-center">
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) setSearchParams({ category: v })
                    else setSearchParams({})
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-0 focus:border-gray-400 appearance-none bg-white cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search medicines or products..."
                  className="border border-gray-300 rounded-lg px-3 py-2 w-80 max-w-full focus:outline-none focus:ring-0 focus:border-gray-400"
                />
                <button onClick={() => { setLoading(true); load(q); }} className="btn-primary">Search</button>
                <Link 
                  to="/upload-prescription" 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  
                  Order with Prescription
                </Link>
              </div>
            </div>
          </div>

          {loading && <div className="py-20 text-center text-gray-600">Loading...</div>}
          {error && <div className="py-4 px-3 mb-4 rounded bg-red-50 text-red-700 text-center">{error}</div>}

          {!loading && !error && (
            items.length === 0 ? (
              <div className="py-20 text-center text-gray-600">No products found</div>
            ) : (
              activeCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredItemsByCategory.map(p => (
                    <ProductCard key={p._id} p={p} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(groupedByCategory).map(([category, prods]) => (
                    <div key={category} className="category-block">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-gray-900">{category}</h2>
                        <Link to={`/?`} className="hidden" />
                        <Link
                          to={`/products?category=${encodeURIComponent(category)}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View All →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {prods.slice(0, 6).map(p => (
                          <ProductCard key={p._id} p={p} addToCart={addToCart} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Products


function ProductCard({ p, addToCart }) {
  const inStock = (p.stock ?? 0) > 0
  const availableStock = (p.stock ?? 0) - (p.reservedStock ?? 0)
  const isAvailable = availableStock > 0
  // Get product image (prioritizes uploaded images over assets)
  const imageSrc = getProductImage(p)
  
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden max-w-xs mx-auto w-full">
      <div className="p-4">
        {/* Image placeholder */}
        {imageSrc ? (
          <img src={imageSrc} alt={p.name} className="w-full h-28 object-cover rounded mb-2" />
        ) : (
          <div className="w-full h-28 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-base font-semibold text-gray-900 mb-0.5 line-clamp-1">{p.name}</div>
            <div className="text-xs text-gray-600">{p.brand || '-'}</div>
          </div>
          {p.prescriptionRequired && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-50 text-red-700 text-[10px] px-2 py-0.5 border border-red-200">Prescription Required</span>
          )}
        </div>
        {p.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</div>}
        
        {/* Tags */}
        {p.tags && p.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {tag}
              </span>
            ))}
            {p.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                +{p.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-700 mt-2">
          <div><span className="text-gray-500">Form:</span> {p.dosageForm || '-'}</div>
          <div><span className="text-gray-500">Strength:</span> {p.strength || '-'}</div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-blue-600 font-medium text-sm">Rs.{Number(p.price ?? 0).toFixed(2)}</div>
          <div className={`text-[11px] ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {isAvailable ? `In Stock (${availableStock})` : 'Out of Stock'}
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button disabled={!isAvailable} onClick={() => addToCart(p)} className={`rounded-lg px-2.5 py-1 text-xs border ${isAvailable ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}>
            {isAvailable ? 'Add to cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
