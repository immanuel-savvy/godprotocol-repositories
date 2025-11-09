import Repository from "../Repository.js";

class Github extends Repository {
  constructor({ key, username, repo, branch }) {
    super("github");

    this.base_url = "https://api.github.com";
    this.auth_token = key;
    this.owner = username;
    this.repo = repo;
    this.branch = branch || "main";

    // internal write queue
    this.writeQueue = Promise.resolve();
    this.writeDelay = 1000; // 1s delay between writes
  }

  // Headers for API calls
  get_headers = () => ({
    Authorization: `Bearer ${this.auth_token}`,
    Accept: "application/vnd.github.v3+json",
  });

  // =============== QUEUED WRITE WRAPPER ===============
  write_file = (file_path, content) => {
    this.writeQueue = this.writeQueue
      .then(() => this.write_file_(file_path, content))
      .then(
        (result) =>
          new Promise((r) => setTimeout(() => r(result), this.writeDelay))
      )
      .catch((e) => {
        console.log("[schedule_write error]", e.message);
        return { success: false, error: e.message };
      });
    return this.writeQueue;
  };

  // =============== MAIN WRITE METHOD ===============
  write_file_ = async (file_path, content) => {
    const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    const headers = this.get_headers();
    const bodyBase = { content: Buffer.from(content).toString("base64") };

    try {
      // Fetch latest SHA if file exists
      const currentSha = await this._get_sha(file_path);
      const body = {
        message: currentSha ? "Update file" : "Create file",
        ...bodyBase,
        ...(currentSha && { sha: currentSha }),
      };

      let res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      // Handle possible 409 conflict
      if (res.status === 409) {
        console.warn(`[GitHub] SHA conflict for ${file_path}. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000)); // extra wait before retry

        const newSha = await this._get_sha(file_path);
        // if (!newSha) throw new Error("Failed to refresh SHA after conflict.");

        const retryBody = {
          message: "Retry after conflict",
          ...bodyBase,
        };
        if (newSha) retryBody.sha = newSha;

        res = await fetch(url, {
          method: "PUT",
          headers,
          body: JSON.stringify(retryBody),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Write failed [${res.status}]: ${text}`);
      }

      const data = await res.json();
      return {
        success: true,
        sha: data?.content?.sha || null,
        response: data,
      };
    } catch (e) {
      console.log("[write_file error]", e.message);
      return { success: false, error: e.message };
    }
  };

  // =============== SUPPORT METHODS ===============
  _get_sha = async (file_path) => {
    try {
      const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}?ref=${this.branch}`;
      const res = await fetch(url, { headers: this.get_headers() });

      if (!res.ok) {
        // console.log("Res not ok", res.ok)
        return null;
      }
      const data = await res.json();
      return data.sha;
    } catch {
      return null;
    }
  };

  read_file = async (file_path) => {
    const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    try {
      const res = await fetch(url, { headers: this.get_headers() });
      if (!res.ok) return { ok: false };
      const data = await res.json();
      return {
        ok: true,
        content: Buffer.from(data.content, "base64").toString("utf-8"),
      };
    } catch (e) {
      console.log(e.message);
      return { ok: false };
    }
  };

  file_exists = async (file_path) => {
    const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    try {
      const res = await fetch(url, { headers: this.get_headers() });
      return res.ok;
    } catch {
      return false;
    }
  };

  delete_file = async (file_path, message = "Delete file") => {
    const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
    try {
      const res = await fetch(url, { headers: this.get_headers() });
      if (!res.ok) throw new Error("File not found");
      const data = await res.json();
      const sha = data.sha;

      const del = await fetch(url, {
        method: "DELETE",
        headers: this.get_headers(),
        body: JSON.stringify({ message, sha }),
      });

      if (!del.ok) {
        const err = await del.text();
        throw new Error(`Failed to delete file: ${err}`);
      }

      return await del.json();
    } catch (e) {
      console.log(e.message);
      return null;
    }
  };

  repo_id = () => `${this.owner}/${this.repo}`;

  stringify = () => ({
    key: this.auth_token,
    username: this.owner,
    repo: this.repo,
    _id: this.repo_id(),
    branch: this.branch,
  });
}

export default Github;
