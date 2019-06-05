import { ok } from 'assert'
import { resolve as resolveUrl } from 'url'
import { readFileSync } from 'fs'
import { join as joinPath, resolve as resolvePath } from 'path'
import { merge } from 'lodash'
import { compile as compileTemplate } from 'handlebars'
import { compilation, Compiler, Plugin } from 'webpack'

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
  changefreq: ChangeFrequency,
  priority: Priority
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

class SitemapPlugin implements Plugin {
  private _options: PluginOptions
  private _templates: {
    sitemap: HandlebarsTemplateDelegate<SitemapIndex>,
    urlset: HandlebarsTemplateDelegate<Sitemap>
  }

  constructor(userOptions: PluginOptions) {
    const defaultOptions = {
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
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapAsync('SitemapPlugin', (compilation: compilation.Compilation, callback: Function) => {
      const sitemapView: SitemapIndex = {
        sitemaps: Object.keys(this._options.sitemapindex)
          .map(name => ({
            ...this._options.defaults.sitemap,
            ...this._options.sitemapindex[name],
            loc: resolveUrl(this._options.basename, `./sitemaps/${name}.xml`)
          })
          )
      }

      const sitemapSource = this._templates.sitemap(sitemapView)

      compilation.assets['sitemap.xml'] = {
        source: () => sitemapSource,
        size: () => sitemapSource.length
      }

      Object.keys(this._options.sitemapindex)
        .forEach(name => {
          const sitemap = this._options.sitemapindex[name]
          const urlset = Object
            .keys(sitemap.urlset)
            .map((location: Location): SitemapUrl => ({
              ...this._options.defaults.url,
              ...sitemap.urlset[location],
              loc: resolveUrl(this._options.basename, location)
            }))

          const urlsetView = { urlset }
          const urlsetSource = this._templates.urlset(urlsetView)
          const urlsetPath = joinPath('/sitemaps/', `${name}.xml`)

          compilation.assets[urlsetPath] = {
            source: () => urlsetSource,
            size: () => urlsetSource.length
          }
        })

      callback()
    })
  }
}

export { SitemapPlugin }
