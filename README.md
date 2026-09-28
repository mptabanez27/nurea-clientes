# Portal de Conteúdos Nurea

Protótipo **local** mobile first para validar o fluxo do cliente e a identidade visual. Ainda não há login real, banco de dados ou armazenamento privado. **Não publique nem use dados reais de clientes nesta versão.**

## Começar

```powershell
cd E:\dev\nurea-clientes
npm install
npm run dev
```

Abra [http://localhost:3002](http://localhost:3002). `npm run check` verifica tipos e `npm run build` valida a compilação.

O seletor Equipe/Cliente simula as duas experiências, mas não protege dados. As alterações da demonstração são salvas apenas no `localStorage` do navegador; use “Restaurar demonstração” para voltar ao estado inicial.

Na visão da equipe, use **Novo mês** no cabeçalho para abrir um ciclo editorial e **Selecionar mês em foco** para alternar entre os períodos. Clique na logo circular para ampliar e ajustar seu enquadramento; o cliente pode apenas ampliá-la. Os arquivos de logo ficam no IndexedDB do mesmo navegador. O upload de um planejamento próprio para cada novo mês ainda está pendente.

Antes de mexer no código, consulte [contexto/README.md](contexto/README.md) e [backlog/README.md](backlog/README.md).
