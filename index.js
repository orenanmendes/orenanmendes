import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Cache configuration
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// INPI URLs
const INPI_BASE_URL = 'https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp';
const INPI_SEARCH_URL = 'https://busca.inpi.gov.br/pePI/servlet/MarcasServletController';

// Session management
let sessionCookie = null;
let lastSessionRefresh = 0;
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshSession() {
  try {
    const response = await axios.get(INPI_BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive'
      }
    });

    const cookies = response.headers['set-cookie'];
    if (cookies?.length > 0) {
      sessionCookie = cookies[0].split(';')[0];
      lastSessionRefresh = Date.now();
      console.log('Session refreshed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing session:', error);
    throw new Error('Falha ao iniciar sessão com o INPI');
  }
}

async function ensureValidSession() {
  if (!sessionCookie || (Date.now() - lastSessionRefresh) > SESSION_REFRESH_INTERVAL) {
    return refreshSession();
  }
  return true;
}

function parseProcessDetails($, row) {
  try {
    const columns = $(row).find('td');
    if (columns.length < 4) return null;

    return {
      numero: $(columns.eq(0)).text().trim(),
      marca: $(columns.eq(1)).text().trim(),
      situacao: $(columns.eq(2)).text().trim(),
      titular: $(columns.eq(3)).text().trim(),
      tipo: $(columns.eq(4))?.text().trim() || 'Não especificado'
    };
  } catch (error) {
    console.error('Error parsing process details:', error);
    return null;
  }
}

async function searchINPI(searchParams, retryCount = 0) {
  try {
    await ensureValidSession();

    const formData = new URLSearchParams();
    formData.append('Action', 'SearchBasic');
    formData.append('marca', searchParams.marca);
    
    if (searchParams.ncl) {
      formData.append('ncl', searchParams.ncl);
    }
    
    if (searchParams.tipo) {
      formData.append('tipo', searchParams.tipo);
    }
    
    if (searchParams.pagina) {
      formData.append('pagina', searchParams.pagina);
    }

    const response = await axios.post(INPI_SEARCH_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': sessionCookie,
        'Referer': INPI_BASE_URL
      },
      timeout: 30000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    // Check for CAPTCHA
    if ($('form[name="captcha"]').length > 0) {
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
        return searchINPI(searchParams, retryCount + 1);
      }
      throw new Error('CAPTCHA detectado após várias tentativas');
    }

    const processos = [];
    let classe = '';
    let processos_total = 0;

    // Extract class information if available
    const classeElement = $('.classe-nice').first();
    if (classeElement.length) {
      classe = classeElement.text().trim();
    }

    // Extract total results
    const totalElement = $('.resultado-busca').first();
    if (totalElement.length) {
      const totalText = totalElement.text().trim();
      const match = totalText.match(/\d+/);
      if (match) {
        processos_total = parseInt(match[0], 10);
      }
    }

    // Extract process information
    $('.tabela-processo tr').each((index, row) => {
      if (index === 0) return; // Skip header row
      const processo = parseProcessDetails($, row);
      if (processo) {
        processos.push(processo);
      }
    });

    return {
      marca: searchParams.marca,
      processos,
      processos_total,
      classe,
      ncl: searchParams.ncl
    };

  } catch (error) {
    console.error('Error searching INPI:', error);
    if (error.response?.status === 403) {
      sessionCookie = null;
    }
    throw error;
  }
}

app.post('/api/search', async (req, res) => {
  try {
    const { marca, ncl, tipo, pagina } = req.body;
    
    if (!marca) {
      return res.status(400).json({
        error: 'Nome da marca é obrigatório'
      });
    }

    // Check cache
    const cacheKey = JSON.stringify({ marca, ncl, tipo, pagina });
    const cachedResult = cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
      return res.json(cachedResult.data);
    }

    const result = await searchINPI({ marca, ncl, tipo, pagina: pagina || 1 });

    // Update cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    res.json(result);

  } catch (error) {
    console.error('Erro na consulta:', error);
    res.status(500).json({
      error: error.message || 'Erro interno ao processar a consulta'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    sessionActive: !!sessionCookie,
    lastSessionRefresh: lastSessionRefresh ? new Date(lastSessionRefresh).toISOString() : null,
    cacheSize: cache.size
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  refreshSession().catch(console.error);
});