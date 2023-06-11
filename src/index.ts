export interface StorageOptions {
  databaseName: string;
  databaseVersion: number;
  tableName: string;
}

function invariant<E extends new (message: string) => Error>(
  condition: unknown,
  message: string,
  ErrorType?: E
): asserts condition {
  if (!condition) {
    throw new (ErrorType ?? Error)(message);
  }
}

async function connect(options: StorageOptions) {
  invariant(typeof indexedDB !== "undefined", "indexedDB is not supported");

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(
      options.databaseName,
      options.databaseVersion
    );

    request.addEventListener("error", () => {
      reject(
        new Error(
          `Failed to connect to database '${options.databaseName}' version ${options.databaseVersion}`
        )
      );
    });

    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      db.createObjectStore(options.tableName, {});
    });
  });
}

export const defaultOptions: StorageOptions = {
  databaseName: "smonn_storage",
  databaseVersion: 1,
  tableName: "kv",
};

export function createInstance(
  options: Partial<StorageOptions> = defaultOptions
) {
  let db: IDBDatabase | undefined;

  const config = Object.assign({}, defaultOptions, options);
  invariant(
    typeof config.databaseName === "string" && config.databaseName.length > 0,
    "databaseName must be a string",
    TypeError
  );
  invariant(
    typeof config.databaseVersion === "number" && config.databaseVersion > 0,
    "databaseVersion must be a number",
    TypeError
  );
  invariant(
    typeof config.tableName === "string" && config.tableName.length > 0,
    "tableName must be a string",
    TypeError
  );

  async function setItem<T>(key: string, value: T) {
    db = db ?? (await connect(config));

    return new Promise<void>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readwrite");

      transaction.addEventListener("error", () => {
        reject(transaction.error);
      });

      transaction.addEventListener("complete", () => {
        resolve();
      });

      const store = transaction.objectStore(config.tableName);

      const request = store.put(value, key);

      request.addEventListener("error", () => {
        reject(request.error);
      });
    });
  }

  async function getItem<T>(key: string) {
    db = db ?? (await connect(config));

    return new Promise<T>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readonly");

      transaction.addEventListener("error", () => {
        reject(transaction.error);
      });

      const store = transaction.objectStore(config.tableName);
      const request = store.get(key);

      request.addEventListener("error", () => {
        reject(request.error);
      });

      request.addEventListener("success", () => {
        resolve(request.result);
      });
    });
  }

  async function clear() {
    db = db ?? (await connect(config));

    return new Promise<void>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readwrite");
      const store = transaction.objectStore(config.tableName);
      const request = store.clear();

      request.addEventListener("error", () => {
        reject(request.error);
      });

      request.addEventListener("success", () => {
        resolve();
      });
    });
  }

  async function removeItem(key: string) {
    db = db ?? (await connect(config));

    return new Promise<void>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readwrite");

      transaction.addEventListener("error", () => {
        reject(transaction.error);
      });

      transaction.addEventListener("complete", () => {
        resolve();
      });

      const store = transaction.objectStore(config.tableName);

      const request = store.delete(key);

      request.addEventListener("error", () => {
        reject(request.error);
      });
    });
  }

  async function keys() {
    db = db ?? (await connect(config));

    return new Promise<IDBValidKey[]>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readonly");

      transaction.addEventListener("error", () => {
        reject(transaction.error);
      });

      const store = transaction.objectStore(config.tableName);
      const request = store.getAllKeys();

      request.addEventListener("error", () => {
        reject(request.error);
      });

      request.addEventListener("success", () => {
        resolve(request.result);
      });
    });
  }

  function asyncIterator() {
    let allKeys: IDBValidKey[] | null = null;
    let index = 0;

    return {
      async next(): Promise<
        | { done: true; value: undefined }
        | { done: false; value: [IDBValidKey, unknown] }
      > {
        if (!allKeys) {
          allKeys = await keys();
        }

        if (index >= allKeys.length) {
          return { done: true, value: undefined };
        } else {
          const key = allKeys[index++];
          if (key) {
            const value = await getItem(key as string);
            return { done: false, value: [key, value] };
          } else {
            return { done: true, value: undefined };
          }
        }
      },
      async return() {
        return { done: true, value: undefined };
      },
    };
  }

  async function size() {
    db = db ?? (await connect(config));

    return new Promise<number>((resolve, reject) => {
      invariant(db, "Database connection was closed");

      const transaction = db.transaction([config.tableName], "readonly");

      transaction.addEventListener("error", () => {
        reject(transaction.error);
      });

      const store = transaction.objectStore(config.tableName);
      const request = store.count();

      request.addEventListener("error", () => {
        reject(request.error);
      });

      request.addEventListener("success", () => {
        resolve(request.result);
      });
    });
  }

  function close() {
    if (db) {
      db.close();
      db = undefined;
    }
  }

  return Object.freeze({
    setItem,
    getItem,
    removeItem,
    clear,
    keys,
    close,
    size,
    [Symbol.asyncIterator]: asyncIterator,
  });
}

export const Storage = createInstance();
