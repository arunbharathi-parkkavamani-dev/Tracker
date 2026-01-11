import { pathToFileURL } from 'url';

const dependencies = [
    '../models/Collection.js',
    '../utils/servicesCache.js',
    '../utils/cache.js',
    '../utils/mongoFilterCompiler.js',
    '../utils/registryExecutor.js',
    '../utils/sanitizeRead.js',
    '../utils/sanitizePopulated.js',
    '../utils/safeAggregator.js'
];

async function testDependencies() {
    const baseDir = 'file:///C:/Users/Arunbharathi%20Logimax/Documents/GitHub/Tracker/backend/src/crud/';

    for (const dep of dependencies) {
        const url = new URL(dep, baseDir).href;
        console.log(`Testing import of: ${dep} (URL: ${url})`);
        try {
            await import(url);
            console.log(`✅ Success: ${dep}`);
        } catch (err) {
            console.error(`❌ Failed: ${dep}`);
            console.error(err.message);
            // If it's a module not found error, show what it was trying to find
            if (err.code === 'ERR_MODULE_NOT_FOUND') {
                console.error(err);
            }
        }
        console.log('---');
    }
}

testDependencies();
