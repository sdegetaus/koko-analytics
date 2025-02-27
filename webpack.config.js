const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const DEBUG = process.env.NODE_ENV === 'development';
module.exports = {
    watch: DEBUG,
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: ['node_modules'],
    },
    mode: DEBUG ? 'development' : 'production',
    entry: {
        'script': './assets/src/js/script.js',
        'admin': './assets/src/js/admin.js',
        'dashboard-widget': './assets/src/js/dashboard-widget.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'assets/dist/js'),
    },
    devtool: DEBUG ? 'inline-source-map' : false,
    module: {
        rules: [
            {
                test: /\.js$/i,
                exclude: /\/node_modules\//,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.s?[ca]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    externals: {
        "moment": 'moment',
    },
    plugins: [
        new CopyPlugin([
            { from: './assets/src/img', to: path.resolve(__dirname, './assets/dist/img') },
        ]),
    ],
};
