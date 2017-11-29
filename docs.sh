#!/usr/bin/env bash
set -ex

typedoc --theme default --target ES5 --module commonjs --exclude '**/*.test.ts' --out docs src

cd ./docs

touch .nojekyll

git init
git remote add origin git@github.com:jahed/webpack-sitemap.git
git checkout -b gh-pages
git add .
git commit -m 'docs: new build'
git push -u origin gh-pages --force

echo 'Done.'
