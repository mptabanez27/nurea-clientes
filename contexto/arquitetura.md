# Arquitetura atual

Aplicação Next.js 16 (App Router), React e TypeScript. O servidor acessa PostgreSQL e Storage do Supabase com `SUPABASE_SERVICE_ROLE_KEY`. O navegador usa apenas as rotas em `src/app/api`; a chave privilegiada permanece no servidor. Em desenvolvimento há dados locais de demonstração; em produção o portal mostra carregamento/erro quando a nuvem não responde, sem apresentar a demonstração como conteúdo real.

## Acesso

- `/admin`: credenciais definidas por `ADMIN_USER` e `ADMIN_PASSWORD`, sem padrões no código. A sessão é um cookie HTTP only assinado com `SESSION_SECRET`, válido por sete dias. Mudar o segredo invalida sessões anteriores.
- `/c/[token]`: o token é resolvido no banco e acompanha as chamadas do cliente. Cada rota compara o token com o `clientId` solicitado. Rotas de equipe, como criar/editar posts, clientes, logos, meses e arquivos, exigem sessão administrativa.
- As tabelas devem negar acesso direto a `anon` e `authenticated`. O script `supabase-security-migration.sql` remove as políticas universais antigas. **Esse script ainda precisa ser aplicado e validado no Supabase da implantação.**
- O bucket de mídia ainda produz URLs públicas. O link do portal controla dados e ações, mas não revoga uma URL de arquivo já compartilhada. Mídia privada por cliente requer bucket privado e entrega autenticada em etapa própria.

## Dados e operações

- `clients`, `month_cycles`, `contents` e `activities` guardam espaços, períodos, publicações e decisões. O número do post segue a regra atual da interface, mantida por orientação do usuário.
- O planejamento só pode ser enviado à aprovação com arquivo próprio. Remoção grava `null` no banco. Correções de histórico geram novos eventos.
- A prévia “Todo o portal” lê os períodos existentes do mesmo cliente, exclui rascunhos internos e ordena a grade pela data da publicação. A prévia “Mês selecionado” mantém o comportamento atual.
- Uploads passam pela rota administrativa com validação de formato/tamanho e caminho gerado no servidor. Ainda falta limpeza de arquivos órfãos e operação transacional para decisões compostas.

## Antes de publicar esta revisão

1. Configurar as variáveis de `.env.example` no ambiente de hospedagem e substituir os valores antigos; nunca enviar seus valores ao repositório.
2. Aplicar `supabase-security-migration.sql` no projeto Supabase existente e conferir políticas e permissões reais, inclusive Storage.
3. Testar sessão administrativa, dois links de clientes distintos, aprovações e remoção de arquivo em ambiente de homologação com dados descartáveis.
4. Rever URLs públicas de mídia antes de prometer sigilo dos anexos por cliente.

O aplicativo publicado não muda até que esta revisão seja implantada. Não há integração de postagem no Instagram nem agente de edição automática.
