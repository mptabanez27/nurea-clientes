# Próximos passos

## P0 — antes de produção

- [ ] Autenticação real e autorização por cliente/equipe, incluindo mídia.
- [ ] Banco de dados para ciclos, planejamento, peças, versões, decisões e comentários.
- [ ] Upload e armazenamento seguro de imagem, vídeo e PDF; prévias/miniaturas.
- [ ] Auditoria: quem aprovou, quando, qual versão e o que mudou.
- [ ] Testes de isolamento entre clientes e fluxo de revisão.

## P1 — produto

- [x] Planejamento local por cliente/mês: upload imagem/PDF, substituição, remoção, versão, histórico e aprovação.
- [ ] Recuperar versões anteriores e implementar lixeira/limpeza de blobs sem referência (posts, mídias, logos e planejamentos removidos/substituídos).
- [ ] Levar os fluxos locais de comentário, ajuste e aprovação ao backend com identidade autenticada.
- [ ] Permitir escolher manualmente um frame do vídeo como capa; o upload de imagem de capa já existe para mídia principal e anexos de vídeo, mas a miniatura automática pode falhar com alguns codecs.
- [ ] Painel da equipe com todos os clientes e pendências.
- [ ] Gerador assistido do calendário sazonal com fontes e revisão.
- [ ] Integração de edição seletiva por agente, com prévia e confirmação.
- [ ] Definir se Story original consome unidade do pacote ou é extra.
- [ ] Confirmar regras de prazos, número de rodadas de ajuste e acesso do cliente.

## P2 — operação

- [ ] Piloto com um ou dois clientes e plano de saída do Trello.
- [ ] Decidir hospedagem e configurar domínio sem expor dados antes de P0.
