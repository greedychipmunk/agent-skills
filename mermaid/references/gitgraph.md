# Git Graph Reference

## Declaration

```
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
```

Initialized with `main` branch as default current branch.

## Commands

### commit

```
commit
commit id: "custom_id"
commit type: HIGHLIGHT
commit tag: "v1.0"
commit id: "fix" type: REVERSE tag: "bugfix"
```

Commit types:
- `NORMAL` — solid circle (default)
- `REVERSE` — crossed solid circle
- `HIGHLIGHT` — filled rectangle

Attributes can be combined in any order.

### branch

```
branch develop
branch "cherry-pick"
```

Creates a new branch and switches to it. Name must be unique. Quote names that could be confused with keywords.

Branch ordering: `branch develop order: 2`. Controls vertical position.

### checkout / switch

```
checkout develop
switch develop
```

Switches to an existing branch. `checkout` and `switch` are interchangeable.

### merge

```
merge develop
merge develop id: "merge_id" tag: "v2.0" type: HIGHLIGHT
```

Merges an existing branch into the current branch. Creates a merge commit (filled double circle). Cannot merge a branch with itself.

### cherry-pick

```
cherry-pick id: "commit_id"
cherry-pick id: "merge_id" parent: "parent_id"
```

Creates a new commit on the current branch from another branch's commit. Visualized with a cherry icon and tag.

Rules:
- Must provide an existing commit `id`.
- Commit must not be on the current branch.
- Current branch must have at least one commit.
- For merge commits, `parent` is mandatory and must be an immediate parent.

## Orientation (v10.3.0+)

```
gitGraph LR:
gitGraph TB:
gitGraph BT:
```

- `LR` — Left to Right (default)
- `TB` — Top to Bottom
- `BT` — Bottom to Top (v11.0.0+)

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `showBranches` | boolean | true | Show branch lines |
| `showCommitLabel` | boolean | true | Show commit labels |
| `mainBranchName` | string | "main" | Name of default branch |
| `mainBranchOrder` | number | 0 | Position of main branch |
| `parallelCommits` | boolean | false | Show commits at same level if equidistant |
| `rotateCommitLabel` | boolean | true | Rotate commit labels 45 degrees |

## Themes

Pre-defined themes: `base`, `forest`, `dark`, `default`, `neutral`.

Set via `initialize` or directives: `%%{init: {'theme': 'forest'}}%%`.

## Theme Variables

| Variable | Description |
| --- | --- |
| `git0`–`git7` | Branch colors (up to 8, then cyclic) |
| `gitBranchLabel0`–`gitBranchLabel7` | Branch label colors |
| `gitInv0`–`gitInv7` | Highlight commit colors per branch |
| `commitLabelColor` | Commit label text color |
| `commitLabelBackground` | Commit label background |
| `commitLabelFontSize` | Commit label font size |
| `tagLabelColor` | Tag label text color |
| `tagLabelBackground` | Tag label background |
| `tagLabelBorder` | Tag label border color |
| `tagLabelFontSize` | Tag label font size |
