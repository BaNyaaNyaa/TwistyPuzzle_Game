import { merge } from 'webpack-merge';
// @ts-ignore
import common from './webpack.common.ts';

import "webpack-dev-server";
import webpack from "webpack";


const config: webpack.Configuration = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        port: 8080
    },
    optimization: {
        runtimeChunk: 'single'
    }
});

export default config