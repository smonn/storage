import { Storage } from "./index";

async function deleteDatabase(name: string) {
  const request = window.indexedDB.deleteDatabase(name);
  return new Promise<void>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteDatabases() {
  Storage.close();
  await deleteDatabase("smonn_storage");
}

describe("Storage", () => {
  beforeEach(async () => {
    await deleteDatabases();
  });

  it("basic API checks", () => {
    expect(Storage).to.not.be.undefined;
    expect(typeof Storage.clear).to.eq("function");
    expect(typeof Storage.getItem).to.eq("function");
    expect(typeof Storage.keys).to.eq("function");
    expect(typeof Storage.setItem).to.eq("function");
    expect(typeof Storage.removeItem).to.eq("function");
  });

  describe("setItem", () => {
    it("adds item", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("set_item_add", "test_value");
      expect(await Storage.size()).to.eq(1);
    });

    it("overrides item", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("set_item_override", "test_value_1");
      await Storage.setItem("set_item_override", "test_value_2");
      expect(await Storage.size()).to.eq(1);
    });
  });

  describe("getItem", () => {
    it("gets non-set item", async () => {
      expect(await Storage.size()).to.eq(0);
      const value = await Storage.getItem("get_item_unset");
      expect(await Storage.size()).to.eq(0);
      expect(value).to.be.undefined;
    });

    it("gets set item", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("get_item_set", "test_value");
      const value = await Storage.getItem("get_item_set");
      expect(await Storage.size()).to.eq(1);
      expect(value).to.eq("test_value");
    });
  });

  describe("removeItem", () => {
    it("no-ops on non-set item", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.removeItem("remove_item_unset");
      expect(await Storage.size()).to.eq(0);
    });

    it("removes set item", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("remove_item_set", "test_value");
      expect(await Storage.size()).to.eq(1);
      await Storage.removeItem("remove_item_set");
      expect(await Storage.size()).to.eq(0);
    });
  });

  describe("clear", () => {
    it("removes all items", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("clear_item_1", "test_value_1");
      await Storage.setItem("clear_item_2", "test_value_2");
      expect(await Storage.size()).to.eq(2);
      await Storage.clear();
      expect(await Storage.size()).to.eq(0);
    });
  });

  describe("keys", () => {
    it("returns empty array when no items", async () => {
      expect(await Storage.size()).to.eq(0);
      const keys = await Storage.keys();
      expect(keys).to.deep.eq([]);
    });

    it("returns all keys", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("keys_item_1", "test_value_1");
      await Storage.setItem("keys_item_2", "test_value_2");
      const keys = await Storage.keys();
      expect(keys).to.deep.eq(["keys_item_1", "keys_item_2"]);
    });
  });

  describe("size", () => {
    it("returns 0 when no items", async () => {
      expect(await Storage.size()).to.eq(0);
    });

    it("returns correct size", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("size_item_1", "test_value_1");
      await Storage.setItem("size_item_2", "test_value_2");
      expect(await Storage.size()).to.eq(2);
    });
  });

  describe("close", () => {
    it("closes connection", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("close_item_1", "test_value_1");
      await Storage.setItem("close_item_2", "test_value_2");
      expect(await Storage.size()).to.eq(2);
      Storage.close();
      expect(await Storage.size()).to.eq(2);
    });
  });

  describe("asyncIterator", () => {
    it("iterates over all items", async () => {
      expect(await Storage.size()).to.eq(0);
      await Storage.setItem("iterator_item_1", "test_value_1");
      await Storage.setItem("iterator_item_2", "test_value_2");
      expect(await Storage.size()).to.eq(2);
      const items: [IDBValidKey, unknown][] = [];
      for await (const item of Storage) {
        if (item) {
          items.push(item);
        }
      }
      expect(items).to.deep.eq([
        ["iterator_item_1", "test_value_1"],
        ["iterator_item_2", "test_value_2"],
      ]);
    });
  });
});
