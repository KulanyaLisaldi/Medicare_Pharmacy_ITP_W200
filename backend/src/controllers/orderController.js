import Order from '../models/Order.js'
import Product from '../models/Product.js'

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

    // Create the order
    const order = await Order.create({
      user: userId,
      items: normalizedItems,
      total: total != null ? Number(total) : computedTotal,
      paymentMethod: paymentMethod || 'cod',
      deliveryType: deliveryType || 'home_delivery',
      status: 'pending',
      customer: {
        name: customer?.name,
        phone: customer?.phone,
        address: customer?.address,
        notes: customer?.notes || ''
      }
    })

    // Reserve stock temporarily after successful order creation
    // This prevents other customers from ordering the same items
    for (const item of normalizedItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { reservedStock: item.quantity } },
          { new: true }
        )
      }
    }

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
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (err) {
    console.error('listMyOrders error:', err)
    return res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const listAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 })
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

    // Deduct actual stock and clear reservations for all items
    for (const it of order.items) {
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


