# @godprotocol/repositories

**A unified interface for managing local and remote repositories.**

This module provides a common abstraction for file operations across storage layers like the filesystem, GitHub, and other distributed repositories, forming the backbone of the God Protocol’s decentralized data infrastructure.

---

## Features

- **Unified Repository Interface**: Seamless read/write access to multiple repository types.
- **Extensible Architecture**: Define custom repository types using the base `Repository` class.
- **Multi-Source Sync**: Integrates local and remote repositories under one logical layer.
- **Dynamic Loader**: The `Repos` manager dynamically instantiates repositories from definitions.
- **Optimized I/O Operations**: Supports safe read/write, conflict resolution, and async synchronization.
- **Built for God Protocol**: Core dependency for Oracle and GDS decentralized systems.

---

## Installation

Install the module using npm:

```bash
npm install @godprotocol/repositories
```

---

## Quick Start

Set up and use a repository with the following example:

```javascript
import Repos from "@godprotocol/repositories/index.js";

const repoDef = {
  type: "github",
  options: {
    key: "ghp_XXXXX",
    username: "user-name",
    repo: "godprotocol-repos",
    branch: "main",
  },
};

const repositories = new Repos();
const repo = await repositories.cloth_repo(repoDef);

// Write file
await repo.write("docs/readme.md", "# Hello World");

// Read file
const content = await repo.read("docs/readme.md");
console.log(content); // "# Hello World"

// Sync repository
await repo.sync();
```

---

## Core API Reference

### Class: `Repository`

| Method                 | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `constructor(type)`    | Initializes a repository instance with its type (e.g., `fs`, `github`). |
| `sync()`               | Synchronizes repository state.                                          |
| `write(path, content)` | Writes data to the repository at the given path.                        |
| `read(path)`           | Reads content from the repository.                                      |
| `objectify()`          | Returns an object representation of the repository configuration.       |
| `get_id()`             | Returns the unique identifier of the repository.                        |
| `match()`              | Checks if the repository matches a given query or condition.            |

### Class: `Repos`

| Method                | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `cloth_repo(repoDef)` | Dynamically instantiates a repository based on its type and options. |

**Example**:

```javascript
const repos = new Repos();
const repo = await repos.cloth_repo({
  type: "fs",
  options: { root: "./data" },
});
```

---

## Example Repository Type: GitHub

Implements file operations over the GitHub REST API using `fetch`.

```javascript
import Repository from "@godprotocol/repositories/Repository.js";

class Github extends Repository {
  constructor({ key, username, repo, branch }) {
    super("github");
    this.auth_token = key;
    this.owner = username;
    this.repo = repo;
    this.branch = branch || "main";
  }

  async write_file(file_path, content) {
    // Handles create/update file logic with SHA conflict resolution
  }

  async read_file(file_path) {
    // Reads and decodes Base64 content from GitHub
  }

  async delete_file(file_path) {
    // Deletes file via GitHub API
  }

  repo_id = () => `string`;
}
```

---

## Supported Repository Types

| Type     | Description                    | Example Configuration                                  |
| -------- | ------------------------------ | ------------------------------------------------------ |
| `fs`     | Local filesystem repository    | `{ type: "fs", options: { root: "./data" } }`          |
| `github` | Remote GitHub-based repository | `{ type: "github", options: { key, username, repo } }` |

To add a custom repository type, extend the `Repository` class and implement the required I/O methods (`write_file`, `read_file`, etc.).

---

## Integration with God Protocol

This package is natively integrated into the God Protocol ecosystem:

| Module                  | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `@godprotocol/oracle`   | Uses repositories as data mirrors and sync points.              |
| `generalised-datastore` | Leverages repositories for distributed CRUD storage.            |
| `godprotocol`           | Core orchestrator for repository coordination and transactions. |

---

## Extending the System

Create a custom repository driver by extending the `Repository` class:

```javascript
import Repository from "@godprotocol/repositories/Repository.js";

class MyCustomRepo extends Repository {
  constructor(options) {
    super("custom");
    this.options = options;
  }

  async write_file(path, content) {
    // Implement custom write logic
  }

  async read_file(path) {
    // Implement custom read logic
  }
}
```

Register the custom repository dynamically:

```javascript
const repos = new Repos();
const myRepo = await repos.cloth_repo({ type: "custom", options: { ... } });
```

---

## License

MIT © [Savvy](https://github.com/immanuel-savvy)
