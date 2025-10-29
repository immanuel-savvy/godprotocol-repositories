import Repository from "../Repository.js";

class Github extends Repository {
  constructor({ key, username, repo, branch }) {
    super("github");

    this.base_url = "https://api.github.com";
    this.auth_token = key;
    this.owner = username;
    this.repo = repo;
    this.branch = branch || "main";
  }

  // Headers for API calls
  get_headers = () => ({
    Authorization: `Bearer ${this.auth_token}`,
    Accept: "application/vnd.github.v3+json",
  });

  // Write (create or update) a file
  write_file = async (file_path, content, options = {}) => {
    const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    const headers = this.get_headers();

    try {
      // 1️⃣ Always check for SHA first
      const sha = await this._get_sha(file_path);

      // 2️⃣ Prepare request body
      const body = {
        message: sha ? "Update file" : "Create file",
        content: Buffer.from(content).toString("base64"),
        branch: this.branch, // always target correct branch
        ...(sha && { sha }),
      };

      // 3️⃣ Perform write
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          `Write failed [${res.status}]: ${data.message || "Unknown error"}`
        );
      }

      // 4️⃣ Return clean response
      return {
        success: true,
        sha: data?.content?.sha || sha || null,
        response: data,
      };
    } catch (e) {
      console.log("[write_file error]", e.message);
      return { success: false, error: e.message };
    }
  };

  _get_sha = async (file_path) => {
    try {
      const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}?ref=${this.branch}`;
      const res = await fetch(url, { headers: this.get_headers() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.sha;
    } catch {
      return null;
    }
  };

  // Read a file
  read_file = async (file_path) => {
    let url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;

    let response;
    try {
      response = await fetch(url, { headers: this.get_headers() });

      if (!response.ok) return { ok: false };

      let fileData = await response.json();
      return {
        ok: true,
        content: Buffer.from(fileData.content, "base64").toString("utf-8"),
      };
    } catch (e) {
      console.log(e.message);
      return { ok: false };
    }
  };

  // Check if file exists
  file_exists = async (file_path) => {
    let url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    try {
      let response = await fetch(url, { headers: this.get_headers() });
      return response.ok;
    } catch {
      return false;
    }
  };

  // --- Delete File ---
  delete_file = async (file_path, message = "Delete file") => {
    let url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;

    try {
      let res = await fetch(url, { headers: this.get_headers() });
      if (!res.ok) throw new Error("File not found");
      let data = await res.json();
      let sha = data.sha;

      let body = { message, sha };

      let del = await fetch(url, {
        method: "DELETE",
        headers: this.get_headers(),
        body: JSON.stringify(body),
      });

      if (!del.ok) {
        let err = await del.text();
        throw new Error(`Failed to delete file: ${err}`);
      }

      return await del.json();
    } catch (e) {
      console.log(e.message);
      return null;
    }
  };

  repo_id = () => {
    return `${this.owner}/${this.repo}`;
  };

  stringify = () => {
    let obj = {};
    obj.key = this.auth_token;
    obj.username = this.owner;
    obj.repo = this.repo;
    obj._id = this.repo_id();
    obj.branch = this.branch;

    return obj;
  };
}

export default Github;
