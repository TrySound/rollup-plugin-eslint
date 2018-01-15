import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import { CLIEngine } from 'eslint';

function normalizePath(id) {
    return path.relative(process.cwd(), id).split(path.sep).join('/');
}

module.exports = function eslint(options = {}) {
    const cli = new CLIEngine(options);
    let formatter = options.formatter;

    if (typeof formatter !== 'function') {
        formatter = cli.getFormatter(formatter || 'stylish');
    }

    const filter = createFilter(
        options.include,
        options.exclude || /node_modules/
    );

    return {
        name: 'eslint',

        transform(code, id) {
            const file = normalizePath(id);
            if (cli.isPathIgnored(file) || !filter(id)) {
                return null;
            }

            const report = cli.executeOnText(code, file);
            const hasWarnings = options.throwOnWarning && report.warningCount !== 0;
            const hasErrors = options.throwOnError && report.errorCount !== 0;

            if (report.warningCount === 0 && report.errorCount === 0) {
                return null;
            }

            const result = formatter(report.results);

            if (result) {
                console.log(result);
            }

            if (hasWarnings && hasErrors) {
                throw Error('Warnings or errors were found');
            }

            if (hasWarnings) {
                throw Error('Warnings were found');
            }

            if (hasErrors) {
                throw Error('Errors were found');
            }
        },

        transformBundle(code) {
            if (!options.fix) {
                return code;
            }

            const report = cli.executeOnText(code);
 
            return report.results[0].output;
        }
    };
}
