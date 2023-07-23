## Table of contents

- [Introduction](#introduction)
- [Inputs](#inputs)
- [Usage](#usage)

## Introduction

This action set the assignees on a PR based of a CODEOWNERS file.

## Inputs

| input                   | description                                          | required  |
|-------------------------|------------------------------------------------------|-----------|
| `github-token`          | Auth token with permissions to label PR              | `true`    |
| `codewatchers-filename` | Filename of codewatchers file. Default: CODEWATCHERS | `false`   |
| `github-user-mappings`  | Optional user to github user mappings                | `false`   |
| `add-assignees`         | Optional false to not add to assignees               | `false`   |

## Usage

```yml
name: Add CODEWATCHERS
on:
  pull_request:
    types: [opened]
jobs:
  add-assignees:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Add CODEWATCHERS as assignees
        uses: mavtek/codewatchers@latest
        with:
          codewatchers-filename: CODEWATCHERS
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

```yml
name: Output CodeOwners in Change
on:
  pull_request:
    types: [opened]
  push:
jobs:
  add-assignees:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Find CODEOWNERS of changed files
        id: codeowners
        uses: mavtek/codewatchers@latest
        with:
          codewatchers-filename: CODEOWNERS
          github-token: ${{ secrets.GITHUB_TOKEN }}
          add-assignees: false
      - name: Output CODEOWNERS
        run: echo ${{ steps.codeowners.outputs.add-assignees }} 
```
