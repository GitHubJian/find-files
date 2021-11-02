/**
 * @file find.js
 * @desc 查找文件
 */
import path from 'path';
import extglob from 'extglob';
import uniq from 'lodash.uniq';
import glob from 'glob';

function exec(str: string): RegExpExecArray {
    const arr = [str] as RegExpExecArray;
    arr.input = str;
    arr.index = 0;

    return arr;
}

export class Rule {
    from: string;
    to: string;
    private readonly rFrom?: string | RegExp;
    private readonly glob?: string;

    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;

        if (typeof from === 'string') {
            if (from.includes('(')) {
                this.rFrom = new RegExp(
                    `^${extglob(from).replace(/\(\?:/g, '(')}$`
                );
            } else {
                this.glob = from;
            }
        } else {
            this.rFrom = from;
        }
    }

    match(path: string): string | null {
        let matches: RegExpExecArray | null;

        if (this.rFrom) {
            matches = (this.rFrom as RegExp).exec(path);
        } else {
            if (extglob.isMatch(path, this.glob)) {
                matches = exec(path);
            } else {
                matches = null;
            }
        }

        if (!matches || matches.length === 0) {
            return null;
        }

        return this.to.replace(/\$(\d+)/g, function (_, i) {
            return (matches as RegExpExecArray)[i];
        });
    }
}

type MatchResult = [string, null | string];
class Makit {
    matchingRules: Rule[];

    constructor() {
        this.matchingRules = [];
    }

    /**
     * 添加规则
     * @param {string} target 规则
     * @param {string} prerequisites 先决条件
     */
    addRule(target: string, prerequisites: string): void {
        const rule = new Rule(target, prerequisites);

        this.matchingRules.push(rule);
    }

    /**
     * 匹配相关路径
     * @param {string[]} filelist 文件路径
     * @returns {MatchResult[]}
     */
    match(filelist: string[]): MatchResult[] {
        const result = filelist.reduce((prev, cur) => {
            const [src, dest] = this.matchRule(cur);
            prev.push([src, dest]);

            return prev;
        }, [] as MatchResult[]);

        return result;
    }

    /**
     * 规则匹配
     * @param {string} target 带匹配的路径
     * @returns {Array} 匹配项与规则
     */
    private matchRule(target: string): [string, string | null, Rule | null] {
        for (let i = this.matchingRules.length - 1; i >= 0; i--) {
            const rule = this.matchingRules[i];
            const match = rule.match(target);
            if (match) {
                return [target, match, rule];
            }
        }

        return [target, null, null];
    }
}

interface MatchOptions {
    src: string;
    dest?: string;
    rules?: Array<{from: string; to: string}>;
    nomatch?: boolean;
}

function normalizeList(
    list: Array<[string, string | null]>,
    nomatch?: boolean
): Array<[string, string]> {
    let result;
    if (nomatch) {
        result = list.filter(function (value) {
            return !!value[1];
        });
    } else {
        result = list.map(function (value) {
            return [value[0], value[1] || value[0]];
        });
    }

    return result;
}

let makit: Makit;
function match(
    files: string[],
    options: MatchOptions
): Array<[string, string]> {
    if (!makit) {
        makit = new Makit();
    }

    if (options.rules) {
        options.rules.forEach(function (rule) {
            const {from, to} = rule;

            makit.addRule(from, to);
        });
    }

    let result = makit.match(files);
    result = normalizeList(result, options.nomatch);

    const filelist: Array<[string, string]> = (
        result as Array<[string, string]>
    ).map(function (res) {
        const [src, dest] = res;

        const local = path.resolve(options.src, src);
        const origin = options.dest ? path.resolve(options.dest, dest) : dest;

        return [local, origin];
    });

    return filelist;
}

interface FindOptions {
    src: string;
    dest?: string;
    rules?: Array<{from: string; to: string}>;
    exclude?: string[];
    nomatch?: boolean;
}

function find(options: FindOptions): Array<[string, string]> {
    const ignores = uniq(['node_modules'].concat(options.exclude || []));

    const globOptions = {
        cwd: options.src,
        dot: true,
        nodir: true,
        ignore: ignores.map(v => `${v}/**`),
    };
    const files = glob.sync('**', globOptions);

    const filelist = match(files, {
        src: options.src,
        dest: options.dest,
        rules: options.rules,
        nomatch: options.nomatch,
    });

    return filelist;
}
export default find;
