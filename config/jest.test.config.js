module.exports = {
	displayName: 'test',
	rootDir: '..',
	testMatch: ['<rootDir>/test/**/*.js'],
	testPathIgnorePatterns: ['/node_modules/', '.eslintrc.js', '<rootDir>/test/utils/'],
	testEnvironment: 'node',
}