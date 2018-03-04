module.exports = {
  entry: './src/viewer.ts',
  output: {
    filename: 'orbit-viewer.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  }
}
