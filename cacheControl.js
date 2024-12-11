// Disable caching by appending a unique timestamp to script and stylesheet URLs
(function () {
    const uniqueToken = new Date().getTime();

    // Update all <script> tags
    document.querySelectorAll('script[src]').forEach((script) => {
        const originalSrc = script.src.split('?')[0];
        script.src = `${originalSrc}?v=${uniqueToken}`;
    });

    // Update all <link> tags for stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const originalHref = link.href.split('?')[0];
        link.href = `${originalHref}?v=${uniqueToken}`;
    });
})();