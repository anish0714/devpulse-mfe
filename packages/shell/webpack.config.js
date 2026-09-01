const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

const PROD_BASE = "https://anish0714.github.io/devpulse-mfe";

module.exports = (_env, argv) => {
  const isProduction = argv.mode === "production";

  const analyticsUrl = isProduction
    ? `${PROD_BASE}/remotes/analytics/remoteEntry.js`
    : "http://localhost:3001/remoteEntry.js";
  const notesUrl = isProduction
    ? `${PROD_BASE}/remotes/notes/remoteEntry.js`
    : "http://localhost:3002/remoteEntry.js";

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
      port: 3000,
      historyApiFallback: true,
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "shell",
        remotes: {
          analytics: `analytics@${analyticsUrl}`,
          notes: `notes@${notesUrl}`,
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
