module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['./test/setup-test.js'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/test/mocks/fileMock.js',
    // scratch-vmソースへの参照をリポジトリ隣接のxcratchチェックアウトへ解決する。
    // ホスト(/Users/rin/xcratch/)でもDockerコンテナ内(/usr/local/xcratch/)でも
    // <rootDir>/../xcratch が同じ実体を指すため、両環境でテストが動く。
    '^(?:\\.\\./)+extension-support/(.*)$': '<rootDir>/../xcratch/packages/scratch-vm/src/extension-support/$1',
    '^/usr/local/xcratch/xcratch/packages/scratch-vm/src/(.*)$': '<rootDir>/../xcratch/packages/scratch-vm/src/$1'
  },
  testMatch: ['**/test/unit/**/*.test.js'],
};
