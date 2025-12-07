// /api/vote.js - ГАРАНТИРОВАННО РАБОЧАЯ ВЕРСИЯ
import { createClient } from '@supabase/supabase-js';

// ВАШИ КЛЮЧИ
const SUPABASE_URL = 'https://puegfmyflnyrbmjanwgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VmPYD4BzsIQbA01Cp7OTGg_w6c7qUIl';

// Создаем клиент
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Номинации
const NOMINATIONS = [
    'RND-KING',
    'АФК RND года',
    'Дотер года',
    'Завоз года',
    'Харизма года',
    'Зашквар года',
    'RND-добряк',
    'RND-злодей',
    'Прорыв года',
    'Хейт года',
    'RND QUEEN',
    'RND-ELDER KING'
];

export default async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS запрос
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // POST - СОХРАНЕНИЕ ГОЛОСА
    if (req.method === 'POST') {
        try {
            const voteData = req.body;
            
            // ВАЖНО: Логируем что получаем
            console.log('📨 Получены данные:', JSON.stringify(voteData).substring(0, 200));
            
            // Проверка данных
            for (let i = 1; i <= 12; i++) {
                if (!voteData[`n${i}`] || voteData[`n${i}`].trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: `Заполните: ${NOMINATIONS[i-1]}`
                    });
                }
            }
            
            // Создаем токен
            const voterToken = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('🆔 Создан токен:', voterToken);
            
            // ПОДГОТОВКА ДАННЫХ - КЛЮЧЕВОЙ МОМЕНТ!
            const votesToInsert = [];
            
            for (let i = 0; i < 12; i++) {
                const candidateName = voteData[`n${i+1}`].trim();
                
                // Убедимся, что имя не пустое и не слишком длинное
                if (!candidateName || candidateName.length > 100) {
                    return res.status(400).json({
                        success: false,
                        error: `Некорректное имя в номинации ${NOMINATIONS[i]}`
                    });
                }
                
                votesToInsert.push({
                    nomination: NOMINATIONS[i],
                    candidate: candidateName,
                    voter_token: voterToken,
                    created_at: new Date().toISOString()
                });
            }
            
            console.log(`💾 Готово к сохранению: ${votesToInsert.length} записей`);
            
            // ⚡ СПОСОБ 1: Сохраняем по одной записи (надежнее)
            const results = [];
            
            for (const vote of votesToInsert) {
                console.log('➡️ Сохраняю:', vote.nomination, '-', vote.candidate);
                
                const { data, error } = await supabase
                    .from('votes')
                    .insert(vote);
                
                if (error) {
                    console.error('❌ Ошибка при сохранении записи:', error);
                    throw new Error(`Ошибка Supabase: ${error.message}`);
                }
                
                results.push(data);
            }
            
            console.log('✅ Все голоса сохранены!');
            
            return res.status(201).json({
                success: true,
                message: 'Голос успешно сохранен в базе данных!',
                voter_token: voterToken,
                saved_count: votesToInsert.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('🔥 Критическая ошибка:', error.message);
            
            return res.status(500).json({
                success: false,
                error: 'Ошибка сохранения',
                details: error.message,
                suggestion: 'Проверьте таблицу votes в Supabase'
            });
        }
    }
    
    // GET - ПОЛУЧЕНИЕ РЕЗУЛЬТАТОВ
    if (req.method === 'GET') {
        try {
            console.log('📊 Запрашиваю результаты...');
            
            const { data: votes, error } = await supabase
                .from('votes')
                .select('*');
            
            if (error) {
                console.error('❌ Ошибка чтения:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка чтения из базы'
                });
            }
            
            console.log(`📈 Получено ${votes?.length || 0} голосов`);
            
            if (!votes || votes.length === 0) {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    results: [],
                    message: 'Голосов пока нет'
                });
            }
            
            // Группировка
            const grouped = {};
            votes.forEach(vote => {
                const key = `${vote.nomination}|${vote.candidate}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        nomination: vote.nomination,
                        candidate: vote.candidate,
                        vote_count: 0
                    };
                }
                grouped[key].vote_count++;
            });
            
            const results = Object.values(grouped)
                .sort((a, b) => b.vote_count - a.vote_count);
            
            return res.status(200).json({
                success: true,
                total: votes.length,
                results: results,
                updated_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Ошибка обработки:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка обработки результатов'
            });
        }
    }
    
    return res.status(405).json({
        success: false,
        error: 'Метод не поддерживается'
    });
}