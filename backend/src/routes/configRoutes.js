import express from 'express';
import { setCache } from '../utils/cache.js';
import models from '../models/Collection.js';

const router = express.Router();

// Get list of all available models for dropdowns
router.get('/models', (req, res) => {
    try {
        const modelNames = Object.keys(models).sort();
        res.json({ success: true, models: modelNames });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch models' });
    }
});

router.post('/refresh-policy', async (req, res) => {
    try {
        console.log(`[Config] Policy refresh requested by user: ${req.user?.id}`);

        // In strict production, might want to check for SUPER_ADMIN role here

        await setCache();

        res.json({
            success: true,
            message: 'Access Policy Cache Refreshed Successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Config] Policy refresh failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh cache',
            error: error.message
        });
    }
});

export default router;
