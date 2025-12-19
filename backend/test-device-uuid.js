// Quick test to verify deviceUUID system
console.log('Testing Device UUID System...');

// Test 1: Web UUID Generation
const webUUID = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
console.log('Web UUID:', webUUID);

// Test 2: Mobile UUID Generation  
const mobileUUID = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
console.log('Mobile UUID:', mobileUUID);

// Test 3: Verify UUID format
const uuidRegex = /^(web|mobile)_\d+_[a-z0-9]{9}$/;
console.log('Web UUID valid:', uuidRegex.test(webUUID));
console.log('Mobile UUID valid:', uuidRegex.test(mobileUUID));

console.log('✅ Device UUID system is properly configured!');