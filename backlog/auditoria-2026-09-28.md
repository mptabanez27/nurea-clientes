# Auditoria do portal — 28/09/2026

## Escopo e evidência

- Histórico local completo até `1ed57dd`: 15 commits, diffs e reflog; comparação de `main` com `origin/main` local.
- Revisão estática das rotas, banco, autenticação, componentes e documentação; `npm run check` e `npm run build` passaram. Não há suíte automatizada de fluxos ou autorização.
- Inspeção visual do `/admin` publicado em desktop após login autorizado: início, detalhe de post pendente e planejamento. Nenhuma mutação de dados de produção foi feita. A visualização mobile publicada e as políticas reais do Supabase não foram validadas.
- A conexão remota com GitHub falhou nesta sessão; a análise de histórico usa o clone local. O plugin GitHub está habilitado na instalação, mas sua ferramenta não foi disponibilizada para esta tarefa.

## Achados priorizados

1. **P0 — autorização de dados:** o login protege a página administrativa (`src/app/admin/page.tsx`), mas as rotas em `src/app/api/` não aplicam papel nem escopo de cliente. A URL com token resolve a página (`src/app/c/[token]/page.tsx`), enquanto as chamadas de dados posteriores usam `clientId`. A proteção precisa existir em cada rota, não só na tela.
2. **P0 — acesso direto ao banco:** `supabase-schema.sql` contém políticas RLS universais nas tabelas de clientes, meses, conteúdos e atividades. Verificar e corrigir as políticas implantadas.
3. **P0 — sessão e conteúdo de demonstração:** `src/lib/auth.ts` contém valores padrão para credenciais/sessão e compara o cookie a um segredo estático. `src/lib/db.ts` e `src/components/Portal.tsx` aceitam fallback de demonstração; erro de sincronização pode parecer conteúdo real.
4. **P1 — confiança nas operações:** mutações em `Portal.tsx` alteram a tela antes da confirmação da API e muitas falhas só vão ao console. Em `src/lib/db.ts`, `updatePlanStatusRecord` não grava `null` ao remover o arquivo. O detalhe do post grava conteúdo e status por requisições separadas, aumentando o risco de inconsistência.
5. **P1 — rastreabilidade:** `src/app/api/activities/route.ts` permite edição e exclusão de eventos de aprovação. Uma correção deve ser um novo evento, mantendo a decisão original.
6. **P1 — fluxo do planejamento:** no publicado, o exemplo ilustrativo habilita “Enviar para aprovação”. O produto documentado exige aprovação do planejamento antes da produção; a UI permite criar conteúdos antes disso.
7. **P1 — orientação no detalhe:** o feed e o detalhe têm boa base visual e a aprovação principal está destacada. A simulação do Instagram ocupa a maior parte da atenção e inclui ações fictícias; a legenda e os anexos exigem leitura lateral. Recomenda-se número/data e status no topo, mídia, legenda/anexos em seguida e ações reais agrupadas. Manter a simulação como visualização identificada.
8. **P1 — navegação e acessibilidade:** reordenação por arrastar não oferece alternativa visível para toque/teclado. A renumeração automática após reordenar ou excluir conflita com a decisão anterior de números fixos para conversar com o cliente. Meses de demonstração são pré-listados e a leitura do workspace pode criar ciclos implicitamente.

## Sequência sugerida

1. Fechar APIs e RLS; testar acesso cruzado e ações com e sem sessão.
2. Tornar gravações confiáveis, corrigir remoção do planejamento e separar demonstração de produção.
3. Ajustar fluxo e hierarquia visual; validar o painel no celular com clientes piloto.

Nenhum dado real de cliente ou credencial foi incluído neste registro.

## Implementação local após a auditoria

- Rotas com sessão da equipe ou token do cliente, escopo por `clientId`, validação de ações do cliente e upload apenas pela equipe. Login sem valores padrão no código e cookie assinado por sete dias.
- Esquema e migração SQL preparados para remover políticas RLS universais; execução e conferência no Supabase publicado ainda pendentes. Arquivos do bucket mantêm URLs públicas.
- Planejamento exige arquivo real, remoção envia `null` e a criação de novos posts depende do plano aprovado. Histórico recebe correções como novos eventos.
- Prévia Instagram da Studio Rose usa `@studiorosebrighenti` e alterna entre mês selecionado e todos os conteúdos disponíveis ao cliente, ordenados pela data mais recente. Ao abrir peça de outro mês, o portal troca o ciclo e abre o detalhe.
- `npm run check` e `npm run build` passaram. Chamadas sem sessão retornaram 401; com token de um cliente, a própria área retornou 200 e a de outro cliente retornou 403 no servidor de desenvolvimento. A grade completa e a abertura de peça de outro mês foram verificadas visualmente no navegador local.
- `npm run smoke:auth` automatiza esses testes de leitura/autorização sem alterar registros de cliente.
