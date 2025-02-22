const path = require("path");
const package = require("./package.json");
const fs = require("fs");
const childProcess = require("child_process");
const { merge } = require("webpack-merge");
const webpack = require("webpack");

var branch = "unknown";
try {
	branch = childProcess.execSync("git rev-parse --abbrev-ref HEAD", {
		encoding: "utf8"
	});
	branch = branch.trim();
} catch (err) { }

const version = package.version;

console.log("This is a %s build. %s", branch, version);

fs.writeFileSync(
	"./src/version.ts",
	`
// Autogenerated by webpack.config.js
export const version = "${version}";
export const branch = "${branch}";
`
);

const common = {

	resolve: {
		extensions: [".ts", ".tsx", ".scss", ".css", ".js"],
		fallback: {
			buffer: require.resolve('buffer/'),
			url: require.resolve('url'),
			util: require.resolve("util")
		},
		alias: {
			process: "process/browser"
		},
	},

	entry: ["./src/index.tsx"],

	plugins: [
		new webpack.ProvidePlugin({
			Buffer: ['buffer', 'Buffer'],
			process: 'process/browser',
		}),
	],

	module: {
		rules: [
			{
				test: /\.ts(x?)$/,
				exclude: /node_modules/,
				use: "ts-loader"
			},
			{
				test: /\.s[ac]ss$/i,
				use: ["style-loader", "css-loader", "sass-loader"],
				exclude: /node_modules/
			},
			{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: "url-loader",
				options: {
					limit: 10000,
					mimeType: "application/font-woff"
				}
			},
			{
				test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: "file-loader"
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				loader: "file-loader",
				options: {
					publicPath: "img",
					outputPath: "img"
				}
			},
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader"
			}
		]
	},

	output: {
		filename: "main.js",
		path: path.resolve(__dirname, "dist")
	},

	externals: [
		{
			react: "React",
			"react-dom": "ReactDOM",
		},
	]
};

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = (env) => {
	if (env.dev) {
		console.log("Build mode: development");
		return merge(common, {
			mode: "development",
			devtool: "source-map",
		});
	}

	plugins: [
		new BundleAnalyzerPlugin()
	]

	console.log("Build mode: production");
	return merge(common, {
		mode: "production",
	});
}

