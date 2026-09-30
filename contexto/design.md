# Direção visual e de interação

Identidade atual: paleta e arquivos vetoriais do rebrand fornecidos em 28/09/2026. A assinatura oficial é `public/brand/logopng1.svg` (versão vetorial com fundo transparente) e o símbolo é `src/app/icon.svg`. Fonte padrão: **Plus Jakarta Sans**.

- Verde profundo `#0B1E18`
- Dourado `#C7A56B`
- Fundo off-white `#F7F4EE`
- Texto principal `#0B1E18`
- Superfície e bordas suaves `#E7DED2`

Interface editorial, silenciosa, com espaço e cartões claros. Dourado para ênfase, não para tudo. Não copiar curtidas, seguidores ou outros indicadores sociais fictícios.

No refinamento visual de 28/09/2026, a interface mantém a paleta Nurea e adota superfícies claras translúcidas no cabeçalho, capa do cliente e elementos de navegação. Blur é aplicado em áreas de sobreposição ou foco, com bordas suaves e sombras leves. O identificador `POST N` aparece em texto verde profundo, separado da data e do formato por hierarquia tipográfica, sem preenchimento dourado. Movimento comunica abertura, navegação e resposta ao toque; o modo de movimento reduzido elimina deslocamentos não essenciais.

## Mobile first

Projetar primeiro para telefone: entrar por link, escolher mês, ver pendências, tocar no card, ler legenda, navegar carrossel/vídeo, aprovar ou pedir ajuste e voltar ao feed. No celular, a grade tem duas colunas para dar legibilidade e maior protagonismo às peças; no desktop, três. O texto completo fica no detalhe ou na lista. Sidebar vira menu; Stories ficam em acesso próprio. Planejamento não ocupa a tela principal.

No celular, cabeçalho do cliente claro e mais curto, logo circular e resumo de status recolhido; o feed deve ocupar mais espaço visual que o painel superior. A logo é clicável para ampliar. Na visão da equipe, a janela de ampliação permite zoom de 50% a 220%, arraste para enquadrar no círculo e aro dourado opcional; só “Aplicar” persiste o ajuste.

O mês em foco aparece no cabeçalho e pode ser alternado entre os períodos já criados. A equipe pode abrir um novo mês sem perder o anterior. Um período recém-criado começa sem peças e sem planejamento enviado.

Cards do feed em proporção **3:4**, correspondente a 1080×1440, sem forçar corte quadrado. O status deve aparecer por extenso em etiqueta visível no card e com destaque maior no detalhe. A peça ilustrativa e os futuros arquivos finais devem preservar essa proporção quando forem desse formato; vídeo e Story podem exigir proporções próprias.

O formato (Arte, Carrossel, Reels) aparece em etiqueta própria na grade, separado do status. A mídia principal enviada pela equipe substitui a capa ilustrativa na prévia e no detalhe. Na ausência dela, o primeiro anexo visual é usado; vídeo com capa enviada mostra essa imagem antes do play e no feed, senão mostra um frame extraído quando possível. Imagens de outras proporções são exibidas sem corte forçado. Anexos visuais são clicáveis para pré-visualização dentro do detalhe.

Miniaturas leves e mídia completa sob demanda. Sem reprodução automática com som. Alvos de toque confortáveis, estados de carregamento/erro, foco visível, animações suaves e respeito a movimento reduzido. Hover é aprimoramento de desktop, nunca a única pista de clique.

## Referências visuais recebidas

- Esboço do usuário: barra lateral, feed 3×N com arte/Reels/carrossel, Stories em acesso separado. Está na conversa, não é layout pixel-perfect.
- `public/planejamento-exemplo.png`: template vertical de planejamento **exemplificativo**, não um documento real aprovado. Usá-lo somente como prévia de demonstração.




## Hierarquia de revisão — 28/09/2026

Capa compacta e resumo recolhido deixam a prévia do feed mais próxima da entrada. A aprovação é a ação visual dominante em barra fixa de vidro fosco no detalhe. O aprovado tem símbolo de confirmação e texto, além da cor. Comentário e ajuste são ações distintas. No desktop, mídia e legenda ficam lado a lado; no celular, atalhos evitam rolagem longa. O diálogo restringe foco por teclado e torna o conteúdo de fundo inerte. Translucidez preserva fundos legíveis e respeita movimento reduzido.

Na simulação do feed da Studio Rose, usar `@studiorosebrighenti`. O seletor discreto “Mês selecionado / Todo o portal” fica acima dos ícones da grade; a visão completa reúne as peças visíveis ao cliente de todos os ciclos, mais recentes primeiro. Ícones do Instagram são elementos visuais da prévia, sem botões fictícios de seguir, curtir ou salvar. Ações de aprovação e comentário permanecem nos controles próprios do portal.

## Identidade visual compartilhada — 30/09/2026

A landing aprovada em E:\dev\nurea (DESIGN.md, PRODUCT.md e .impeccable/design.json) é a referência visual comum. O portal usa verde profundo #0B1E18, off-white #F7F4EE, bege #E7DED2 e dourado #C7A56B como acento; #806136 fornece contraste para texto e foco em superfícies claras.

A leitura, a navegação, as tabelas, os dados e os controles usam Plus Jakarta Sans, carregada localmente pelo Fontsource. Playfair, com o arquivo local Playfair-72pt-Regular.ttf, aparece apenas em títulos da interface, como títulos de tela e de seção. O logo oficial da Nurea permanece no menu; o símbolo continua pontual. A logo carregada por cada cliente fica independente da identidade Nurea.

O vidro fosco fica restrito à navegação superior, aos controles sobrepostos do espaço do cliente e à barra fixa de revisão. Capa, cartões do feed, planejamento e superfícies de conteúdo são opacos. As peças e logos dos clientes não recebem filtro, zoom decorativo nem máscara da marca Nurea. O foco visível usa contorno de 2 px com dourado escuro sobre fundo claro e dourado sobre navegação escura. Movimento reduzido desativa animações e transições; transparência reduzida e navegadores sem backdrop-filter usam fundos opacos.

Esta atualização é visual. Mantém a estrutura mobile-first de planejamento, feed, aprovação e pedido de ajustes, sem alterar texto factual, regras de negócio, APIs, autenticação, permissões, dados ou armazenamento. Nenhuma publicação foi feita.
