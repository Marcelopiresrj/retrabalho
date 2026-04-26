const axios = require('axios');
require('dotenv').config();

// Função para testar envio de dados para o webhook (simulando Stitch)
async function testStitchIntegration() {
  try {
    // Dados de exemplo que o Stitch poderia enviar
    const stitchPayload = {
      // Metadados do Stitch (opcional)
      _sdc: {
        sequence: 1,
        table: 'manutencoes_campo',
        version: 1,
        primary_key: ['id']
      },
      // Dados reais da manutenção
      id: '550e8400-e29b-41d4-a716-446655440000',
      estado: 'São Paulo',
      cidade: 'São Paulo',
      armario: 'ARM-001',
      splitter: 'SPL-001',
      nome_ci: 'CI-SP-0001-2026',
      categoria: 'Falha de Energia',
      subcategoria: 'Queda de Tensão',
      sintoma: 'Intermitência no serviço',
      causa: 'Falha no cabo de alimentação',
      cumprimento_sla: 'Dentro',
      data_manutencao: '2026-04-26',
      is_rework: false
    };

    console.log('Enviando dados para webhook (simulando Stitch)...');
    console.log('Payload:', JSON.stringify(stitchPayload, null, 2));

    const response = await axios.post('http://localhost:3000/webhook', stitchPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STITCH_INTEGRATION_TOKEN}`
      }
    });

    console.log('Resposta do webhook:');
    console.log('Status:', response.status);
    console.log('Dados:', response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Erro no webhook:');
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      console.error('Erro de conexão: Servidor não está respondendo');
      console.error('Certifique-se de que o servidor está rodando com: npm start');
    } else {
      console.error('Erro ao configurar requisição:', error.message);
    }
    throw error;
  }
}

// Executar o teste
testStitchIntegration()
  .then(result => {
    console.log('\n✅ Teste de integração com Stitch concluído com sucesso!');
  })
  .catch(error => {
    console.error('\n❌ Falha no teste de integração com Stitch');
    process.exit(1);
  });