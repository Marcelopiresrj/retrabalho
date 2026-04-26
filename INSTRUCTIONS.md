# Instruções para Configuração Completa

## 1. Criar a Tabela no Supabase

Como a chave anonima não tem permissões para criar tabelas, você precisa executar o SQL manualmente:

1. Acesse: https://supabase.com/dashboard/project/molbeloiqobljrijnbdb/sql
2. Clique em "New query"
3. Copie e cole o conteúdo completo do arquivo `setup_manutencoes_campo.sql`
4. Clique em "Run"

## 2. Verificar se a Tabela Foi Criada

Depois de executar o SQL, você pode verificar:

1. Vá para a seção "Table Editor" no painel do Supabase
2. Procure pela tabela `manutencoes_campo`
3. Verifique se todas as colunas estão presentes conforme especificado

## 3. Testar a Conectividade

Depois que a tabela estiver criada:

```bash
# Inicie o servidor
npm start

# Em outro terminal, teste o ping-pong
curl http://localhost:3000/ping-pong
```

Você deve receber uma resposta similar a:
```json
{
  "status": "success",
  "message": "Ping-pong connectivity test passed",
  "test": {
    "insert": true,
    "read": true,
    "cleanup": true
  },
  "timestamp": "2026-04-26T16:30:56.000Z"
}
```

## 4. Testar o Webhook

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook data"}'
```

## Arquivos Importantes

- `.env` - Contém as credenciais do Supabase (URL e chave anonima)
- `supabaseClient.js` - Cliente Supabase configurado
- `server.js` - Servidor Express com webhook e testes
- `setup_manutencoes_campo.sql` - SQL para criar tabela e índices
- `test_connection.js` - Testa apenas a conexão com Supabase
- `INSTRUCTIONS.md` - Este arquivo

## 5. Integração com Stitch Data

O sistema está pronto para receber dados do Stitch via Webhook.

1. Configure o Stitch Data para enviar dados para: `http://seu-dominio:3000/webhook`
2. Certifique-se de que a tabela `manutencoes_campo` foi criada e o RLS foi desativado (conforme o arquivo SQL).

## 6. Deploy na Vercel

O projeto está configurado para deploy automático na Vercel.

### Passos para subir:

1.  Crie um novo projeto na Vercel importando este repositório.
2.  Configure as **Variáveis de Ambiente** na Vercel (iguais ao seu `.env`):
    *   `SUPABASE_URL`
    *   `SUPABASE_ANON_KEY` (use a Service Role Key para evitar bloqueio de RLS)
    *   `SUPABASE_PAT`
    *   `STITCH_INTEGRATION_TOKEN`
3.  O arquivo `vercel.json` cuidará do roteamento automático.

## Arquivos Atualizados

- `public/` - Contém o Frontend completo (Dashboard moderno).
- `server.js` - Atualizado para servir o frontend e novos endpoints de API.
- `vercel.json` - Configuração de deploy.
- `.env` - Contém as chaves finais.