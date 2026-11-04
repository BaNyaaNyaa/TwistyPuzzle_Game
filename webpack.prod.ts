import { merge } from 'webpack-merge';
// @ts-ignore
import common from './webpack.common.ts';

import webpack from "webpack";


const config: webpack.Configuration = merge(common, {
    mode: 'production',
    devtool: 'source-map'
});

export default config