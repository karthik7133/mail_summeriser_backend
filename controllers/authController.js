const User = require('../models/User'); // Ensure this path is correct

const verifyAndCreateUser = async (req, res) => {
    try {
        // Destructuring uses camelCase to match the Flutter client payload
        const { firebaseUid, name, email, profilePic, googleAccessToken, googleRefreshToken } = req.body;

        if (!firebaseUid || !email) {
            return res.status(400).json({ error: 'Firebase UID and email are required' });
        }

        // 1. Search by the unique email field to prevent duplicate key errors (E11000)
        let user = await User.findOne({ email });

        // Fields to update on existing user or include in new user creation
        const tokenUpdateFields = {};
        if (googleAccessToken) tokenUpdateFields.google_access_token = googleAccessToken;
        if (googleRefreshToken) tokenUpdateFields.google_refresh_token = googleRefreshToken;

        if (user) {
            // 2. User exists: Update non-critical fields and, most importantly, the tokens.
            const updateData = {
                name: name || user.name,
                profile_pic: profilePic || user.profile_pic,
                ...tokenUpdateFields // Spread the new tokens here
            };

            await User.updateOne({ _id: user._id }, { $set: updateData });
            
            // Fetch the updated document
            user = await User.findOne({ _id: user._id });

        } else {
            // 3. User does not exist: Create a new document with all fields
            const userData = {
                firebase_uid: firebaseUid,
                name: name || email,
                email: email,
                profile_pic: profilePic || '',
                ...tokenUpdateFields // Spread the new tokens here
            };
            
            user = await User.create(userData);
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firebaseUid: user.firebase_uid,
                name: user.name,
                email: user.email,
                profilePic: user.profile_pic,
            }
        });
    } catch (error) {
        console.error('Verify user error:', error);
        return res.status(500).json({ error: 'Failed to verify user', details: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        // Assumes req.user is set by authMiddleware
        if (!req.user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
};

module.exports = {
    verifyAndCreateUser,
    getCurrentUser
};