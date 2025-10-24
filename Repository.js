class Repository {
  constructor(type) {
    this.type = type;
  }

  sync = async () => {
    return this;
  };

  write = async (path, content) => {
    let res = await this.write_file(path, content);

    if (!res.ok) {
      return;
    }
    return res;
  };

  read = async (path) => {
    let content = await this.read_file(path);

    if (!content.ok) {
      return;
    }
    return content.content;
  };

  objectify = () => {
    let obj = { type: this.type, ...this.stringify() };

    return obj;
  };

  get_id = () => {
    if (this._id) return this._id;

    this._id = this.repo_id();

    return this._id;
  };

  match = async () => {
    return false;
  };
}

export default Repository;
