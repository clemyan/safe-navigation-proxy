module.exports = {
	displayName: 'lint',
	rootDir: '..',
	testMatch: ['<rootDir>/**/*.js'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
	runner: 'jest-runner-eslint',
}
