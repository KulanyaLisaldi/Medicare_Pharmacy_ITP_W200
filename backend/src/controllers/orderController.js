import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { geocodeAddress, generateOrderNumber } from '../utils/geocoding.js'

// Check stock availability for cart items
export const checkStockAvailability = async (req, res) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' })
    }

    const stockCheckResults = []
    let allInStock = true

    for (const item of items) {
      if (!item.productId) {
        stockCheckResults.push({
          productId: null,
          name: item.name,
          requestedQuantity: item.quantity || 1,
          available: false,
          availableStock: 0,
          message: 'Product ID not provided'
        })
        allInStock = false
        continue
      }

      const product = await Product.findById(item.productId)
      if (!product) {
        stockCheckResults.push({
          productId: item.productId,
          name: item.name,
          requestedQuantity: item.quantity || 1,
          available: false,
          availableStock: 0,
          message: 'Product not found'
        })
        allInStock = false
        continue
      }

      const requestedQuantity = Number(item.quantity) || 1
      const availableStock = Number(product.stock) || 0
      const isAvailable = availableStock >= requestedQuantity

      stockCheckResults.push({
        productId: item.productId,
        name: item.name,
        requestedQuantity,
        available: isAvailable,
        availableStock,
        message: isAvailable ? 'Available' : 'Out of Stock'
      })

      if (!isAvailable) {
        allInStock = false
      }
    }

    return res.status(200).json({
      allInStock,
      items: stockCheckResults
    })
  } catch (err) {
    console.error('checkStockAvailability error:', err)
    return res.status(500).json({ message: 'Failed to check stock availability' })
  }
}

export const createOrder = async (req, res) => {
  try {
    const userId = req.userId
    const { items, total, paymentMethod, deliveryType, customer } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' })
    }

    // First, check stock availability for all items
    const stockCheckResults = []
    let allInStock = true

    for (const item of items) {
      if (!item.productId) {
        stockCheckResults.push({
          productId: null,
          name: item.name,
          requestedQuantity: item.quantity || 1,
          available: false,
          availableStock: 0,
          message: 'Product ID not provided'
        })
        allInStock = false
        continue
      }

      const product = await Product.findById(item.productId)
      if (!product) {
        stockCheckResults.push({
          productId: item.productId,
          name: item.name,
          requestedQuantity: item.quantity || 1,
          available: false,
          availableStock: 0,
          message: 'Product not found'
        })
        allInStock = false
        continue
      }

      const requestedQuantity = Number(item.quantity) || 1
      const availableStock = Number(product.stock) || 0
      const isAvailable = availableStock >= requestedQuantity

      stockCheckResults.push({
        productId: item.productId,
        name: item.name,
        requestedQuantity,
        available: isAvailable,
        availableStock,
        message: isAvailable ? 'Available' : 'Out of Stock'
      })

      if (!isAvailable) {
        allInStock = false
      }
    }

    // If any items are out of stock, return error with details
    if (!allInStock) {
      return res.status(400).json({
        message: 'Some items are out of stock',
        stockCheck: {
          allInStock: false,
          items: stockCheckResults
        }
      })
    }

    // All items are in stock, proceed with order creation
    const normalizedItems = items.map(it => ({
      productId: it.productId || null,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      lineTotal: Number(it.price || 0) * Number(it.quantity || 1)
    }))

    const computedTotal = normalizedItems.reduce((s, it) => s + it.lineTotal, 0)

    // Geocode the delivery address
    let deliveryCoordinates = null;
    if (customer?.address && deliveryType === 'home_delivery') {
      try {
        const geocodeResult = await geocodeAddress(customer.address);
        deliveryCoordinates = {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
          address: geocodeResult.formattedAddress || customer.address,
          placeId: geocodeResult.placeId
        };
      } catch (error) {
        console.warn('Failed to geocode address:', error.message);
        // Continue without coordinates if geocoding fails
      }
    }

    // Create the order
    const order = await Order.create({
      user: userId,
      items: normalizedItems,
      total: total != null ? Number(total) : computedTotal,
      paymentMethod: paymentMethod || 'cod',
      deliveryType: deliveryType || 'home_delivery',
      status: 'pending',
      orderNumber: generateOrderNumber(),
      customer: {
        name: customer?.name,
        phone: customer?.phone,
        address: customer?.address,
        notes: customer?.notes || ''
      },
      deliveryCoordinates: deliveryCoordinates
    })

    // Stock is already reserved when items are added to cart
    // No need to reserve again during order creation

    return res.status(201).json(order)
  } catch (err) {
    console.error('createOrder error:', err)
    return res.status(500).json({ message: 'Failed to create order' })
  }
}

