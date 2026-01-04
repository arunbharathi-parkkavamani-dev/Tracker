import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AgentToken from '../models/AgentToken.js';

export const agentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== AGENT LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 'undefined');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    console.log('Searching for agent with email:', email);
    const agent = await AgentToken.findOne({ email, isActive: true });
    console.log('Agent found:', agent ? 'YES' : 'NO');
    
    if (agent) {
      console.log('Agent details:');
      console.log('- ID:', agent._id);
      console.log('- Email:', agent.email);
      console.log('- AgentId:', agent.agentId);
      console.log('- ClientId:', agent.clientId);
      console.log('- IsActive:', agent.isActive);
      console.log('- HasPassword:', agent.password ? 'YES' : 'NO');
      console.log('- Password hash length:', agent.password ? agent.password.length : 'N/A');
      console.log('- Login attempts:', agent.loginAttempts);
      console.log('- Locked until:', agent.lockedUntil);
    }
    
    if (!agent) {
      console.log('Agent not found - returning invalid credentials');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (agent.lockedUntil && agent.lockedUntil > new Date()) {
      console.log('Account is locked until:', agent.lockedUntil);
      return res.status(423).json({ success: false, message: 'Account temporarily locked' });
    }
    
    console.log('Comparing passwords...');
    console.log('Input password:', password);
    console.log('Stored hash:', agent.password);
    
    const isValidPassword = await bcrypt.compare(password, agent.password);
    console.log('Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Password mismatch - incrementing login attempts');
      agent.loginAttempts += 1;
      if (agent.loginAttempts >= 5) {
        agent.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        console.log('Account locked due to too many attempts');
      }
      await agent.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('Password valid - generating session token');
    
    // Generate session token
    const sessionToken = jwt.sign(
      { agentId: agent.agentId, clientId: agent.clientId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update agent session
    agent.currentSessionToken = sessionToken;
    agent.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    agent.lastLoginAt = new Date();
    agent.loginAttempts = 0;
    agent.lockedUntil = undefined;
    await agent.save();
    
    console.log('Login successful for agent:', agent.email);
    console.log('=== LOGIN COMPLETE ===');
    
    res.json({
      success: true,
      token: sessionToken,
      agentId: agent.agentId,
      clientId: agent.clientId
    });
    
  } catch (error) {
    console.error('Agent login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const agentLogout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await AgentToken.updateOne(
        { currentSessionToken: token },
        { $unset: { currentSessionToken: 1, sessionExpiresAt: 1 } }
      );
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};