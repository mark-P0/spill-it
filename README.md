# Spill.it

## Scripts

### Running

```sh
pnpm --filter=<workspace-package-name> <commands>

# Whitespaced for clarity
pnpm
--filter=<workspace-package-name>
<commands>
```

```sh
# Run `package.json` scripts
pnpm --filter=@spill-it/api dev
pnpm --filter=@spill-it/ui dev

# Run `node_modules/` binaries
pnpm --filter=@spill-it/api exec tsc

# Install dependencies
pnpm --filter=@spill-it/ui i zod
pnpm --filter=@spill-it/api i -D @types/express
```

- Run `pnpm <commands>` as if it were in the root of `<workspace-package-name>`
- `<workspace-package-name>` is the value of the `"name"` key in the `package.json` file of the workspace package

> On a package's root directory, it is possible to run `node_modules/` binaries directly with e.g. `pnpm tsc`.
> However, from the workspace root and `--filter`ing e.g. `pnpm --filter=@spill-it/api tsc`, this does not seem to be possible, as `tsc` is interpreted as a `package.json` script.

### Installing workspace packages

```sh
pnpm --filter=<workspace-package-name-1> install --workspace [-D] <workspace-package-name-2>

# Whitespaced for clarity
pnpm
--filter=<workspace-package-name-1>
i[nstall] --workspace [-D]
<workspace-package-name-2>
```

```sh
pnpm --filter=@spill-it/api i --workspace @spill-it/utils
pnpm --filter=@spill-it/ui i --workspace @spill-it/endpoints
```

- Install `<workspace-package-name-2>` from the current workspace as a [development] dependency of `<workspace-package-name-1>`
- `<workspace-package-name-2>` must be included in the scope of `pnpm-workspace.yaml`
