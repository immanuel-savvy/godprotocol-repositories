import Fs from "./repos/fs.js";
import Github from "./repos/github.js";
import Remote from "./repos/remote.js";

class Repos {
  constructor() {}

  async cloth_repo(repoDef) {
    let repo;
    switch (repoDef.type) {
      case "fs":
        repo = new Fs(repoDef.options);
        break;
      case "github":
        repo = new Github(repoDef.options);
        break;
      case "remote":
        repo = new Remote(repoDef.options);
        break;
      default:
        throw new Error(`Unknown repo type: ${repoDef.type}`);
    }

    await repo.sync();

    return repo;
  }
}

export default Repos;
