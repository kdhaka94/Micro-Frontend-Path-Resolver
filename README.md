## Micro-Frontend Path Resolver
Micro-Frontend Path Resolver is a powerful tool designed to help you migrate from a monolithic architecture to a micro-frontend architecture. It provides an automated solution to resolving relative import paths in your JavaScript and TypeScript files.

### Background
When you split a monolithic React app into multiple micro-frontend applications, one of the significant challenges you face is updating the import paths. The paths that were valid in the monolithic structure may no longer be valid in the new micro-frontend structure.

### How it works
This tool scans through all your JavaScript files in your project and checks the import paths. If a file referenced in an import statement doesn't exist at the specified path, the tool will try to match the import path with a mapping object and replace it with a new path.
The mapping object is a key-value pair where the key is the new path and the value is the old path. The old path is matched based on the parent folder and file name, which enables the tool to handle situations where files might be located differently in the new structure but retain the same parent folder and file name.
The tool doesn't replace the paths of files that are accessible at the specified path, ensuring that it only modifies the paths that need to be updated.

### How to use
1. Define your path mapping objects in the configuration file. The mapping object should contain the new paths as keys and the old paths as values. 
2. Run the tool in the root directory of your project. 
3. The tool will automatically replace the old paths with the new ones in your JavaScript files, and you'll be ready to go with your new micro-frontend architecture.
With Micro-Frontend Path Resolver, you can streamline the migration process from a monolithic to a micro-frontend architecture, saving you hours of manual work and reducing the risk of errors. Happy coding!

Please note: This tool doesn't handle circular dependencies or complex scenarios where the same file is located in multiple places in the new architecture. Please review the changes after running the tool to ensure everything is working as expected.