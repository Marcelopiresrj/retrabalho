# Sistema Repedidas - Integração Supabase

## Estrutura do Projeto

- `.env` - Variáveis de ambiente (URL e chave anonima do Supabase)
- `supabaseClient.js` - Cliente Supabase configurado
- `server.js` - Servidor Express com webhook e teste de conectividade
- `setup_manutencoes_campo.sql` - Script SQL para criação da tabela e índices
- `package.json` - Dependências e scripts

## Funcionalidades Implementadas

### 1. Tabela `manutencoes_campo`
Criada com as colunas especificadas:
- id (UUID, PK)
- Geografia: estado, cidade, armario
- Elemento de Rede: splitter, nome_ci
- Diagnóstico: categoria, subcategoria, sintoma, causa
- Operacional: cumprimento_sla, data_manutencao
- Inteligência: is_rework (default: false)

### 2. Índices de Performance
- `idx_manutencoes_campo_nome_ci` - para buscas por nome_ci
- `idx_manutencoes_campo_data_manutencao` - para consultas por data

### 3. Webhook de Entrada
Endpoint: `POST /webhook`
- Recebe JSON de entrada
- Pode ser estendido para processar e inserir dados na tabela

### 4. Teste de Conectividade (Ping-Pong)
Endpoint: `GET /ping-pong`
- Insere uma linha de teste na tabela
- Lê a linha inserida
- Remove a linha de teste (limpeza)
- Retorna status de sucesso/falha

## Como Usar

### 1. Configurar o Supabase
1. Execute o script SQL em `setup_manutencoes_campo.sql` no SQL Editor do seu projeto Supabase
2. Verifique se a tabela foi criada corretamente

### 2. Iniciar o Servidor Local
```bash
npm start
```

### 3. Testar a Conectividade
```bash
curl http://localhost:3000/ping-pong
```

### 4. Enviar Webhook de Teste
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Variáveis de Ambiente
Certifique-se de que o arquivo `.env` contenha:
```
SUPABASE_URL=https://seuprojeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## Próximos Passos
1. Implementar a lógica de processamento no endpoint `/webhook` para converter o JSON de entrada em registros na tabela `manutencoes_campo`
2. Configurar autenticação segura se necessário (usar service_role key para operações backend)
3. Deploy em ambiente de produção (Heroku, Vercel, AWS, etc.)