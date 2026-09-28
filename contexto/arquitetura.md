# Arquitetura atual e evolução

## Agora

Aplicação Next.js (App Router), React, TypeScript e CSS. O protótipo local usa dados fictícios e `localStorage` do navegador para estado e metadados. Logo e anexos adicionados pela interface ficam em IndexedDB, vinculados por IDs; não são enviados a servidor, sincronizados nem protegidos por autenticação. O seletor “Equipe/Cliente” é apenas prévia de interface, **não autenticação**. Arquivos de `public/` são demonstração pública.

A mídia principal enviada na criação/edição também fica no IndexedDB, separada dos anexos. O registro de publicação guarda apenas metadados/IDs. A interface usa URLs temporárias do navegador para imagem, carrossel e vídeo; elas são liberadas ao desmontar o componente. Um novo envio cria nova versão e volta a publicação à preparação para aprovação. A compatibilidade de formato e limites de tamanho são verificados antes de salvar.

Para a capa do card, a mídia principal tem prioridade; se ausente, usa-se o primeiro anexo de imagem/vídeo. Um anexo visual selecionado no detalhe substitui temporariamente a prévia, sem alterar a mídia principal. Para vídeo anexado, `coverFileId` aponta para uma capa personalizada salva no IndexedDB; trocar a capa cria nova versão da publicação e volta o status à preparação. Na ausência dessa imagem, o frame é extraído no navegador (quando o codec é suportado), reduzido a até 640 px e salvo como JPEG sob `poster:<id>`. Se a extração falhar, a miniatura automática não é garantida. O armazenamento e a reprodução permanecem locais.

O seletor de papel Equipe/Cliente da demonstração é persistido em `localStorage` para não voltar a Cliente ao recarregar em modo mobile. Isso não concede acesso nem substitui autenticação.

O estado local mantém um mapa de espaços por identificador de cliente (`nurea-clientes-demo-v2`). O cartão lateral permite à equipe escolher o espaço ativo; a troca não é controle de acesso. Dados da versão antiga, de cliente único, não são migrados para evitar trazer o exemplo removido para a nova demonstração.

Cada espaço armazena `logoScale`, `logoOffsetX`, `logoOffsetY` e `logoBorder` junto ao ID da logo, de modo que o enquadramento circular persista no mesmo navegador sem alterar o arquivo original. O cabeçalho e a grade têm regras responsivas específicas: duas colunas no celular, três no desktop.

O espaço mantém o período ativo em `monthKey`/`month` e ciclos anteriores em `months`, cada um com plano e publicações independentes. Os dados locais antigos sem `monthKey` são tratados como setembro de 2026. Trocar o mês salva o ciclo ativo no mapa e carrega o escolhido. O planejamento de novos períodos começa como `rascunho`, sem apresentar a arte ilustrativa de setembro como se fosse daquele mês. Upload de planejamento mensal ainda não foi implementado.

## Antes de publicar para clientes

1. Definir autenticação e acesso por equipe/cliente, aplicado também nas APIs e arquivos.
2. Substituir `localStorage` por banco de dados e armazenamento de mídia com versões e permissões.
3. Modelar ciclo mensal, planejamento, publicação, comentário, aprovação e histórico de forma transacional.
4. Proteger upload e reprodução de vídeo, carrossel e PDF; testar limites e formatos.
5. Criar testes de isolamento entre clientes e do fluxo de aprovação.
6. Decidir hospedagem e plano compatíveis com a política do provedor. Nenhum deploy foi autorizado ainda.

## Regras técnicas importantes

- Uma aprovação refere-se a uma versão específica.
- O agente futuro precisa identificar registros estáveis, propor mudanças seletivas e exigir confirmação da equipe antes de aplicar; nunca aprovar em nome do cliente.
- Um repost de feed no Story é metadado/tarefa associada, não novo conteúdo.
- Datas sazonais têm fonte, abrangência e status de verificação.
