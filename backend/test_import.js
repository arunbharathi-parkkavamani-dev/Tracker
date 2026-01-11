import { pathToFileURL } from 'url';
import path from 'path';

const crudFile = 'C:\\Users\\Arunbharathi Logimax\\Documents\\GitHub\\Tracker\\backend\\src\\crud\\buildReadQuery.js';

async function testImport() {
    try {
        console.log('Attempting to import:', crudFile);
        const url = pathToFileURL(crudFile).href;
        console.log('URL:', url);
        const module = await import(url);
        console.log('Import successful!');
    } catch (err) {
        console.error('Import failed with error:');
        console.error(err);
    }
}

testImport();
