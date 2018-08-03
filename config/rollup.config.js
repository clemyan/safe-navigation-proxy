module.exports = {
	input: 'src/index.js',
	output: [
		{file: 'dist/index.js', format: 'iife', name: 'safeNav'},
		{file: 'dist/umd/index.js', format: 'umd', name: 'safeNav'},
		{file: `dist/cjs/index.js`, format: 'cjs'},
		{file: `dist/es/index.js`, format: 'es'}
	],
	plugins: [
		require('rollup-plugin-babel-minify')({comments: false})
	],
	watch: {
		inlude: 'src/**/*.js'
	}
}