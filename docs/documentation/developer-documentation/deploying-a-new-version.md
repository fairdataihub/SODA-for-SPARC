# Deploying a New Version of SODA

This guide explains the deployment process for releasing a new version of SODA for SPARC. SODA uses GitHub Actions to automate the build and deployment process across Windows, macOS, and Linux.

## Prerequisites

- You have commit access to the repository
- The version has been updated in `package.json`
- All tests pass and code is ready for release

## Version Management

### Versioning Strategy

SODA follows semantic versioning with an optional beta tag:

- **Production**: `major.minor.patch` (e.g., `1.2.3`)
- **Beta**: `major.minor.patch-beta.N` (e.g., `1.2.3-beta.1`)

The version is defined in `package.json`:

```json
{
  "version": "1.2.3"
}
```

### Beta vs Production Releases

The deployment process automatically detects whether a release is beta or production and configures the build accordingly:

#### Beta Release

- Version contains "beta" (e.g., `1.0.0-beta.1`)
- Uses **TestPyPI** for pysodafair installation
- Allows testing pre-release Python dependencies
- Ideal for testing new features before official release

#### Production Release

- Version does NOT contain "beta" (e.g., `1.0.0`)
- Uses **PyPI** for pysodafair installation
- Uses stable, officially released dependencies
- Recommended for end-user releases

## Deployment Process

### 1. Prepare Your Code

Make sure all changes are committed and pushed to the appropriate branch:

```bash
git add .
git commit -m "Release version X.X.X"
git push origin your-branch
```

### 2. Update the Version

Update the version in `package.json`:

```bash
# For a production release
npm version minor  # or major, patch

# Or manually edit package.json
```

Commit the version change:

```bash
git add package.json
git commit -m "Bump version to X.X.X"
git push origin your-branch
```

### 3. Create a Pull Request

If you haven't already, create a PR to merge your changes into `main` or `staging`:

```bash
# On GitHub, create a PR from your-branch to main
```

### 4. Merge to Main or Staging

Once approved, merge your PR. The CI/CD pipeline will automatically:

1. Detect the branch (main or staging)
2. Read the version from `package.json`
3. Configure pysodafair (TestPyPI for beta, PyPI for production)
4. Build for all platforms (Windows, macOS, Linux)
5. Deploy to GitHub Releases

## Automated Deployment Workflow

SODA uses GitHub Actions to automate deployment across three platforms. The workflow is defined in `.github/workflows/`:

### Build-and-deploy-linux.yml

Builds and deploys the Linux version.

**Triggers:**

- Pushes to `main` or `staging` branches

**Process:**

1. Sets up Python 3.9, Node.js 25.9.0, and Conda
2. Detects version from `package.json`
3. **Configures pysodafair source:**
   - **Beta versions**: Enables TestPyPI with `--extra-index-url https://test.pypi.org/simple/`
   - **Production versions**: Uses PyPI (default)
4. Creates conda environment from `tools/anaconda-env/environment-Linux.yml`
5. Installs npm dependencies
6. Deploys to GitHub Releases

### Build-and-deploy-mac.yml

Builds and deploys the macOS version (similar process to Linux).

### Build-and-deploy-windows.yml

Builds and deploys the Windows version (similar process to Linux).

## Understanding the Build Configuration

### Dynamic pysodafair Configuration

The deployment pipeline includes intelligent version detection:

```bash
VERSION=$(node -p "require('./package.json').version")
ENV_FILE="tools/anaconda-env/environment-Linux.yml"

if [[ "$VERSION" == *"beta"* ]]; then
  echo "Beta version detected ($VERSION) - using TestPyPI for pysodafair"
  sed -i 's/# - --extra-index-url/- --extra-index-url/' "$ENV_FILE"
else
  echo "Production version detected ($VERSION) - using PyPI for pysodafair"
fi
```

This ensures:

- Beta releases can use pre-release versions of pysodafair
- Production releases use stable, officially released versions
- No manual configuration needed - it's automatic

### Conda Environment Files

The conda environment configuration is version-specific:

**For beta versions** (`tools/anaconda-env/environment-Linux.yml`):

```yaml
- --extra-index-url https://test.pypi.org/simple/
- pysodafair
```

**For production versions** (default):

```yaml
# - --extra-index-url
- pysodafair
```

## Deployment Outputs

After successful deployment, releases are available at:

- **GitHub Releases**: https://github.com/fairdataihub/SODA-for-SPARC/releases
- **Windows**: Installer (`.exe`), Portable executable
- **macOS**: DMG installer
- **Linux**: AppImage, Debian package (`.deb`)

## Monitoring Deployment

### Check Workflow Status

1. Go to the [GitHub Actions](https://github.com/fairdataihub/SODA-for-SPARC/actions) page
2. Select the workflow (Build-and-deploy-linux, mac, or windows)
3. View the logs for your push

### Troubleshooting Failed Deployments

If a deployment fails:

1. **Check the workflow logs** - GitHub Actions shows detailed error messages
2. **Verify the version** - Ensure `package.json` has the correct version format
3. **Check environment files** - Ensure conda environment files are valid
4. **Verify credentials** - Ensure `GITHUB_TOKEN` is configured (handled by GitHub automatically)

Common issues:

- **Python version mismatch**: Verify Python 3.9 is used
- **Missing dependencies**: Check conda environment file for completeness
- **pysodafair issues**: Verify the package exists on PyPI or TestPyPI for your version

## Rollback Procedures

If a release has critical issues:

1. **Create a hotfix branch** from the buggy release tag
2. **Fix the issues**
3. **Update version** to `X.X.X-hotfix.1` or `X.X.X.1`
4. **Push to `main`** to trigger a new deployment
5. **Delete or unpublish** the problematic release on GitHub

## Best Practices

✅ **Do:**

- Test beta releases thoroughly before marking as production
- Use `staging` branch for pre-release testing
- Keep `main` branch stable
- Document changes in `CHANGELOG.md`
- Tag releases with semantic version tags

❌ **Don't:**

- Deploy directly from feature branches to `main`
- Change version without thorough testing
- Skip beta releases for major changes
- Deploy during known infrastructure issues

## Next Steps

- [Building the Application Locally](building-the-application-locally.md) - Test your build before deployment
- [Working with pysodafair](working-with-pysodafair.md) - Understand dependency management

## Additional Resources

- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [electron-builder Documentation](https://www.electron.build/)