export const listDeliveryOrders = async (req, res) => {
  try {
    // Get orders that are assigned for delivery (out_for_delivery status)
    const orders = await Order.find({ 
      status: { $in: ['out_for_delivery', 'picked_up', 'delivered', 'failed'] },
      deliveryType: 'home_delivery'
    })
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })

    return res.status(200).json(orders)
  } catch (err) {
    console.error('listDeliveryOrders error:', err)
    return res.status(500).json({ message: 'Failed to fetch delivery orders' })
  }
}

export const listMyOrders = async (req, res) => {
  try {
    const userId = req.userId
    // Only return product orders, not prescription orders
    const orders = await Order.find({ 
      user: userId,
      orderType: { $ne: 'prescription' } // Exclude prescription orders
    }).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (err) {
    console.error('listMyOrders error:', err)
    return res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const listAllOrders = async (_req, res) => {
  try {
    // Only return product orders, not prescription orders
    const orders = await Order.find({ 
      orderType: { $ne: 'prescription' } // Exclude prescription orders
    }).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (err) {
    console.error('listAllOrders error:', err)
    return res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    return res.json(order)
  } catch (err) {
    console.error('getOrderById error:', err)
    return res.status(500).json({ message: 'Failed to fetch order' })
  }
}

export const updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, pharmacistNotes, items } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (status) order.status = status
    if (paymentStatus) order.paymentStatus = paymentStatus
    if (typeof pharmacistNotes === 'string') order.pharmacistNotes = pharmacistNotes
    if (Array.isArray(items)) {
      // update OOS flags or suggestions per index
      items.forEach((incoming, idx) => {
        if (!order.items[idx]) return
        if (typeof incoming.outOfStock === 'boolean') order.items[idx].outOfStock = incoming.outOfStock
        if (typeof incoming.alternativeSuggestion === 'string') order.items[idx].alternativeSuggestion = incoming.alternativeSuggestion
      })
    }

    await order.save()
    return res.json(order)
  } catch (err) {
    console.error('updateOrder error:', err)
    return res.status(500).json({ message: 'Failed to update order' })
  }
}

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Only allow cancellation if order is still pending
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' })
    }

    // Release reserved stock back to available stock
    for (const it of order.items) {
      if (it.productId) {
        const product = await Product.findById(it.productId)
        if (product) {
          // Release reserved stock back to available stock
          const newReservedStock = Math.max(0, (product.reservedStock || 0) - (it.quantity || 1))
          product.reservedStock = newReservedStock
          await product.save()
        }
      }
    }

    // Update order status
    order.status = 'canceled'
    await order.save()
    
    return res.json({ message: 'Order cancelled successfully', order })
  } catch (err) {
    console.error('cancelOrder error:', err)
    return res.status(500).json({ message: 'Failed to cancel order' })
  }
}

