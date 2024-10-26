const path = require('path');

module.exports = {
    entry: './src/main.ts', // Entry point of your application
    output: {
        filename: 'bundle.js', // Output file name
        path: path.resolve(__dirname, 'dist') // Output directory
    },
    resolve: {
        extensions: ['.ts', '.js'] // Resolve .ts and .js extensions
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Apply this rule to .ts files
                exclude: /node_modules/, // Exclude node_modules directory
                use: 'ts-loader' // Use ts-loader for transpiling
            }
        ]
    },
    mode: 'development' // Set the mode to development
};