import { ok } from 'assert'
import { resolve as resolveUrl } from 'url'
import { readFileSync } from 'fs'
import { join as joinPath, resolve as resolvePath } from 'path'
import { assign, forEach, map, merge } from 'lodash'
import * as debug from 'debug'
import { compile as compileTemplate } from 'handlebars'
import { Compiler, Plugin } from 'webpack'
import { IDebugger } from 'debug'

/**
 * A date string that conforms to the W3C DATETIME format (http://www.w3.org/TR/NOTE-datetime)
 */
export type DateString = string

/**
 * How often the item is expected to change.
 */
export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

/**
 * The priority of the item relative to other items. Between 0 and 1.
 */
export type Priority = number

/**
 * The location of the item. A URI.
 */
export type Location = string

/**
 * A SitemapIndex can be used to refer to multiple Sitemaps.
 */
export interface SitemapIndex {
    sitemaps: SitemapReference[]
}

/**
 * A reference to a Sitemap
 */
export interface SitemapReference {
    loc: Location,
    lastmod: DateString,
}

export interface Sitemap {
    urlset: SitemapUrl[],
}

export interface SitemapUrl {
    loc: Location,
    lastmod?: DateString,
    changefreq?: ChangeFrequency,
    priority?: Priority,
}

export interface SitemapDefaults {
    lastmod: DateString,
}

export interface SitemapUrlDefaults {
    lastmod: DateString,
    priority: ChangeFrequency,
    changefreq: Priority,
}

export interface PluginSitemapIndex { [name: string]: PluginSitemap }

export interface PluginSitemap {
    urlset: { [loc: string]: PluginSitemapUrl },
    lastmod: DateString,
}

export interface PluginSitemapUrl {
    lastmod?: DateString,
    changefreq?: ChangeFrequency,
    priority?: Priority,
}

export interface PluginOptions {
    basename: string,
    sitemapindex: PluginSitemapIndex,
    defaults: {
        sitemap: SitemapDefaults,
        url: SitemapUrlDefaults,
    },
}

function getTemplate<T>(filename: string): HandlebarsTemplateDelegate<T> {
    return compileTemplate(readFileSync(resolvePath(__dirname, '../templates', filename), 'utf-8'))
}

class SitemapPlugin extends Plugin {
    private _options: PluginOptions
    private _templates: {
        sitemap: HandlebarsTemplateDelegate<SitemapIndex>,
        urlset: HandlebarsTemplateDelegate<Sitemap>
    }
    private _log: IDebugger

    constructor(userOptions: PluginOptions) {
        super()

        const defaultOptions: PluginOptions = {
            basename: undefined,
            sitemapindex: {},
            defaults: {
                sitemap: {
                    lastmod: undefined
                },
                url: {
                    lastmod: undefined,
                    priority: undefined,
                    changefreq: undefined
                }
            }
        }

        this._options = merge({}, defaultOptions, userOptions)
        ok(this._options.basename, 'options.basename is required. e.g. https://example.com')

        this._templates = {
            sitemap: getTemplate('sitemap.xml.hbs'),
            urlset: getTemplate('urlset.xml.hbs')
        }

        this._log = debug('SitemapPlugin')
    }

    apply(compiler: Compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            const sitemapView: SitemapIndex = {
                sitemaps: map<PluginSitemap, SitemapReference>(
                    this._options.sitemapindex,
                    (sitemap, name) => assign(
                        { loc: resolveUrl(this._options.basename, `./sitemaps/${name}.xml`) },
                        { lastmod: sitemap.lastmod },
                        this._options.defaults.sitemap
                    )
                )
            }

            const sitemapSource = this._templates.sitemap(sitemapView)

            this._log('Adding: sitemap.xml')
            compilation.assets['sitemap.xml'] = {
                source: () => sitemapSource,
                size: () => sitemapSource.length
            }

            forEach<PluginSitemapIndex>(this._options.sitemapindex, (sitemap, name) => {
                const urlset = map<PluginSitemapUrl, SitemapUrl>(
                    sitemap.urlset,
                    (meta: SitemapUrl, location: Location): SitemapUrl => {
                        return assign(
                            {
                                loc: resolveUrl(this._options.basename, location)
                            },
                            this._options.defaults.url,
                            meta
                        )
                    }
                )

                const urlsetView = { urlset }
                const urlsetSource = this._templates.urlset(urlsetView)
                const urlsetPath = joinPath('/sitemaps/', `${name}.xml`)

                this._log(`Adding: ${urlsetPath}`)
                compilation.assets[urlsetPath] = {
                    source: () => urlsetSource,
                    size: () => urlsetSource.length
                }
            })

            this._log('Done.')
            callback()
        })
    }
}

export { SitemapPlugin }
