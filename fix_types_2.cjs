const fs = require('fs');
const path = require('path');

const fixRemainingTypes = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixRemainingTypes(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix req.body destructuring
            if (content.includes('req.body;')) {
                content = content.replace(/=\s*req\.body;/g, '= req.body as any;');
                modified = true;
            }

            // Fix req.query.id
            if (content.includes('req.query.id')) {
                content = content.replace(/req\.query\.id/g, '(req.query.id as string)');
                modified = true;
            }

            // Fix decoded.id
            if (content.includes('decoded.id')) {
                content = content.replace(/decoded\.id/g, '(decoded as any).id');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified', fullPath);
            }
        }
    }
};

fixRemainingTypes(path.join(__dirname, 'src'));
