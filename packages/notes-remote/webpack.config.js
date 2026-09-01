const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = (_env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.ts",
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "eval-source-map",
    output: {
      publicPath: "auto",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ },
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
      ],
    },
    devServer: {
      port: 3002,
      historyApiFallback: true,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "notes",
        filename: "remoteEntry.js",
        exposes: {
          "./Widget": "./src/Widget",
        },
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
        },
      }),
      new HtmlWebpackPlugin({ template: "./public/index.html" }),
    ],
  };
};
