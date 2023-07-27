export default {
	transform: {
		'^.+\\.ts$': '@swc/jest',
	},
	extensionsToTreatAsEsm: ['.ts'],
	setupFiles: ['./test/setup.js'],
	setupFilesAfterEnv: ['jest-extended/all'],

	modulePaths: ['./'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},

	roots: ['./test'],
};
