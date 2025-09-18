import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

// Accepts Google profile info from frontend after verifying ID token client-side or via backend route
export async function googleSignin(req, res){
    try{
        const { email, name, sub } = req.body; // sub is Google user id
        if(!email || !sub) return res.status(400).json({ message: 'Invalid Google payload' });

        let user = await User.findOne({ provider: 'google', providerId: sub });
        if(!user){
            // fallback by email
            user = await User.findOne({ email });
        }
        if(!user){
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: jwt.sign({ email, sub }, 'x'),
                address: 'N/A',
                phone: 'N/A',
                role: 'customer',
                isVerified: true,
                provider: 'google',
                providerId: sub
            });
        } else {
            user.provider = 'google';
            user.providerId = sub;
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user._id);
        return res.json({ message: 'Login successful', user: user.getPublicProfile(), token });
    }catch(e){
        console.error('googleSignin error', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


