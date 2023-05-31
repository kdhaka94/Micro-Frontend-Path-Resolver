export const ShellMFEPaths = {
    root: 'ShellMFE',
    pre: "app",
    paths: {
        './SomeFile': './app/catalog/Something/SomeFile'
    }
}

export const CommonMFE = {
    root: "CommonMFE",
    pre: "commons",
    paths: {
        './CommonFile': './app/Something/CommonFile'
    }
}

export const replaceWithPrePath = (rootPath, prePath, exposes,) => {
    return exposes.map(path => path.replace('app', prePath))
}

function mergePathObjects(...pathObjects) {
    const mergedPaths = {};

    pathObjects.forEach(pathObject => {
        const { root, paths, pre } = pathObject;

        for (let [key, value] of Object.entries(paths)) {
            let newKey = key.replace('.', root);

            mergedPaths[newKey] = value.replace('app', pre);
        }
    });

    return mergedPaths;
}

export const mergedPaths = mergePathObjects(ShellMFEPaths, CommonMFE);