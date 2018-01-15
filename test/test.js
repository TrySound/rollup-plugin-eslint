import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import eslint from '../src';

process.chdir('test');

test('should lint files', () => {
    let count = 0;
    return rollup({
        input: 'fixtures/undeclared.js',
        plugins: [
            eslint({
                formatter: (results) => {
                    count += results[0].messages.length;
                    const message = results[0].messages[0].message;
                    expect(message).toEqual('\'x\' is not defined.');
                }
            })
        ]
    }).then(() => {
        expect(count).toEqual(1);
    });
});

test('should not fail with default options', () => {
    return rollup({
        input: 'fixtures/undeclared.js',
        plugins: [
            eslint()
        ]
    });
});

test('should ignore node_modules with exclude option', () => {
    let count = 0;
    return rollup({
        input: 'fixtures/modules.js',
        plugins: [
            nodeResolve({ jsnext: true }),
            eslint({
                configFile: 'fixtures/.eslintrc-babel',
                formatter: () => {
                    count += 1;
                }
            })
        ]
    }).then(() => {
        expect(count).toEqual(0);
    });
});

test('should ignore files according .eslintignore', () => {
    let count = 0;
    return rollup({
        input: 'fixtures/ignored.js',
        plugins: [
            eslint({
                formatter: () => {
                    count += 1;
                }
            })
        ]
    }).then(() => {
        expect(count).toEqual(0);
    });
});

test('should fail with enabled throwOnWarning and throwOnError options', () => {
    return expect(
        rollup({
            input: 'fixtures/with-error.js',
            plugins: [
                eslint({
                    throwOnWarning: true,
                    throwOnError: true,
                    formatter: () => ''
                })
            ]
        }).catch(e => Promise.reject(e.toString()))
    ).rejects.toMatch(/Warnings or errors were found/);
});

test('should fail with enabled throwOnError option', () => {
    return expect(
        rollup({
            input: 'fixtures/with-error.js',
            plugins: [
                eslint({
                    throwOnError: true,
                    formatter: () => ''
                })
            ]
        }).catch(e => Promise.reject(e.toString()))
    ).rejects.toMatch(/Errors were found/);
});

test('should fail with enabled throwOnWarning option', () => {
    return expect(
        rollup({
            input: 'fixtures/with-error.js',
            plugins: [
                eslint({
                    throwOnWarning: true,
                    formatter: () => ''
                })
            ]
        }).catch(e => Promise.reject(e.toString()))
    ).rejects.toMatch(/Warnings were found/);
});

test('should not fail with throwOnError and throwOnWarning disabled', () => {
    return rollup({
        input: 'fixtures/with-error.js',
        plugins: [
            eslint({
                throwOnError: false,
                throwOnWarning: false,
                formatter: () => ''
            })
        ]
    });
});

test('should fail with not found formatter', () => {
    expect(() => {
        eslint({ formatter: 'not-found-formatter' });
    }).toThrowError(/There was a problem loading formatter/);
});

test('should not fail with found formatter', () => {
    return rollup({
        input: 'fixtures/with-error.js',
        plugins: [
            eslint({
                formatter: 'stylish'
            })
        ]
    });
});

describe('fix bundled code', () => {
    const outputOptions = {
        format: 'iife',
        name: 'fixed'
    };

    const configFile = 'fixtures/.eslintrc';

    function getBundleCode(promise) {
        return promise.then(bundle => bundle.generate(outputOptions))
                      .then(({ code }) => code)
    }

    test('should fix if enabled', () => {
        return expect(
            getBundleCode(rollup({
                input: 'fixtures/fixable.js',
                plugins: [ 
                    eslint({ 
                        fix: true,
                        configFile
                    }) ]
            }))
        ).resolves.not.toEqual(expect.stringContaining('debugger;'))
    })
    
    test('should not fix if disabled', () => {
        return expect(
            getBundleCode(rollup({
                input: 'fixtures/fixable.js',
                plugins: [ eslint({ configFile }) ]
            }))
        ).resolves.toEqual(expect.stringContaining('debugger;'))
    })
})


