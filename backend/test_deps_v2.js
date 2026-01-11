import { pathToFileURL } from 'url';
import fs from 'fs';

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
    let log = '';

    for (const dep of dependencies) {
        const url = new URL(dep, baseDir).href;
        log += `Testing import of: ${dep} (URL: ${url})\n`;
        try {
            await import(url);
            log += `✅ Success: ${dep}\n`;
        } catch (err) {
            log += `❌ Failed: ${dep}\n`;
            log += `Message: ${err.message}\n`;
            if (err.stack) log += `Stack: ${err.stack}\n`;
            if (err.code) log += `Code: ${err.code}\n`;
        }
        log += '---\n';
    }

    fs.writeFileSync('deps_detailed.log', log, 'utf8');
    console.log('Results written to deps_detailed.log');
}

testDependencies();
