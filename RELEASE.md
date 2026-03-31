# Releasing bqplot-image-gl

Releases are automated via GitHub Actions and PyPI trusted publishing.

## Steps

1. Update the version in `bqplot_image_gl/_version.py` and `js/package.json`.
2. Commit and push to `main`:
   ```
   git add bqplot_image_gl/_version.py js/package.json
   git commit -m "Bump version: X.Y.Z → A.B.C"
   git push upstream main
   ```
3. Create a new release from the [GitHub Releases page](https://github.com/glue-viz/bqplot-image-gl/releases/new):
   - Set the tag to `vA.B.C` (e.g. `v1.9.0`)
   - Use "Generate release notes" to auto-populate the changelog
   - Publish the release

The CI will automatically build and upload the package to PyPI using trusted publishing.
The release notes will also be appended to `CHANGES.md` on `main`.

## Prerequisites

- A `pypi` environment must be configured in the GitHub repo settings
  (Settings > Environments > `pypi`).
- Trusted publishing must be configured on PyPI for this repository
  (see [PyPI docs](https://docs.pypi.org/trusted-publishers/)).
