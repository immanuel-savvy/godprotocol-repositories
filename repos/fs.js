import fs from "fs";
import Repository from "../Repository.js";

class Fs extends Repository {
  constructor({ base_dir, name }) {
    super("fs");

    this.base_dir = base_dir;
    this.name = name;
  }

  treat_path = (path) => `${this.base_dir}/${path}`;

  write_file = async (path, content) => {
    path = this.treat_path(path);

    fs.writeFileSync(path, content);
  };

  read_file = async (path) => {
    path = this.treat_path(path);

    return fs.readFileSync(path, { encoding: "utf-8" });
  };

  repo_id = () => {
    return `${this.base_dir}/${this.name}`;
  };

  stringify = () => {
    let obj = {};
    obj.base_dir = this.base_dir;
    obj.name = this.name;
    obj._id = this.repo_id();

    return obj;
  };
}

export default Fs;
