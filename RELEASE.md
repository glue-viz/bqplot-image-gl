# Releasing bqplot-image-gl

1. Go to the GitHub repository's **Releases** page
2. Click **Draft a new release**
3. Create a new tag with the format `vX.Y.Z` (e.g. `v1.9.0`)
4. Add release notes describing the changes
5. For pre-release versions, check **Set as a pre-release** (npm will use the `next` tag instead of `latest`)
6. Click **Publish release**

The CI workflow will automatically:
- Set the version in `_version.py` and `package.json` from the tag
- Build the Python and JavaScript packages
- Run the full test suite
- Publish to PyPI (trusted publishing via OIDC)
- Publish to npm (with provenance, using `NPM_TOKEN` secret)

Both PyPI and npm publishing only happen if the build and all tests pass.
