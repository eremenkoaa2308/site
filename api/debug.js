// /api/debug.js
import { readdirSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        // Получаем список файлов в проекте
        const files = [];
        
        function scanDir(dir, prefix = '') {
            try {
                const items = readdirSync(dir, { withFileTypes: true });
                items.forEach(item => {
                    const fullPath = join(dir, item.name);
                    const displayPath = prefix + item.name;
                    
                    if (item.isDirectory()) {
                        files.push(displayPath + '/');
                        scanDir(fullPath, prefix + item.name + '/');
                    } else {
                        files.push(displayPath);
                    }
                });
            } catch (err) {
                files.push(`${prefix}ERROR: ${err.message}`);
            }
        }
        
        scanDir(process.cwd());
        
        // Проверяем, существует ли vote.js
        const voteExists = files.some(f => f.includes('vote.js'));
        
        return res.status(200).json({
            success: true,
            current_dir: process.cwd(),
            files: files.sort(),
            vote_js_exists: voteExists,
            vote_js_location: files.find(f => f.includes('vote.js')) || 'NOT FOUND',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}