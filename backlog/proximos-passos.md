# Próximos passos

## P0 — reaberto pela auditoria de 28/09/2026

- [x] Aplicar autenticação às APIs de equipe e conferir o token do cliente nas leituras e decisões. Uploads são exclusivos da equipe; validar novamente na implantação.
- [ ] Revisar as políticas RLS ativas no Supabase e substituir as regras universais do esquema; bloquear acesso direto não autorizado e testar duas identidades de cliente.
- [ ] Configurar credenciais e novo segredo de sessão no ambiente publicado; o código não tem mais valores padrão e assina cookies de sete dias, mas ainda falta sessão revogável por usuário.
- [x] Eliminar fallback de dados de demonstração em produção e mostrar carregamento/erro de sincronização.
- [ ] Cobrir autorização, isolamento entre clientes e ações críticas com testes integrados antes de novos dados reais.
- [ ] Aplicar `supabase-security-migration.sql` e revisar URLs públicas do bucket `midias`; migrar arquivos sensíveis para entrega autenticada.

## P0 — nuvem e produção (implementação inicial em 28/09/2026; segurança pendente)

- [x] Autenticação e links de acesso exclusivos por token (`/c/[token]`) e painel da equipe (`/admin`).
- [x] Banco de dados em nuvem (PostgreSQL / Supabase) para clientes, ciclos, conteúdos e histórico.
- [x] Upload e armazenamento seguro de imagem, carrossel, vídeo e PDF no Supabase Storage (`midias`).
- [x] Auditoria de aprovação e ajustes em tempo real gravados no banco.
- [x] Isolamento de clientes (link do cliente travado em visualização da própria marca, sem seletor de equipe).

O isolamento agora é aplicado no código das APIs. A produção ainda depende de implantação, migração RLS e validação das permissões reais do Supabase.

## P1 — correções e UX da revisão de 28/09/2026

- [x] Fazer remoção de arquivo do planejamento gravar `null` no banco e impedir envio do exemplo ilustrativo; validar com um arquivo descartável em homologação.
- [ ] Confirmar cada gravação com o servidor; mostrar salvando, sucesso e falha; permitir repetir a ação sem perda de dados.
- [x] Preservar o histórico de aprovação com eventos de correção, sem editar/apagar decisões anteriores.
- [ ] Guiar o detalhe do post nesta ordem: número e data, mídia, legenda e anexos, decisão; manter “Aprovar post” como ação principal visível.
- [x] Identificar a simulação do Instagram e retirar controles simulados que pareciam operacionais.
- [x] Adicionar botões de reordenação para toque e teclado na grade e na lista, mantendo a regra de numeração atual por decisão do usuário.
- [x] Mostrar meses existentes e criar um ciclo somente após ação explícita da equipe.
- [x] Exigir planejamento aprovado para criar novos posts; revisar exceções operacionais no piloto.
- [ ] Fazer auditoria de acessibilidade e do fluxo mobile no painel publicado, seguida de teste com clientes piloto.
- [x] Mostrar `@studiorosebrighenti` na simulação e alternar entre mês selecionado e todos os conteúdos disponíveis ao cliente no portal.

## P1 — produto

- [x] Mockup visual do Instagram no detalhe da publicação, com legenda e mídia; controles sociais fictícios foram retirados na revisão de UX.
- [x] Proporção 3:4 alinhada entre prévia do feed e detalhe do post, eliminando corte quadrado forçado.
- [x] Capa do vídeo salva como anexo na lista de anexos e suporte a definir anexos de imagem existentes como capa.
- [x] Enquadramento de capa ajustado na edição do post replicado com fidelidade na grade do feed e na simulação Instagram mobile.
- [x] Simulação de feed Instagram Mobile em pop-up com grade de 3 colunas (3:4), badges de formato (Reels/Carrossel) e abertura direta de detalhes ao clicar (sem bio nem seguidores).
- [x] Player de vídeo interativo para Reels/vídeo: execução real sob clique, controles nativos de reprodução e vídeo demonstrativo de fallback quando ainda não há arquivo enviado.
- [x] Planejamento local por cliente/mês: upload imagem/PDF, substituição, remoção, versão, histórico e aprovação.
- [ ] Recuperar versões anteriores e implementar lixeira/limpeza de blobs sem referência (posts, mídias, logos e planejamentos removidos/substituídos).
- [x] Seleção e persistência de novos meses (Setembro/Outubro e novos períodos) com sincronização em nuvem, histórico preservado e sem perda de contexto ao alternar períodos.
- [x] Aprovação direta no rodapé sem modal intermediário e comentários com autor; correções do histórico agora criam novos eventos.
- [x] Proteção contra perda acidental em 'Restaurar demonstração' (modal exigindo digitação de 'RESTAURAR') e botão de 'Sincronizar nuvem' no painel.
- [ ] Permitir escolher manualmente um frame do vídeo como capa; o upload de imagem de capa já existe para mídia principal e anexos de vídeo, mas a miniatura automática pode falhar com alguns codecs.
- [ ] Painel da equipe com todos os clientes e pendências.
- [ ] Gerador assistido do calendário sazonal com fontes e revisão.
- [ ] Integração de edição seletiva por agente, com prévia e confirmação.
- [ ] Definir se Story original consome unidade do pacote ou é extra.
- [ ] Confirmar regras de prazos, número de rodadas de ajuste e acesso do cliente.

## P2 — operação

- [ ] Piloto com um ou dois clientes e plano de saída do Trello.
- [ ] Decidir hospedagem e configurar domínio sem expor dados antes de P0.
