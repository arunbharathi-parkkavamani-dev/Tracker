import jwt from 'jsonwebtoken';
import AgentToken from '../models/AgentToken.js';

export const agentAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const source = req.headers['x-source'];
    
    if (source === 'external' && token) {
      // External agent authentication
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const agent = await AgentToken.findOne({
        currentSessionToken: token,
        sessionExpiresAt: { $gt: new Date() },
        isActive: true
      });
      
      if (!agent) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
      
      req.agent = {
        agentId: agent.agentId,
        clientId: agent.clientId,
        isExternal: true
      };
      
      return next();
    }
    
    // Fall back to regular authentication for internal users
    next();
    
  } catch (error) {
    if (req.headers['x-source'] === 'external') {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
    next();
  }
};