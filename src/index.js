import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import { CLIEngine } from 'eslint';

function normalizePath(id) {
	return path.relative(process.cwd(), id).split(path.sep).join('/');
}

export default function eslint(options = {}) {
	const cli = new CLIEngine(options);
	let formatter = options.formatter;

	if (typeof formatter !== 'function') {
		formatter = cli.getFormatter(formatter || 'stylish');
	}

	const filter = createFilter(
		options.include,
		options.exclude || 'node_modules/**'
	);

	return {
		name: 'eslint',

		transform(code, id) {
			const file = normalizePath(id);
			if (cli.isPathIgnored(file) || !filter(id)) {
				return null;
			}

			const report = cli.executeOnText(code, file);
			const anyError = !!report.errorCount || !!report.warningCount;
			if (!anyError) {
				return null;
			}

			const result = formatter(report.results);
			if (result) {
				console.log(result);
			}

			const throwBoth = options.throwOnError && options.throwOnWarning;
			if (throwBoth && anyError) {
				throw Error('Warnings or errors were found');
			} else if (options.throwOnError && report.errorCount) {
				throw Error('Errors were found');
			} else if (options.throwOnWarning && report.warningCount) {
				throw Error('Warnings were found');
			}
		}
	};
}
