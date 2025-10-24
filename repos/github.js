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

    const bodyBase = {
      content: Buffer.from(content).toString("base64"),
    };

    try {
      let sha = null;
      let exists = false;

      // ✅ If user explicitly wants to fetch SHA first
      if (options.retrieve_sha) {
        const shaData = await this._get_sha(file_path);
        if (shaData) {
          sha = shaData;
          exists = true;
        }
      }

      // ✅ Try direct write (optimistic)
      const body = {
        message: exists ? "Update file" : "Create file",
        ...bodyBase,
        ...(sha && { sha }),
      };

      let res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      // ⚠️ If it failed because the file already exists (409 or similar)
      if (!res.ok) {
        const errText = await res.text();
        if (
          res.status === 409 ||
          errText.includes("sha") ||
          errText.includes("exists")
        ) {
          // Retrieve sha, retry
          const newSha = await this._get_sha(file_path);
          if (!newSha)
            throw new Error("Failed to retrieve SHA after conflict.");

          const retryBody = {
            message: "Update file after conflict",
            ...bodyBase,
            sha: newSha,
          };

          const retryRes = await fetch(url, {
            method: "PUT",
            headers,
            body: JSON.stringify(retryBody),
          });

          const retryJson = await retryRes.json();
          return {
            success: retryRes.ok,
            sha: newSha,
            response: retryJson,
          };
        } else {
          throw new Error(`Write failed: ${errText}`);
        }
      }

      const data = await res.json();
      const writtenSha = data?.content?.sha || sha || null;
      return {
        success: true,
        sha: writtenSha,
        response: data,
      };
    } catch (e) {
      console.log("[write_file error]", e.message);
      return { success: false, error: e.message };
    }
  };

  // 🔹 helper to get SHA only
  _get_sha = async (file_path) => {
    try {
      const url = `${this.base_url}/repos/${this.owner}/${this.repo}/contents/${file_path}`;
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
