module.exports = {
	projects: [{
		displayName: 'test',
		testMatch: ['<rootDir>/test/**/*.js'],
		testPathIgnorePatterns: ['/node_modules/', '.eslintrc.js'],
		testEnvironment: 'node'
	}, {
		displayName: 'lint',
		testMatch: ['<rootDir>/**/*.js'],
		testPathIgnorePatterns: ['/node_modules/', '.eslintrc.js'],
		runner: 'jest-runner-eslint'
	}]
}