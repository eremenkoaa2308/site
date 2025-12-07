// /api/vote.js
import { createClient } from '@supabase/supabase-js';

// === ВАЖНО: ЗАМЕНИ ЭТИ КЛЮЧИ НА СВОИ ===
const SUPABASE_URL = 'https://puegfmyflnyrbmjanwgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VmPYD4BzsIQbA01Cp7OTGg_w6c7qUIl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Названия номинаций
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
    // Разрешаем запросы с любого домена (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. ОБРАБОТКА ОТПРАВКИ ГОЛОСА (POST)
    if (req.method === 'POST') {
        try {
            const voteData = req.body;
            const votes = [];

            // Проверяем, что все номинации заполнены
            for (let i = 1; i <= 12; i++) {
                if (!voteData[`n${i}`] || voteData[`n${i}`].trim() === '') {
                    return res.status(400).json({
                        error: `Заполните номинацию: ${NOMINATIONS[i-1]}`
                    });
                }
            }

            // Генерируем уникальный ID голосующего (упрощенно)
            const voterToken = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Подготавливаем данные для вставки в БД
            for (let i = 0; i < 12; i++) {
                votes.push({
                    nomination: NOMINATIONS[i],
                    candidate: voteData[`n${i+1}`].trim(),
                    voter_token: voterToken,
                    created_at: new Date().toISOString()
                });
            }

            // Вставляем ВСЕ голоса пользователя разом
            const { data, error } = await supabase
                .from('votes')
                .insert(votes);

            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ error: 'Ошибка сохранения в базу данных' });
            }

            // Возвращаем успех
            return res.status(201).json({
                success: true,
                id: voterToken,
                message: 'Голос сохранен'
            });

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // 2. ОБРАБОТКА ПОЛУЧЕНИЯ РЕЗУЛЬТАТОВ (GET)
    if (req.method === 'GET') {
        try {
            // Запрос к Supabase: группируем голоса по номинациям и кандидатам, считаем количество
            const { data, error } = await supabase
                .from('votes')
                .select('nomination, candidate')
                .then(response => {
                    if (response.error) throw response.error;
                    // Группируем и считаем вручную, так как Supabase не поддерживает COUNT с GROUP BY в REST API
                    const grouped = {};
                    response.data.forEach(vote => {
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
                    return { data: Object.values(grouped) };
                });

            if (error) {
                throw error;
            }

            // Считаем общее количество голосов
            const totalVotes = data.reduce((sum, item) => sum + item.vote_count, 0);

            return res.status(200).json({
                total: totalVotes,
                results: data.sort((a, b) => b.vote_count - a.vote_count)
            });

        } catch (error) {
            console.error('Error fetching results:', error);
            return res.status(500).json({ error: 'Ошибка загрузки результатов' });
        }
    }

    // Если метод не POST и не GET
    return res.status(405).json({ error: 'Метод не разрешен' });
}