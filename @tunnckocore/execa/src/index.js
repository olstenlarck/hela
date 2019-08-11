import execa from 'execa';
import pMap from 'p-map';

/**
 * Uses [execa][] v2, `execa.command()` method.
 * As stated there, think of it as mix of `child_process`'s `.execFile` and `.spawn`.
 * It is pretty similar to the `.shell` method too, but only visually because
 * it does not uses the system's shell, meaning it does not have access to
 * the system's environment variables. You also can control concurrency by
 * passing `options.concurrency` option. For example, pass `concurrency: 1` to run in series
 * instead of in parallel which is the default behavior.
 *
 * > It also can accept array of multiple strings of commands that will be
 * executed in series or in parallel (default).
 *
 * @example
 * import { exec } from '@tunnckocore/execa';
 * // or
 * // const { exec } = require('@tunnckocore/execa');
 *
 * async function main() {
 *   await exec('echo "hello world"', { stdio: 'inherit' });
 *
 *   // executes in series (because `concurrency` option is set to `1`)
 *   await exec([
 *     'prettier-eslint --write foobar.js',
 *     'eslint --format codeframe foobar.js --fix'
 *   ], { stdio: 'inherit', preferLocal: true, concurrency: 1 });
 * }
 *
 * main();
 *
 * @name   .exec
 * @param  {string|string[]} cmds a commands to execute in parallel or series
 * @param  {object} [options] directly passed to [execa][] and so to `child_process`
 * @return {Promise} resolved or rejected promises
 * @public
 */
export async function exec(cmds, options) {
  const commands = [].concat(cmds).filter(Boolean);
  const { concurrency = Infinity, ...opts } = Object.assign(
    { preferLocal: true },
    options,
  );

  return pMap(commands, (cmd) => execa.command(cmd, opts), { concurrency });
}

/**
 * Similar to `exec`, but also **can** access the system's environment variables from the command.
 *
 * @example
 * import { shell } from '@tunnckocore/execa';
 * // or
 * // const { shell } = require('@tunnckocore/execa');
 *
 * async function main() {
 *   // executes in series
 *   await shell([
 *     'echo unicorns',
 *     'echo "foo-$HOME-bar"',
 *     'echo dragons'
 *   ], { stdio: 'inherit' });
 *
 *   // exits with code 3
 *   try {
 *     await shell([
 *       'exit 3',
 *       'echo nah'
 *     ]);
 *   } catch (er) {
 *     console.error(er);
 *     // => {
 *     //  message: 'Command failed: /bin/sh -c exit 3'
 *     //  killed: false,
 *     //  code: 3,
 *     //  signal: null,
 *     //  cmd: '/bin/sh -c exit 3',
 *     //  stdout: '',
 *     //  stderr: '',
 *     //  timedOut: false
 *     // }
 *   }
 * }
 *
 * main();
 *
 * @name   .shell
 * @param  {string|string[]} cmds a commands to execute in parallel or series
 * @param  {object} options directly passed to `execa`
 * @return {Promise} resolved or rejected promises
 * @public
 */
export function shell(cmds, options) {
  return exec(cmds, Object.assign({}, options, { shell: true }));
}

/**
 * Same as [execa][]'s default export, see its documentation.
 *
 * @example
 * import execa from '@tunnckocore/execa'
 * // or
 * // const execa = require('@tunnckocore/execa');
 *
 * async function main() {
 *   await execa('npm', ['install'], { stdio: 'inherit' });
 * }
 *
 * main();
 *
 * @name   execa
 * @public
 */
export default execa;
