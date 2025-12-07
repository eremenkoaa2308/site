// /api/test-simple.js
export default async function handler(req, res) {
    console.log('TEST: API вызван', new Date().toISOString());
    
    try {
        // Просто возвращаем успех
        return res.status(200).json({
            success: true,
            message: 'API работает!',
            method: req.method,
            timestamp: new Date().toISOString(),
            node_version: process.version
        });
    } catch (error) {
        console.error('TEST ERROR:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}