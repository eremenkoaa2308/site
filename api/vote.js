// /api/vote.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://puegfmyflnyrbmjanwgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VmPYD4BzsIQbA01Cp7OTGg_w6c7qUIl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    // Включаем CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Для предзапросов OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 1. СОХРАНЕНИЕ ГОЛОСА (POST)
    if (req.method === 'POST') {
        try {
            const voteData = req.body;
            const votes = [];
            
            // Проверяем все поля
            for (let i = 1; i <= 12; i++) {
                if (!voteData[`n${i}`] || voteData[`n${i}`].trim() === '') {
                    return res.status(400).json({
                        error: `Заполните номинацию: ${NOMINATIONS[i-1]}`
                    });
                }
            }
            
            // Создаем уникальный токен голосующего
            const voterToken = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Подготавливаем данные для Supabase
            for (let i = 0; i < 12; i++) {
                votes.push({
                    nomination: NOMINATIONS[i],
                    candidate: voteData[`n${i+1}`].trim(),
                    voter_token: voterToken,
                    created_at: new Date().toISOString()
                });
            }
            
            // Сохраняем в Supabase
            const { error } = await supabase
                .from('votes')
                .insert(votes);
            
            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ 
                    error: 'Ошибка сохранения голоса',
                    details: error.message 
                });
            }
            
            return res.status(201).json({
                success: true,
                message: 'Голос успешно сохранен!',
                voter_token: voterToken,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ 
                error: 'Внутренняя ошибка сервера',
                details: error.message 
            });
        }
    }
    
    // 2. ПОЛУЧЕНИЕ РЕЗУЛЬТАТОВ (GET)
    if (req.method === 'GET') {
        try {
            // Получаем все голоса из Supabase
            const { data: votes, error } = await supabase
                .from('votes')
                .select('*');
            
            if (error) {
                throw error;
            }
            
            // Если голосов нет
            if (!votes || votes.length === 0) {
                return res.status(200).json({
                    total: 0,
                    results: [],
                    message: 'Голосов пока нет'
                });
            }
            
            // Группируем и считаем голоса
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
                total: votes.length,
                results: results,
                updated_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error fetching votes:', error);
            return res.status(500).json({ 
                error: 'Ошибка загрузки результатов',
                details: error.message 
            });
        }
    }
    
    // Если метод не поддерживается
    return res.status(405).json({ error: 'Метод не разрешен' });
}