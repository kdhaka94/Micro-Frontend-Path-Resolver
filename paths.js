const ShellMFEPaths = {
    './SomeFile': './app/catalog/Something/SomeFile'
}

export const replaceWithPrePath = (prePath, exposes) => {
    exposes.map(path => path.replace('app', prePath))
}