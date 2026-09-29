# Próximos passos

## P0 — nuvem e produção (Concluído em 28/09/2026)

- [x] Autenticação e links de acesso exclusivos por token (`/c/[token]`) e painel da equipe (`/admin`).
- [x] Banco de dados em nuvem (PostgreSQL / Supabase) para clientes, ciclos, conteúdos e histórico.
- [x] Upload e armazenamento seguro de imagem, carrossel, vídeo e PDF no Supabase Storage (`midias`).
- [x] Auditoria de aprovação e ajustes em tempo real gravados no banco.
- [x] Isolamento de clientes (link do cliente travado em visualização da própria marca, sem seletor de equipe).

## P1 — produto

- [x] Mockup fiel do Instagram no detalhe da publicação (avatar, @usuário, botão seguir, barra de ações interativa com curtir/salvar/comentar e legenda formatada).
- [x] Proporção 3:4 alinhada entre prévia do feed e detalhe do post, eliminando corte quadrado forçado.
- [x] Capa do vídeo salva como anexo na lista de anexos e suporte a definir anexos de imagem existentes como capa.
- [x] Enquadramento de capa ajustado na edição do post replicado com fidelidade na grade do feed e na simulação Instagram mobile.
- [x] Simulação de feed Instagram Mobile em pop-up com grade de 3 colunas (3:4), badges de formato (Reels/Carrossel) e abertura direta de detalhes ao clicar (sem bio nem seguidores).
- [x] Player de vídeo interativo para Reels/vídeo: execução real sob clique, controles nativos de reprodução e vídeo demonstrativo de fallback quando ainda não há arquivo enviado.
- [x] Planejamento local por cliente/mês: upload imagem/PDF, substituição, remoção, versão, histórico e aprovação.
- [ ] Recuperar versões anteriores e implementar lixeira/limpeza de blobs sem referência (posts, mídias, logos e planejamentos removidos/substituídos).
- [x] Seleção e persistência de novos meses (Setembro/Outubro e novos períodos) com sincronização em nuvem, histórico preservado e sem perda de contexto ao alternar períodos.
- [x] Aprovação direta no rodapé simplificada sem modal intermediário, comentários com identificação de autor e edição/exclusão de histórico sincronizados no banco de dados.
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
