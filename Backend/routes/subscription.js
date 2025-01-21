const express = require('express');
const moment = require('moment');
const User = require('../models/user'); // Adjust the path as necessary
const Subscription = require('../models/subscription'); // Adjust the path as necessary
const { authMiddleware } = require('../middleware/authMiddleware'); // Adjust the path as necessary

const router = express.Router();

// Middleware to check if user is super admin
const superAdminMiddleware = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Super admin only.' });
    }
    next();
};

// Middleware to check and update subscription status
const checkSubscriptionStatus = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id, subscriptionStatus: 'active' },
        });

        if (!subscription) {
            return res.status(403).json({ message: 'No active subscription found.' });
        }

        // Check if the subscription has expired
        if (moment().isAfter(subscription.subscriptionExpiry)) {
            await subscription.update({ subscriptionStatus: 'expired' });
            return res.status(403).json({ message: 'Subscription expired. Please renew.' });
        }

        next(); // Allow access if subscription is still active
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Route to check subscription status
router.get('/subscription-status', authMiddleware, async (req, res) => {
    console.log('Incoming request:', req.method, req.url);
    try {
        const subscription = await Subscription.findOne({
            where: { userId: req.user.id },
        });

        // If no subscription found
        if (!subscription) {
            return res.status(200).json({ 
                isSuccess: false, 
                isSubscribed: false, 
                errorMessage: 'No subscription found.' 
            });
        }

        // Check if the subscription has expired
        if (moment().isAfter(subscription.subscriptionExpiry)) {
            return res.status(200).json({ 
                isSuccess: false, 
                isSubscribed: false, 
                errorMessage: 'Subscription expired. Please renew.',
                subscriptionExpiry: subscription.subscriptionExpiry, // Include expiry even if expired
            });
        }

        // If the subscription is active
        res.status(200).json({
            isSuccess: true,
            isSubscribed: true,
            subscriptionExpiry: subscription.subscriptionExpiry, // Active expiry date
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Renew Subscription for Admin and Associated Users
router.post('/renew-subscription', authMiddleware, superAdminMiddleware, async (req, res) => {
    const { adminEmail, duration } = req.body;
    const subscriptionDuration = Number(duration || 14); // Ensure duration is a number

    try {
        console.log(`Starting subscription renewal for adminEmail: ${adminEmail} with duration: ${subscriptionDuration} days`);

        const admin = await User.findOne({ where: { email: adminEmail, role: 'admin' } });
        if (!admin) {
            console.error(`Admin not found for email: ${adminEmail}`);
            return res.status(404).json({ message: 'Admin not found.' });
        }
        console.log(`Admin found: ${adminEmail}, userId: ${admin.id}`);

        const existingSubscription = await Subscription.findOne({
            where: { userId: admin.id, subscriptionStatus: 'active' },
        });

        let expiryDate;
        if (existingSubscription) {
            const currentExpiryDate = moment(existingSubscription.subscriptionExpiry);
            expiryDate = currentExpiryDate.isAfter(moment()) 
                ? currentExpiryDate.add(subscriptionDuration, 'days') 
                : moment().add(subscriptionDuration, 'days');

            console.log(`Updating existing subscription. Old expiry: ${existingSubscription.subscriptionExpiry}, New expiry: ${expiryDate.format()}`);
            
            // Ensure numerical addition for duration
            const newDuration = Number(existingSubscription.duration) + subscriptionDuration;
            await existingSubscription.update({
                subscriptionExpiry: expiryDate.toDate(),
                duration: newDuration,
            });
            console.log(`Updated duration: ${newDuration}`);
        } else {
            expiryDate = moment().add(subscriptionDuration, 'days').toDate();
            console.log(`No active subscription found. Creating new subscription with expiry: ${expiryDate}`);
            await Subscription.create({
                userId: admin.id,
                subscriptionStatus: 'active',
                subscriptionExpiry: expiryDate,
                duration: subscriptionDuration,
            });
        }

        const associatedUsers = await User.findAll({ where: { adminEmail: adminEmail } });
        await Promise.all(associatedUsers.map(async (user) => {
            const userSubscription = await Subscription.findOne({
                where: { userId: user.id, subscriptionStatus: 'active' },
            });

            if (userSubscription) {
                console.log(`Updating subscription for associated userId: ${user.id}, Old expiry: ${userSubscription.subscriptionExpiry}, New expiry: ${expiryDate}`);
                
                // Ensure numerical addition for associated users
                const newUserDuration = Number(userSubscription.duration) + subscriptionDuration;
                await userSubscription.update({
                    subscriptionExpiry: expiryDate,
                    duration: newUserDuration,
                });
                console.log(`Updated duration for associated userId ${user.id}: ${newUserDuration}`);
            } else {
                console.log(`Creating new subscription for associated userId: ${user.id} with expiry: ${expiryDate}`);
                await Subscription.create({
                    userId: user.id,
                    subscriptionStatus: 'active',
                    subscriptionExpiry: expiryDate,
                    duration: subscriptionDuration,
                });
            }
        }));
        

        res.status(200).json({ message: 'Subscription updated successfully for admin and associated users.', expiryDate });
    } catch (error) {
        console.error('Error during subscription renewal:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Example of protected route with subscription check
router.get('/protected-route', authMiddleware, checkSubscriptionStatus, (req, res) => {
    res.status(200).json({ message: 'Access granted to protected resource' });
});

module.exports = router;
