let config = null;

function updateSize() {
    const height = Math.ceil($("html").height() + 100)
    CustomElement.setHeight(height);
}

function syncSearch() {
    if (!config) {
        $.notify("Configuration not found!", "error");
        return;
    }

    $.LoadingOverlay("show");

    axios({
            method: 'post',
            url: "/.netlify/functions/algolia-init-function",
            data: {
                "projectId": config.projectId,
                "language": config.language.codename,
                "slug": config.slugCodename,
                "appId": config.algoliaAppId,
                "index": config.algoliaIndexName
            }
        })
        .catch((error) => {
            $.LoadingOverlay("hide");
            $.notify("Something went wrong, consult console for error details!", "error");
            console.error(error);
        })
        .then((response) => {
            $.LoadingOverlay("hide");
            $.notify("Search index synced!", "success");
            const synced = new Date().toISOString();
        });
    
}

CustomElement.init((element, _context) => {
    config = element.config || {};
    config.projectId = _context.projectId;
    config.language = _context.variant;

    const searchClient = algoliasearch(config.algoliaAppId, config.algoliaSearchKey);

    const search = instantsearch({
        indexName: config.algoliaIndexName,
        searchClient,
        initialUiState: {
            indexName: {
                query: "",
                page: 0,
            },
        }
    });

    search.addWidgets([
        instantsearch.widgets.configure({
           filters: "language:"+config.language.codename.trim(), 
        }),
        instantsearch.widgets.searchBox({
            container: '#searchbox',
            autofocus: false,
            searchAsYouType: true,
        }),
            instantsearch.widgets.stats({
                container: '#stats',
            }),
            instantsearch.widgets.hits({
                container: '#hits',
                escapeHTML: true,
                templates: {
                    item(hit) {
                        return `<strong style="min-width:200px;"><a href="https://app.kontent.ai/${config.projectId}/content-inventory/${config.language.id}/content/${hit.id}" target="_blank">${hit.name}</a></strong>
                            <div style="margin-rigth:10px;">${hit._snippetResult.content.map(o => JSON.stringify(o.contents.value)).join(' ').replaceAll('"', '').replaceAll('&nbsp;', ' ').replaceAll('\n', ' ')}</div>`;
                    }
                }
            })
    ]);

    try {
        search.start();
        search.on('render', () => {
            updateSize();
            $("#searchButton").html(`Create/Update Search Index for ${config.language.codename} language`);
            console.log(config.language);
        });
    } catch (error) {
        console.log(JSON.stringify(error));
    }
});