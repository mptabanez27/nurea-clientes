# Progresso da primeira entrega local

## Implementado

- Projeto Next.js separado em `E:\dev\nurea-clientes`, porta 3002.
- Interface desktop e mobile first com identidade do NureaOS e Plus Jakarta Sans.
- Feed 3 colunas, visualização em lista, capas clicáveis e detalhe com data em destaque, legenda única, anexos e histórico.
- Capa do espaço do cliente com nome, logo substituível e mês vigente em destaque.
- Logo circular clicável: cliente amplia para ver; equipe pode ampliar, ajustar zoom/posição por arraste e aplicar o enquadramento. Ajustes persistem por cliente no mesmo navegador.
- Seletor de mês em foco por cliente. A equipe cria novos ciclos vazios; publicações e status do planejamento ficam separados por mês e persistem após recarga. O mês editorial pode conter peças com data de publicação no início do mês seguinte.
- Carrossel navegável, Reels reproduzível quando há vídeo enviado, Story original em área própria e capas ilustrativas como fallback quando não há arquivo.
- Planejamento acessível pelo menu, com template ilustrativo, status e histórico.
- Simulação Cliente/Equipe; aprovação, pedido de ajuste com comentário, criação/edição de conteúdo, transições de status e registro do repost no Story.
- Persistência **apenas local** no navegador para a demonstração: estado no localStorage e logo/anexos/mídia principal no IndexedDB. Não há sincronização entre dispositivos.

## Verificado

- `npm run check` e `npm run build` passaram.
- Teste manual automatizado no navegador a 390×844: grade, aprovação, persistência após recarga, navegação ao planejamento e ausência de rolagem horizontal.
- Teste manual automatizado em desktop: pedido de ajuste, edição da legenda com nova versão e retorno à preparação, acesso a Stories.
- Revisão visual por captura de tela em desktop e celular.
- Revisão do novo detalhe em 390×844 e 1280×800; edição da data criou nova versão, anexo e logo persistiram após recarga, sem rolagem horizontal.
- Cards do feed ajustados para 3:4; status visível por texto na grade e ampliado no detalhe. Proporção conferida em 390px e 1280px de largura, sem rolagem horizontal.
- Faixa de resumo substituída por mini painel de status do feed: cinco estados para cliente, seis para equipe. Contadores reagem às mudanças de aprovação; conferidos em mobile e desktop.
- Cinco espaços de demonstração separados: Meliza Doces, Studio Rose Brighenti, Papillon Parfums, Elite Academia e Centro de Dança Impulso. A equipe troca pelo cartão da barra lateral; a seleção e as alterações persistem localmente. O exemplo Ateliê Aurora foi removido da interface e dos dados iniciais.
- Teste dos cinco espaços no celular: nome, feed e logo isolados; seletor oculto na prévia do cliente. Edição de post em Papillon não apareceu em Meliza e persistiu após recarga. `npm run check` e `npm run build` passaram.
- Criação com imagem principal, carrossel com duas imagens e vídeo testados no navegador. Imagem persistiu após recarga; edição de carrossel para Reels exigiu novo vídeo e atualizou o formato na grade.
- Fluxo de revisão verificado após upload: cliente aprovou a imagem; mudança posterior de formato criou nova versão em preparação e ocultou a peça da visão do cliente até reenvio. `npm run check` e `npm run build` passaram.
- Topo redesenhado em fundo claro, mais compacto no celular, com logo ampliada; painel de status em duas linhas e feed mobile em duas colunas. Ajuste de escala/borda da logo testado com persistência após recarga e isolamento entre clientes.
- Logo circular conferida no navegador mobile com arquivo enviado: zoom, arraste, visualização somente leitura para cliente e persistência após recarga. Meses setembro/outubro testados: outubro começa vazio, criação de peça cai no ciclo certo e setembro permanece intacto.
- Anexo MP4 testado: seleção na lista, reprodução no detalhe, frame automático na grade e miniatura persistente após recarga. A mídia principal continua tendo prioridade; anexos visuais só viram capa quando ela não existe.
- Capa personalizada para vídeo anexado: upload de imagem, prévia antes do play, capa no feed e persistência após recarga testados em desktop/mobile. Modo Equipe também persiste ao recarregar, evitando que um vídeo em preparação pareça desaparecer ao testar a visualização mobile.

## Limites da entrega

- Sem autenticação ou autorização real. O seletor de papel é **simulação**.
- Sem banco de dados ou uploads para servidor e sem PDF privado. Mídias e anexos escolhidos ficam só no navegador que os adicionou; vídeos grandes ainda dependem da cota local e do suporte do navegador ao formato.
- Sem integração com WhatsApp, Instagram, agente ou calendário sazonal automatizado.
- Sem dashboard consolidado de todos os clientes: a equipe troca de espaço pelo seletor lateral, mas vê apenas um de cada vez.
- Não publicar, nem adicionar material real de clientes, até concluir o P0.

## 28/09/2026 — fluxo de revisão e gestão de arquivos

- Feed priorizado, filtro de pendências, resumo recolhido e número fixo no detalhe/lista.
- Aprovação fixa com retorno visual na grade; comentário sem mudar status e ajuste com texto obrigatório.
- Edição de posts publicados liberada, arquivos removíveis/reordenáveis, capa para mídia principal, exclusão de post e remoção de logo.
- Planejamento local com upload, substituição, remoção persistente, preview imagem/PDF, download e envio para aprovação.
- Verificação: TypeScript e build de produção passaram. Navegador: aprovação altera card/contagem; comentário mantém aprovado; ajuste registra histórico e permite reenvio; dado operacional pode ser salvo/desmarcado em post publicado sem invalidar status; upload de imagem de planejamento, remoção e estado vazio após recarga confirmados. Desktop e viewport mobile 390×844 inspecionados. PDF e codecs de vídeo não foram exercitados neste ciclo.

## 30/09/2026 — identidade visual compartilhada

- A camada visual local foi alinhada à landing aprovada: tokens Nurea, Playfair local apenas em títulos de tela e Plus Jakarta Sans local no restante da interface.
- Vidro limitado à navegação superior, controles de sobreposição e barra fixa de revisão; superfícies de dados e mídias seguem opacas. As imagens e logos dos clientes continuam sem tratamento da marca Nurea.
- O escopo foi visual e documental. Feed mobile, planejamento, aprovações e pedidos de ajuste mantêm seus componentes e fluxos; não houve alteração de APIs, autenticação, permissões, dados ou armazenamento.
- A alteração local já existente em next-env.d.ts foi preservada. Nenhum deploy ou envio de conteúdo foi feito.
- Verificações finais: `npm run check -- --incremental false`, `npm run build` e `git diff --check` passaram. O build foi seguido da restauração byte a byte do `next-env.d.ts`; o diff local nos caminhos `.next/dev` permaneceu preservado.
- Revisão visual em desktop e viewport mobile 390×844: conteúdo sem rolagem horizontal, grade de feed em duas colunas e foco de teclado visível no link para pular ao conteúdo. Movimento reduzido e fallback opaco/transparência foram conferidos no CSS; as preferências do sistema não foram emuladas no navegador.
- O detector visual sinalizou somente Plus Jakarta Sans como fonte repetida, exigida pela identidade compartilhada. Não houve testes de domínio ou integração, pois nenhuma regra de negócio mudou; a prévia usou dados de demonstração com Supabase desativado.
