import express from 'express'
import { authenticateToken, requirePharmacist, requireAdmin, requireDeliveryAgent } from '../middleware/auth.js'
import { createOrder, listMyOrders, listAllOrders, listDeliveryOrders, getOrderById, updateOrder, confirmPreparation, checkStockAvailability, cancelOrder } from '../controllers/orderController.js'

const router = express.Router()

router.use(authenticateToken)
router.post('/check-stock', checkStockAvailability)
router.post('/', createOrder)
router.get('/mine', listMyOrders)
router.patch('/:id/cancel', cancelOrder)
// Delivery Agent endpoints
router.get('/delivery', requireDeliveryAgent, listDeliveryOrders)
router.patch('/delivery/:id', requireDeliveryAgent, updateOrder)
// Pharmacist/Admin endpoints
router.get('/', requirePharmacist, listAllOrders)
router.get('/:id', requirePharmacist, getOrderById)
router.patch('/:id', requirePharmacist, updateOrder)
router.post('/:id/confirm-preparation', requirePharmacist, confirmPreparation)

export default router


