const fs = require('fs');
const path = require('path');

function walk(dir) {
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            if (file === 'node_modules' || file === '.git' || file === '.idea' || file === 'target' || file === 'dist' || file === '.vercel') return;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(file);
                if (['.js', '.mjs', '.json', '.properties', '.yml', '.yaml', '.env', '.local', '.txt', '.md'].includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('mongodb+srv://') || content.includes('mongodb://')) {
                        console.log('Found in:', fullPath);
                        const matches = content.match(/mongodb(?:\+srv)?:\/\/[^\s\"']+/g);
                        if (matches) console.log(matches);
                    }
                }
            }
        });
    } catch(e) {}
}

console.log('Searching c:\\PROJECTS...');
walk('c:\\PROJECTS');
console.log('Searching brain directory...');
walk('C:\\Users\\chris\\.gemini\\antigravity\\brain\\4003eeef-2b1a-474c-a716-a22001e4156e');
