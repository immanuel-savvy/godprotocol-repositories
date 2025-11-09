import Fs from "./repos/fs.js";
import Github from "./repos/github.js";
import MongoDB from "./repos/mongo.js";
import Remote from "./repos/remote.js";

class Repos {
  constructor() {}

  async cloth_repo(repo_object) {
    let repo;
    switch (repo_object.type) {
      case "fs":
        repo = new Fs(repo_object);
        break;
      case "github":
        repo = new Github(repo_object);
        break;
      case "remote":
        repo = new Remote(repo_object);
        break;
      case "mongo":
        repo = new MongoDB(repo_object);
        break;
      default:
        throw new Error(`Unknown repo type: ${repo_object.type}`);
    }

    await repo.sync();

    return repo;
  }
}

export default Repos;
