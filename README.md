# webpack-sitemap

[![Travis](https://img.shields.io/travis/jahed/webpack-sitemap.svg)](https://travis-ci.org/jahed/webpack-sitemap)
[![npm](https://img.shields.io/npm/v/@jahed/webpack-sitemap.svg)](https://www.npmjs.com/package/@jahed/webpack-sitemap)
[![Patreon](https://img.shields.io/badge/patreon-donate-f96854.svg)](https://www.patreon.com/jahed)
[![Liberapay](https://img.shields.io/badge/liberapay-donate-d9b113.svg)](https://liberapay.com/jahed)

Generate Sitemaps as part of your Webpack build.

## Installation

```bash
# Yarn
yarn add --dev @jahed/webpack-sitemap

# NPM
npm install --save-dev @jahed/webpack-sitemap
```

## Example

Here's how you might use this plugin in your `webpack.config.js`:

```js
import { SitemapPlugin } from '@jahed/webpack-sitemap'

// ...
plugins: [
    //...
    new SitemapPlugin({
        basename: 'https://example.com',
        sitemapindex: {
            'app': {
                urlset: {
                    '/some/page': {
                        priority: 0.9
                    }
                }
            }
        },
        defaults: {
            sitemap: {
                lastmod: new Date().toISOString()
            },
            url: {
                lastmod: new Date().toISOString(),
                priority: 0.5,
                changefreq: 'daily'
            }
        }
    })
    //...
]
//...
```

This will generated the following:


```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- /sitemap.xml -->
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://example.com/sitemaps/app.xml</loc>
        <lastmod>2017-11-29T00:39:29.258Z</lastmod>
    </sitemap>
</sitemapindex>
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- /sitemaps/app.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://example.com/some/page</loc>
        <lastmod>2017-11-29T00:39:29.258Z</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>

```
