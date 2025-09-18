import Notification from "../models/Notification.js";

export async function getMyNotifications(req, res) {
    try {
        const notifications = await Notification.find({ $or: [ { userId: req.userId }, { role: req.user?.role } ] })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        const notif = await Notification.findOneAndUpdate({ _id: id, userId: req.userId }, { read: true }, { new: true });
        if (!notif) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification marked as read' });
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin creates broadcast notification by role or specific user
export async function createNotification(req, res) {
    try {
        const { userId, role, title, message, link } = req.body;
        if (!userId && !role) return res.status(400).json({ message: 'userId or role required' });
        const notif = await Notification.create({ userId, role, title, message, link });
        res.status(201).json(notif);
    } catch (e) {
        res.status(500).json({ message: 'Internal server error' });
    }
}


