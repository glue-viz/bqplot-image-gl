# Using CI

## Auto bump

Use

   $ ./release.sh minor

Or

    $ ./release.sh patch

## Manual bump
 * Update bqplot-image-gl/_version.py
 * Update js/package.json
 * Add and commit, e.g. `git add -u; git commit -m 'Update to version 1.6.1'`
 * Tag: `git tag 1.6.1`
 * Release using push: `git push upstream master 1.6.1`

# Manual:
## To release a new version of bqplot-image-gl on PyPI:

Update _version.py (set release version, remove 'dev')
git add the _version.py file and git commit
`python setup.py sdist upload`
`python setup.py bdist_wheel upload`
`git tag -a X.X.X -m 'comment'`
Update _version.py (add 'dev' and increment minor)
git add and git commit
git push
git push --tags

##  To release a new version of bqplot-image-gl on NPM:

```
# clean out the `dist` and `node_modules` directories
git clean -fdx
npm install
npm publish
```
