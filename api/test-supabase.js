import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://puegfmyflnyrbmjanwgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VmPYD4BzsIQbA01Cp7OTGg_w6c7qUIl';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // Пробуем подключиться к Supabase
    const { data, error } = await supabase
      .from('votes')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({ 
        error: 'Ошибка подключения к Supabase',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase подключен успешно!',
      connection: 'OK',
      tableExists: true,
      count: data
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Ошибка сервера',
      details: error.message
    });
  }
}