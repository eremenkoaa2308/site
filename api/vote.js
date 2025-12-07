// /api/vote.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
import { createClient } from '@supabase/supabase-js';

// === ВАШИ КЛЮЧИ (уже правильные) ===
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
    
    // 1. СОХРАНЕНИЕ ГОЛОСА В SUPABASE (POST)
    if (req.method === 'POST') {
        try {
            const voteData = req.body;
            const votes = [];
            
            console.log('📨 Получен голос:', voteData);
            
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
            
            console.log('💾 Сохраняю в Supabase:', votes.length, 'записей');
            
            // Сохраняем в Supabase
            const { data, error } = await supabase
                .from('votes')
                .insert(votes);
            
            if (error) {
                console.error('❌ Ошибка Supabase:', error);
                return res.status(500).json({ 
                    error: 'Ошибка сохранения в базу данных',
                    details: error.message,
                    hint: error.hint,
                    code: error.code
                });
            }
            
            console.log('✅ Голос сохранен, токен:', voterToken);
            
            return res.status(201).json({
                success: true,
                message: 'Голос успешно сохранен в базе данных!',
                voter_token: voterToken,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('🔥 Серверная ошибка:', error);
            return res.status(500).json({ 
                error: 'Внутренняя ошибка сервера',
                details: error.message
            });
        }
    }
    
    // 2. ПОЛУЧЕНИЕ РЕЗУЛЬТАТОВ ИЗ SUPABASE (GET)
    if (req.method === 'GET') {
        try {
            console.log('📊 Запрос результатов из Supabase...');
            
            // Получаем все голоса из Supabase
            const { data: votes, error } = await supabase
                .from('votes')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Ошибка Supabase при чтении:', error);
                throw error;
            }
            
            console.log('📈 Получено голосов из БД:', votes ? votes.length : 0);
            
            // Если голосов нет
            if (!votes || votes.length === 0) {
                return res.status(200).json({
                    total: 0,
                    results: [],
                    message: 'Голосов пока нет',
                    timestamp: new Date().toISOString()
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
            
            // Считаем уникальных голосующих
            const uniqueVoters = [...new Set(votes.map(v => v.voter_token))].length;
            
            return res.status(200).json({
                total: uniqueVoters,
                results: results,
                raw_count: votes.length,
                updated_at: new Date().toISOString(),
                message: `Уникальных голосующих: ${uniqueVoters}`
            });
            
        } catch (error) {
            console.error('🔥 Ошибка загрузки результатов:', error);
            return res.status(500).json({ 
                error: 'Ошибка загрузки результатов из базы',
                details: error.message
            });
        }
    }
    
    return res.status(405).json({ error: 'Метод не разрешен' });
}