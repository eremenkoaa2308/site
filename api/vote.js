// /api/vote.js - МИНИМАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
console.log('✅ vote.js загружен');

export default async function handler(req, res) {
    console.log(`📨 ${req.method} /api/vote вызван`);
    
    // Включаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS запрос
    if (req.method === 'OPTIONS') {
        console.log('🔄 OPTIONS запрос');
        return res.status(200).end();
    }
    
    // GET запрос
    if (req.method === 'GET') {
        console.log('📊 GET запрос на результаты');
        return res.status(200).json({
            success: true,
            message: 'API работает!',
            total: 0,
            results: [],
            timestamp: new Date().toISOString()
        });
    }
    
    // POST запрос
    if (req.method === 'POST') {
        console.log('📝 POST запрос на сохранение голоса');
        
        try {
            // Проверяем тело запроса
            const body = req.body || {};
            console.log('Тело запроса:', JSON.stringify(body).substring(0, 200));
            
            // Простая валидация
            if (Object.keys(body).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Нет данных'
                });
            }
            
            // Имитируем сохранение
            const voterToken = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`✅ Голос принят, токен: ${voterToken}`);
            
            // Возвращаем успех
            return res.status(201).json({
                success: true,
                message: 'Голос успешно сохранен!',
                voter_token: voterToken,
                received_data: body,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Ошибка в POST:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                details: error.message
            });
        }
    }
    
    // Если метод не поддерживается
    return res.status(405).json({
        success: false,
        error: 'Метод не разрешен',
        allowed: ['GET', 'POST', 'OPTIONS']
    });
}