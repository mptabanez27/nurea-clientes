# Registro de erros

## Resolvidos em 24/09/2026

- **Card de vídeo em preparação parecia sumir no mobile após recarga:** redimensionar a tela mantinha os oito cards da Equipe, mas recarregar restaurava o papel Cliente e ocultava os itens em preparação (cinco cards visíveis no teste). A escolha Equipe/Cliente agora persiste no navegador; a regra de ocultar rascunhos do Cliente foi preservada. Conferido em 390×844 após recarga.
- **Aviso de raiz incorreta do Next.js:** ele detectou também `E:\dev\package-lock.json`. Corrigido com `turbopack.root` no `next.config.ts`. Compilação passou novamente.
- **Breadcrumb concatenado no celular:** os nomes de contexto ficavam juntos quando separadores eram ocultados. Marcado o trecho de desktop separadamente e mantido apenas o título da tela no mobile.
- **Seletor ambíguo no teste de Stories:** o teste encontrava tanto o item do menu quanto “Ver Stories”. Corrigido o seletor de teste; não era falha da aplicação.

## Acompanhar

- Não foi encontrado um bug bloqueante nos fluxos testados. Ainda faltam testes automatizados permanentes, acessibilidade completa e testes com mídia real.

Ao identificar um problema, acrescente data, ambiente, passos para reproduzir, resultado esperado, resultado observado, impacto e estado. Não registre credenciais nem dados reais de clientes.

## Resolvido em 28/09/2026

- **Card do feed sem número de post:** no protótipo local, a prévia de um registro salvo sem `postNumber` exibia `POST —` (referência visual enviada em 28/09/2026). Esperado: toda publicação do feed ter número fixo. A grade agora preenche números ausentes, ordena pelo número e apresenta POST em destaque; novos registros recebem o próximo número. Impacto: identificação inconsistente das publicações para conversa com o cliente. Estado: corrigido no código; não foi feito teste automatizado.

- **Planejamento sem gestão do arquivo (28/09/2026, demo local):** abrir Planejamento como Equipe exibia apenas download do exemplo, sem upload/remover. Corrigido com gestão de imagem/PDF por ciclo; remoção do arquivo de teste confirmada após recarga.
- **Edição bloqueada após publicação (28/09/2026):** abrir um post publicado como Equipe desabilitava edição e ocultava ações de anexo. Corrigido: edição disponível em todos os status; mudanças materiais reiniciam revisão.
- **Persistência de logo e exclusão de posts após F5 (28/09/2026, produção):** alterações de logo e exclusão de publicações no painel administrativo eram revertidas ao recarregar a página (F5). Causas: ausência de chamadas à API de exclusão de posts no banco remoto, falha de permissão no upload direto de storage pelo navegador (RLS) e falta de sincronização persistente do enquadramento da logo. Corrigido criando rotas no servidor Next.js (`/api/upload`, `/api/contents`, `/api/clients/logo`, `/api/plan`, `/api/workspace`) executadas com privilégio administrativo para gravar e ler no Supabase sem depender do estado local do navegador.
- **Capa personalizada de vídeo sobreposta pelo frame inicial (28/09/2026):** no navegador, elementos `<video>` exibiam o primeiro frame do vídeo ao carregar metadados em vez da imagem selecionada como capa. Corrigido renderizando uma camada com a imagem da foto de capa sobre o player até o clique de execução, com transição suave para o vídeo em reprodução. Removida também a contagem de curtidas do mockup conforme solicitação de produto.
- **Proporção divergente no detalhe do post e corte de mídia (28/09/2026):** o card do detalhe forçava proporção quadrada (1:1), cortando fotos e capas que no feed eram exibidas em 3:4. Corrigido padronizando a moldura do modal para a proporção 3:4 com `object-fit: cover`.
- **Capa do vídeo fora da lista de anexos e sem enquadramento customizado (28/09/2026):** ao selecionar uma capa de vídeo, ela não era registrada como anexo visível nem permitia ajuste de zoom e enquadramento. Corrigido adicionando a capa à lista de anexos, permitindo reutilizar anexos existentes como capa e implementando o modal de enquadramento (pan & zoom) em proporção 3:4 persistido no banco remoto.
- **Seletor de mês não listava novo mês criado e perdia seleção após recarga (28/09/2026):** após criar um novo mês (ex.: Outubro de 2026), o menu suspenso de seleção continuava exibindo apenas "Setembro de 2026" ou descartava o mês criado ao sincronizar com o banco. Causas: ausência de persistência remota da tabela `month_cycles` ao disparar a criação, sobreposição total do mapa de meses locais pelo payload do servidor e ausência de descoberta de meses com conteúdos existentes. Corrigido com endpoint `POST /api/workspace/month`, enriquecimento de `loadWorkspaceData` para descobrir e garantir meses existentes/ativos e preservação de ciclos conhecidos no estado do cliente.
- **Simplificação do fluxo de aprovação de posts (28/09/2026):** removido botão lateral redundante e modal intermediário de aprovação (WhatsApp/Equipe), unificando a aprovação diretamente no botão principal "Aprovar post" fixado no rodapé com atualização imediata de status.


