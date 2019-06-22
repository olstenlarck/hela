import mod from 'module';
import proc from 'process';
import dargs from 'dargs';
import execa from 'execa';
import Sade from 'sade';

import allModulesPaths from 'all-module-paths';

// eslint-disable-next-line no-underscore-dangle
const paths = mod._nodeModulePaths(proc.cwd());

// see the screenshots below
const dirs = allModulesPaths({ paths });
const OWN_PATH = dirs.allPaths.binaries.join(':');

proc.env.PATH = `${OWN_PATH}:${proc.env.PATH}`;

const defaultOptions = {
  stdio: 'inherit',
  env: proc.env,
};

/**
 *
 * @param {object} argv
 * @param {object} options
 */
export function toFlags(argv, options) {
  const opts = Object.assign({ allowSingleFlags: true }, options);
  return dargs(argv, opts).join(' ');
}

/**
 *
 * @param {string|string[]} cmds
 * @param {object} [options]
 * @public
 */
export function shell(cmds, options) {
  return exec(cmds, Object.assign({}, options, { shell: true }));
}

/**
 *
 * @param {string|string[]} cmd
 * @param {object} [options]
 * @public
 */
export async function exec(cmds, options) {
  const commands = [].concat(cmds).filter(Boolean);
  const opts = Object.assign({}, defaultOptions, options);

  /* eslint-disable no-restricted-syntax, no-await-in-loop */
  for (const cmd of commands) {
    await execa.command(cmd, opts);
  }
}

/**
 *
 * @param {object} [options]
 * @public
 */
export function hela(options) {
  const prog = Sade('hela').version('3.0.0');
  const opts = Object.assign({}, defaultOptions, options, { lazy: true });

  return Object.assign(prog, {
    isHela: true,
    commands: {},

    /**
     * Action that will be called when command is called.
     *
     * @name hela().action
     * @param {Function} fn
     * @public
     */
    action(fn) {
      const name = this.curr || '__default__';
      const taskObj = this.tree[name];

      if (typeof fn === 'function') {
        taskObj.handler = async (...args) => {
          const fakeArgv = Object.assign({}, taskObj.default, { _: [name] });

          return fn.apply(this, args.concat(fakeArgv));
        };
      }

      this.option('--cwd', 'Current working directory', proc.cwd());
      this.commands[name] = taskObj;

      const programName = this.name;
      // ! important: sade does add `.name` to the instance,
      // ! but also it uses it for generating help and such.
      delete this.name;

      const handler = Object.assign(taskObj.handler, this);

      // ! restore
      this.name = programName;

      return handler;
    },

    /**
     * Start the magic. Parse input commands and flags,
     * give them the corresponding command and its action function.
     *
     * @name hela().listen
     * @param {Function} fn
     * @public
     */
    async listen() {
      const result = prog.parse(proc.argv, opts);

      if (!result || (result && !result.args && !result.name)) {
        return;
      }
      const { args, name, handler } = result;

      try {
        await handler.apply(this, args);
      } catch (err) {
        const error = Object.assign(err, {
          commandArgv: args.pop(),
          commandArgs: args,
          commandName: name,
        });
        throw error;
      }
    },
  });
}