export const confirmPreparation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Handle different order types
    const itemsToProcess = order.orderType === 'prescription' ? order.orderList : order.items

    // Deduct actual stock and clear reservations for all items
    for (const it of itemsToProcess) {
      if (it.productId && !it.outOfStock) {
        const product = await Product.findById(it.productId)
        if (product) {
          // Decrement actual stock
          const newStock = Math.max(0, (product.stock || 0) - (it.quantity || 1))
          // Clear reserved stock for this order
          const newReservedStock = Math.max(0, (product.reservedStock || 0) - (it.quantity || 1))
          
          product.stock = newStock
          product.reservedStock = newReservedStock
          await product.save()
        }
      }
    }

    // Set status depending on delivery type
    order.status = order.deliveryType === 'pickup' ? 'ready' : 'out_for_delivery'
    await order.save()
    return res.json(order)
  } catch (err) {
    console.error('confirmPreparation error:', err)
    return res.status(500).json({ message: 'Failed to confirm preparation' })
  }
}

// Delete order (customer only, pending status only)
// Reserve stock when adding items to cart
export const reserveStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body
    
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' })
    }
    
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    const requestedQuantity = Number(quantity)
    const availableStock = (product.stock || 0) - (product.reservedStock || 0)
    
    if (availableStock < requestedQuantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock available',
        availableStock,
        requestedQuantity
      })
    }
    
    // Reserve the stock
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { reservedStock: requestedQuantity } },
      { new: true }
    )
    
    return res.json({ 
      message: 'Stock reserved successfully',
      productId,
      reservedQuantity: requestedQuantity
    })
  } catch (err) {
    console.error('reserveStock error:', err)
    return res.status(500).json({ message: 'Failed to reserve stock' })
  }
}

// Release stock when removing items from cart
export const releaseStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body
    
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' })
    }
    
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    const releaseQuantity = Number(quantity)
    const currentReservedStock = product.reservedStock || 0
    
    // Release the stock (don't go below 0)
    const newReservedStock = Math.max(0, currentReservedStock - releaseQuantity)
    
    await Product.findByIdAndUpdate(
      productId,
      { $set: { reservedStock: newReservedStock } },
      { new: true }
    )
    
    return res.json({ 
      message: 'Stock released successfully',
      productId,
      releasedQuantity: releaseQuantity
    })
  } catch (err) {
    console.error('releaseStock error:', err)
    return res.status(500).json({ message: 'Failed to release stock' })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    const userId = req.userId

    console.log('=== DELETE ORDER START ===')
    console.log('Order ID:', orderId)
    console.log('User ID:', userId)

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      console.log('Order not found')
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if user owns the order
    if (order.user.toString() !== userId) {
      console.log('User does not own this order')
      return res.status(403).json({ message: 'You can only delete your own orders' })
    }

    // Check if order status allows deletion
    if (order.status !== 'pending') {
      console.log('Order status does not allow deletion:', order.status)
      return res.status(400).json({ 
        message: 'Order cannot be deleted. Only pending orders can be deleted.',
        currentStatus: order.status
      })
    }

    console.log('Order found and eligible for deletion')
    console.log('Order status:', order.status)
    console.log('Order items:', order.items)

    // Release reserved stock for each item in the order
    if (order.items && order.items.length > 0) {
      console.log('Releasing reserved stock for', order.items.length, 'items')
      
      for (const item of order.items) {
        if (item.productId) {
          console.log('Releasing reserved stock for product:', item.productId, 'Quantity:', item.quantity)
          
          const product = await Product.findById(item.productId)
          if (product) {
            // Release reserved stock back to available stock
            const newReservedStock = Math.max(0, (product.reservedStock || 0) - (item.quantity || 0))
            product.reservedStock = newReservedStock
            await product.save()
            console.log('Reserved stock released for product:', product.name, 'New reserved stock:', product.reservedStock)
          } else {
            console.warn('Product not found for stock restoration:', item.productId)
          }
        }
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId)
    console.log('Order deleted successfully')

    return res.status(200).json({
      message: 'Order deleted successfully. Reserved stock has been released.',
      deletedOrderId: orderId
    })

  } catch (err) {
    console.error('=== DELETE ORDER ERROR ===')
    console.error('deleteOrder error:', err)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack)
    return res.status(500).json({ message: 'Failed to delete order' })
  }
}


