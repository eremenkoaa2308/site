// /api/supabase-test.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://puegfmyflnyrbmjanwgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VmPYD4BzsIQbA01Cp7OTGg_w6c7qUIl';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 1. Тест подключения
        console.log('1. Тестирую подключение...');
        
        // 2. Пробуем создать таблицу если её нет
        console.log('2. Проверяю таблицу votes...');
        
        // 3. Пробуем вставить тестовую запись
        const testRecord = {
            nomination: 'TEST_CONNECTION',
            candidate: 'TEST_BOT',
            voter_token: 'connection_test_' + Date.now(),
            created_at: new Date().toISOString()
        };
        
        console.log('3. Вставляю тестовую запись:', testRecord);
        
        const { data, error } = await supabase
            .from('votes')
            .insert([testRecord])
            .select();
        
        if (error) {
            return res.status(500).json({
                success: false,
                stage: 'insert',
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        }
        
        // 4. Читаем все записи
        const { data: allData, error: readError } = await supabase
            .from('votes')
            .select('*');
        
        if (readError) {
            return res.status(500).json({
                success: false,
                stage: 'read',
                error: readError.message
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Supabase работает отлично!',
            test_inserted: data,
            total_records: allData.length,
            sample_records: allData.slice(0, 5),
            table_structure: 'votes(id, nomination, candidate, voter_token, created_at)'
        });
        
    } catch (error) {
        console.error('Общая ошибка:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}