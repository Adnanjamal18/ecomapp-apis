const fs = require('fs');
const path = require('path');

const addExpressTypes = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            addExpressTypes(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Add imports if missing
            if (content.includes('req') && !content.includes('import { Request')) {
                content = `import { Request, Response, NextFunction } from "express";\n` + content;
                modified = true;
            }

            // Replace req, res without types
            const reqResRegex = /\((req|req,\s*res|req,\s*res,\s*next)\)\s*=>/g;
            if (reqResRegex.test(content)) {
                content = content.replace(/\(req,\s*res\)\s*=>/g, "(req: Request, res: Response) =>");
                content = content.replace(/\(req,\s*res,\s*next\)\s*=>/g, "(req: Request, res: Response, next: NextFunction) =>");
                content = content.replace(/\(err,\s*req,\s*res,\s*next\)\s*=>/g, "(err: any, req: Request, res: Response, next: NextFunction) =>");
                modified = true;
            }

            // Replace req, res in standard function declarations
            const fnReqResRegex = /function\s+\w+\s*\((req|req,\s*res|req,\s*res,\s*next)\)/g;
            if (fnReqResRegex.test(content)) {
                content = content.replace(/function\s+(\w+)\s*\(req,\s*res\)/g, "function $1(req: Request, res: Response)");
                content = content.replace(/function\s+(\w+)\s*\(req,\s*res,\s*next\)/g, "function $1(req: Request, res: Response, next: NextFunction)");
                modified = true;
            }
            
            // Fix error is unknown
            if (content.includes('error.message')) {
                content = content.replace(/catch\s*\((error|err)\)\s*\{/g, "catch ($1: any) {");
                modified = true;
            }

            // Fix process.env.JWT_SECRET
            if (content.includes('process.env.JWT_SECRET')) {
                content = content.replace(/process\.env\.JWT_SECRET/g, 'process.env.JWT_SECRET as string');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified', fullPath);
            }
        }
    }
};

addExpressTypes(path.join(__dirname, 'src'));
