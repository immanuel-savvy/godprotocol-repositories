import Repository from "../Repository.js";
import { hash } from "../utils/cryptography.js";
import { MongoClient } from "mongodb";

class MongoDB extends Repository {
  constructor({ db_url, db_name }) {
    super("mongo");
    this.db_url = db_url;
    this.db_name = db_name;
    this.client = null;
    this.db = null;
  }

  // Connect once and reuse
  async _connect() {
    if (this.db) return this.db;

    try {
      if (!this.client) {
        this.client = new MongoClient(this.db_url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      }

      await this.client.connect();
      this.db = this.client.db(this.db_name);
      return this.db;
    } catch (err) {
      console.error("[MongoDB connect error]", err.message);
      throw err;
    }
  }

  /**
   * Write or replace file data.
   * - collection = hash(filepath directory)
   * - document _id = filename
   * - overwrites existing if exists
   */
  async write_file(path, content) {
    try {
      const parts = path.split("/");
      const file = parts.pop();
      const folder = parts.join("/") || "/";

      const col = await this.collection(folder);

      const doc = {
        _id: file,
        content,
        updated_at: new Date(),
      };

      await col.replaceOne({ _id: file }, doc, { upsert: true });

      return { ok: true, path };
    } catch (e) {
      console.error("[MongoDB write_file error]", e.message);
      return { success: false, error: e.message };
    }
  }

  collection = async (folder) => {
    try {
      const db = await this._connect();

      return db.collection(hash(folder));
    } catch (e) {}
  };

  /**
   * Read file by path.
   */
  async read_file(path) {
    try {
      const parts = path.split("/");
      const file = parts.pop();
      const folder = parts.join("/") || "/";
      const col = await this.collection(folder);

      const result = await col.findOne({ _id: file });
      if (!result) return { ok: false, content: null };

      return { ok: true, content: result.content };
    } catch (e) {
      console.error("[MongoDB read_file error]", e.message);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Optional: close connection (for short-lived scripts)
   */
  async close() {
    try {
      if (this.client) await this.client.close();
      this.client = null;
      this.db = null;
    } catch (e) {
      console.error("[MongoDB close error]", e.message);
    }
  }

  stringify = () => ({
    db_url: this.db_url,
    db_name: this.db_name,
    _id: this.repo_id(),
  });

  repo_id = () => hash(this.db_url).concat("/").concat(this.db_name);
}

export default MongoDB;
