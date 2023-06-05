export const ShellMFEPaths = {
    root: 'ShellMFE',
    pre: "app",
    paths: {
        './SomeFile': './app/catalog/Something/SomeFile',
        './internal/utils':'./app/internal/utils'
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

export const absoluteImports = {
    'Framework/Services': 'internal/services',
    'Framework/Utils': 'internal/utils',
    'Framework/Shared': 'internal/shared',
    'Framework/Middleware': 'internal/middleware',
    'Framework/Constants': 'modules/Auth',
    'Framework/System': 'modules/system',
    'Framework/SharedUtils': '/utils',
    'Framework/Error': 'internal/containers/ErrorBoundary',
    'Modules/Shared': 'modules/shared',
    'Modules/SharedSelectors': 'modules/shared/selectors',
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

const mfeNames = [
    'mss-frontend',
    'cx-shop-fe-catalog'
];

export const mergedPaths = mergePathObjects(ShellMFEPaths, CommonMFE);