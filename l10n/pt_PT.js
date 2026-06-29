OC.L10N.register(
    "thesearchpage",
    {
    "🔎 A Search Page for your Nextcloud instance\n\n- [Changelog](https://raw.githubusercontent.com/callmemagnus/nextcloud-searchpage/main/CHANGELOG.md)\n- [Help translate this application](https://app.transifex.com/nextcloud/nextcloud/thesearchpage/)\n\nIt works like the existing search widget, uses the same sources to query BUT\ndisplays the results in a more readable and browsable fashion.\n\nThe content of the results depends on the other applications installed on\nyour Nextcloud instance. Every Nextcloud application can become a search\nprovider and get its results displayed by this application.\n\nOut of the Nextcloud box, you usually get the following providers:\n\n- Apps -- searches for match for in installed application names\n- Files -- searches on path and filename\n- Tags\n- Comments\n- Settings\n\nBecause of its design, the results depend on the implementation of the providers\nin respective application.\n\nKnown issues with other applications:\n\n- users -- [by design(?), it always returns an empty array](https://github.com/nextcloud/server/issues/41274) (it is hidden/disabled in this application)\n- fulltextsearch -- does not seem to AND the query terms, OR is usually less relevant\n- news -- does not provide a direct link to a feed item.\n\n\nDon't hesitate to leave a comment here or a rating!" : "🔎 Uma página de pesquisa para a sua instância Nextcloud\n\n- [Registo de alterações](https://raw.githubusercontent.com/callmemagnus/nextcloud-searchpage/main/CHANGELOG.md)\n- [Ajudar a traduzir esta aplicação](https://app.transifex.com/nextcloud/nextcloud/thesearchpage/)\n\nFunciona como o widget de pesquisa existente, utiliza as mesmas fontes para consultar, MAS\napresenta os resultados de forma mais legível e navegável.\n\nO conteúdo dos resultados depende das outras aplicações instaladas em\na sua instância do Nextcloud. Qualquer aplicação do Nextcloud pode tornar-se um provedor de busca\ne ter os seus resultados exibidos por esta aplicação.\n\nPor predefinição, o Nextcloud oferece geralmente os seguintes fornecedores:\n\n- Aplicações -- pesquisa de correspondências nos nomes das aplicações instaladas\n- Ficheiros -- pesquisa por caminho e nome do ficheiro\n- Etiquetas\n- Comentários\n- Configurações\n\nDevido ao seu design, os resultados dependem da implementação dos fornecedores\nem cada aplicação.\n\nProblemas conhecidos com outras aplicações:\n\n- utilizadores -- [por design(?), retorna sempre um array vazio](https://github.com/nextcloud/server/issues/41274) (está escondido/desativado nesta aplicação)\n- pesquisa de texto completo -- não parece utilizar o operador AND nos termos da pesquisa; o operador OR é geralmente menos relevante\n- notícias -- não fornece uma ligação direta para um item do feed.\n\nNão hesite em deixar um comentário ou uma crítica!",
    "Admin configuration available" : "Configuração administrativa disponível",
    "Back" : "Voltar",
    "Click to change providers" : "Clique para mudar de provedor",
    "Enable provider restrictions" : "Ativar restrições do provedor",
    "Filters" : "Filtros",
    "Higher values may result in slower response times, especially for providers with large datasets." : "Valores mais altos podem resultar em tempos de resposta mais lentos, especialmente para provedores com grandes conjuntos de dados.",
    "Loading..." : "Carregando…",
    "No results" : "Sem resultados",
    "Note:" : "Nota:",
    "Provider" : "Fornecedor",
    "Save" : "Guardar",
    "Saving..." : "A guardar...",
    "Search" : "Pesquisa sobre",
    "Search Page" : "Página de pesquisa",
    "Show only" : "Apenas mostrar",
    "When enabled, you can control which search providers are visible to specific user groups. By default, all providers are enabled for all groups." : "Quando ativado, você pode controlar quais provedores de pesquisa ficam visíveis para grupos específicos de usuários. Por padrão, todos os provedores estão ativados para todos os grupos."
},
"nplurals=3; plural=(n == 0 || n == 1) ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;");
