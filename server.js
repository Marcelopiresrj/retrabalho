require('dotenv').config();
const express = require('express');
const path = require('path');
const { supabase } = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// Webhook endpoint to receive JSON
app.post('/webhook', async (req, res) => {
  try {
    // Basic Authorization check
    const authHeader = req.headers['authorization'];
    const expectedToken = process.env.STITCH_INTEGRATION_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized webhook attempt');
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('Webhook received:', JSON.stringify(payload, null, 2));
    
    // Mapping payload fields to database columns
    // Stitch Data often sends data in a flat structure, but we might need to handle specific mappings
    const dataToInsert = {
      id: payload.id || undefined, // Use provided ID or let database generate one
      estado: payload.estado,
      cidade: payload.cidade,
      armario: payload.armario,
      splitter: payload.splitter,
      nome_ci: payload.nome_ci,
      categoria: payload.categoria,
      subcategoria: payload.subcategoria,
      sintoma: payload.sintoma,
      causa: payload.causa,
      // Handle discrepancy between SQL (cumplimento) and payload (cumprimento)
      cumplimento_sla: payload.cumplimento_sla || payload.cumprimento_sla,
      data_manutencao: payload.data_manutencao,
      is_rework: payload.is_rework === true || payload.is_rework === 'true'
    };

    console.log('Inserting into Supabase:', dataToInsert);

    const { data, error } = await supabase
      .from('manutencoes_campo')
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(400).json({ 
        status: 'error', 
        message: 'Failed to insert data into Supabase',
        error: error.message 
      });
    }
    
    res.status(201).json({ 
      status: 'success', 
      message: 'Data integrated successfully',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error',
      details: error.message
    });
  }
});

// Endpoint to list all maintenance records
app.get('/manutencoes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('manutencoes_campo')
      .select('*')
      .order('data_manutencao', { ascending: false });

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Endpoint to get stats (dashboard data)
app.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('manutencoes_campo')
      .select('categoria, cumplimiento_sla');

    if (error) throw error;

    // Basic stats calculation
    const stats = {
      total: data.length,
      por_categoria: {},
      sla_cumprido: data.filter(d => d.cumplimento_sla === 'Dentro').length
    };

    data.forEach(d => {
      stats.por_categoria[d.categoria] = (stats.por_categoria[d.categoria] || 0) + 1;
    });

    res.json({ status: 'success', data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ping-pong connectivity test endpoint
app.get('/ping-pong', async (req, res) => {
  try {
    // Test 1: Insert a test row
    const testData = {
      estado: 'Test Estado',
      cidade: 'Test Cidade',
      armario: 'Test Armario',
      splitter: 'Test Splitter',
      nome_ci: 'TEST-CI-' + Date.now(),
      categoria: 'Test Categoria',
      subcategoria: 'Test Subcategoria',
      sintoma: 'Test Sintoma',
      causa: 'Test Causa',
      cumplimento_sla: 'Dentro',
      data_manutencao: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      is_rework: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('manutencoes_campo')
      .insert(testData)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Test 2: Read the inserted row
    const { data: selectData, error: selectError } = await supabase
      .from('manutencoes_campo')
      .select('*')
      .eq('nome_ci', testData.nome_ci)
      .single();

    if (selectError) {
      throw selectError;
    }

    // Test 3: Clean up - delete the test row
    const { error: deleteError } = await supabase
      .from('manutencoes_campo')
      .delete()
      .eq('nome_ci', testData.nome_ci);

    if (deleteError) {
      console.warn('Warning: Could not clean up test row:', deleteError);
      // Don't fail the test for cleanup issues
    }

    res.json({
      status: 'success',
      message: 'Ping-pong connectivity test passed',
      test: {
        insert: insertData.length > 0,
        read: !!selectData,
        cleanup: !deleteError
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ping-pong test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Connectivity test failed',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`Ping-pong test: http://localhost:${PORT}/ping-pong`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;