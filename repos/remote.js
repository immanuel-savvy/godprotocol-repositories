import Repository from "../Repository.js";

class Remote extends Repository {
  constructor({ url, key }) {
    super("remote");

    this.url = url;
    this.key = key;
  }

  get_headers = () => {
    let obj = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (this.key) {
      obj["Authorization"] = `Bearer ${this.key}`;
    }

    return obj;
  };

  fetch = async (payload) => {
    let res;
    try {
      res = await fetch(`${this.url}/remote-repo/${payload.method}`, {
        method: "POST",
        headers: this.get_headers(),
        body: JSON.stringify(payload.body),
      });
      res = await res.json();
      res = res && res.content;
    } catch (e) {
      console.log(e);
    }
    return res;
  };

  write_file = async (path, content) => {
    await this.fetch({
      method: "write",
      body: { path, content },
    });

    return { ok: true };
  };

  read_file = async (path) => {
    let content = await this.fetch({
      method: "read",
      body: { path },
    });
    return { ok: true, content };
  };

  repo_id = () => {
    return `${this.url}`;
  };

  stringify = () => {
    let obj = {};
    obj.key = this.key;
    obj.url = this.url;
    obj._id = this.repo_id();

    return obj;
  };
}

export default Remote;
