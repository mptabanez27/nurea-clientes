# Produto e regras de negócio

## Objetivo

Um portal para a agência Nurea apresentar o planejamento mensal, mostrar os conteúdos do Instagram como um feed, receber aprovações e pedidos de ajuste e acompanhar publicação. O cliente deve entender rapidamente o que precisa aprovar. Marcos e Luiza devem conseguir trabalhar em todos os clientes. O Trello e as decisões dispersas no WhatsApp serão substituídos gradualmente, não de uma vez.

## Fluxo confirmado

1. A equipe cria e envia o planejamento mensal em arte/PDF.
2. O cliente aprova o planejamento ou pede revisão. Uma aprovação válida basta; registrar autor, data e versão. Silêncio não significa aprovação.
3. Só após a aprovação do planejamento começa a produção das peças.
4. Cada peça passa por revisão interna, aprovação do cliente, eventuais ajustes, agendamento e publicação. Aprovar o planejamento **não** aprova as peças finais.
5. A equipe avisa o cliente pelo WhatsApp quando há algo para analisar. Notificações automáticas não são requisito inicial.
6. Um pedido de ajuste pertence a uma versão de uma peça, com comentário obrigatório. Depois do ajuste, nova versão e nova revisão/aprovação quando material.

## Formatos

- Arte estática, carrossel e Reels/vídeo aparecem na grade do feed.
- Story original tem área própria, fora da grade, mas usa o mesmo fluxo de aprovação e ajustes.
- Compartilhar no Story um post já publicado no feed usando o Instagram não cria nova peça nem nova aprovação; pode ser marcado como tarefa operacional ligada ao post.
- Story criado do zero é conteúdo novo cobrado como tal. Ainda é preciso decidir se ocupa uma unidade do pacote ou é extra.
- Vídeo requer capa/miniatura e reprodução no detalhe; carrossel permite percorrer páginas. O fluxo de aprovação continua único por publicação/versão.
- Se não houver mídia principal, o primeiro anexo de imagem ou vídeo serve de capa do card. Outros anexos visuais podem ser abertos na prévia dentro do detalhe. PDF e documentos nunca viram capa automaticamente.

## Experiência desejada

- Link direto ao espaço do cliente após autenticação. Equipe vê todos; cliente vê apenas os seus dados.
- Na demonstração local, a equipe pode trocar o espaço ativo pelo cartão lateral entre cinco clientes nomeados pela Nurea. Cada espaço tem posts, Story, planejamento e logo independentes. Os conteúdos de exemplo são genéricos e não representam publicações reais.
- Conteúdos é a tela principal. Toda arte é clicável; a grade usa três colunas no desktop e duas no celular para dar mais destaque às peças, mantendo a proporção 3:4.
- Na criação, a equipe escolhe formato, data, legenda e pode selecionar a mídia principal no computador. Arte usa uma imagem; carrossel, até dez imagens ordenadas; Reels, um vídeo; Story original, uma imagem ou vídeo. A grade e o detalhe mostram o arquivo escolhido, e o tipo de publicação fica legível na grade. Ao editar, a equipe pode trocar formato e mídia; uma mídia incompatível com o novo formato exige substituição.
- Detalhe em estilo de cartão simplificado: data da postagem em destaque acima da capa; mídia; legenda como um único bloco, incluindo eventual chamada para ação no próprio texto; anexos; status, histórico e ação contextual Aprovar/Pedir ajuste. A equipe pode editar data e legenda. No celular, detalhe em tela cheia.
- Um vídeo anexado pode ser selecionado na lista de anexos e reproduzido com controles no próprio detalhe. A equipe pode enviar uma imagem de capa específica para esse anexo; ela aparece antes do play e, se o vídeo for a mídia visual usada pelo card, também no feed. Sem capa personalizada, usa-se um frame extraído quando o navegador o decodifica. Escolher um frame manualmente no vídeo continua sendo melhoria futura.
- A tela principal tem cabeçalho claro e compacto com nome, logo circular e mês em foco. A logo pode ser ampliada por qualquer perfil; a equipe pode trocá-la e ajustar zoom e posição dentro do círculo, com aro opcional. Os ajustes são específicos de cada cliente.
- Cada cliente pode ter vários meses independentes. A equipe cria períodos, alterna o mês em foco e adiciona peças ao período escolhido; cliente pode consultar os meses já existentes. A data da peça pode cruzar o limite do mês editorial (por exemplo, uma peça de início de outubro prevista no ciclo de setembro).
- O feed é prioritário: cabeçalho compacto, resumo de status recolhido em “Andamento do mês” e filtro de pendências. A grade completa mantém a sequência fixa dos posts; o filtro não renumera as peças. A visão da equipe inclui “Em preparação”, oculto na visão do cliente.
- Planejamento é secundário na navegação. Sua página mostra o PDF/arte vertical, status, versão, aprovação e download.
- Pedido de ajuste: campo livre obrigatório; indicação da parte a alterar pode ser opcional. Não transformar em formulário complexo.
- Equipe deve poder operar vários ajustes por prompt no futuro, com prévia antes de aplicar, alteração apenas dos registros selecionados e histórico. Essa integração ainda não existe.

## Calendário sazonal

Preparar o calendário para mês/ano correto, com dias da semana calculados, datas pesquisadas em fontes verificáveis e revisão humana. Separar feriado de data temática. Filtrar por segmento e região do cliente. O planejamento aprovado é uma versão congelada; mudanças geram nova versão.

## Estado atual e restrições

O portal usa Next.js e Supabase com painel de equipe e links exclusivos por cliente. A autorização foi adicionada às rotas no código em 28/09/2026; a migração RLS precisa ser aplicada e conferida no Supabase implantado antes de ampliar o uso com dados reais. A grade Instagram é uma prévia visual, sem integração de publicação. O armazenamento ainda retorna URLs públicas de mídia e precisa de revisão antes de tratar arquivos como privados.



## Revisão simplificada — 28/09/2026

- Detalhe identifica o POST fixo e mostra data, arte, legenda e anexos. No desktop, arte e legenda ficam lado a lado; no celular há atalhos para legenda e anexos.
- Barra fixa de ações: Aprovar post (prioritária enquanto aguarda aprovação), Pedir ajuste e Comentar. Aprovar altera imediatamente o card com selo, borda e superfície verde suave e atualiza a contagem. Comentários não alteram status; ajustes exigem texto e entram no histórico da versão.
- Equipe edita título, categoria, formato, data, legenda, mídia, link publicado e compartilhamento em Story, inclusive após publicação. Pode remover/reordenar mídia, substituir arquivos, definir capa de vídeo principal ou anexo, remover anexos, excluir uma peça e remover a logo do cliente.
- Alterações de conteúdo/arquivos criam versão em preparação e exigem reenvio/aprovação, inclusive em peças publicadas. Link e marca de compartilhamento são dados operacionais e não invalidam aprovação. O histórico de decisões permanece como registro.
- A reordenação e a exclusão mantêm a regra atual de renumerar a grade do mês; a equipe reorganiza os posts arrastando os cards, sem botões de seta.
- Planejamento aceita imagem/PDF de até 20 MB por cliente/mês: adicionar, substituir, remover, baixar e enviar para aprovação. Trocar/remover invalida aprovação anterior e registra versão/atividade. O exemplo ilustrativo não pode ser enviado. Em produção, o arquivo é enviado ao Storage e sua referência é salva no banco; versões anteriores ainda não têm restauração pela interface.

## Ajustes de fluxo — 28/09/2026

- Mantemos a numeração de POST 1, POST 2 etc. e sua regra atual de reordenação, conforme a última orientação do usuário.
- A prévia em grade da Studio Rose mostra `@studiorosebrighenti`. O seletor compacto oferece o mês escolhido ou os conteúdos disponíveis ao cliente em todos os meses do portal, em ordem de data mais recente; a seleção de uma peça de outro mês abre seu detalhe no ciclo correspondente. Isso não indica publicação no Instagram.
- A equipe precisa anexar um documento real antes de enviar o planejamento. O exemplo ilustrativo nunca habilita o envio. A produção de novas peças começa após aprovação do planejamento.
- Ações no histórico são corrigidas por novos eventos visíveis, sem apagar a decisão original.
