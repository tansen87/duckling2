import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithStore } from 'jotai-zustand';
import { splitAtom } from 'jotai/utils';
import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TreeNode } from '@/types';

import { getDB } from '@/api';
import { atomStore } from '.';
import { indexDBStorage } from './indexdb';

export type NodeContextType = {
  id?: string;
  dbId: string;
  tableId: string;
  type?: string;
  extra?: unknown;
};

export type DialectType =
  | 'folder'
  | 'file'
  | 'duckdb'

export type DuckdbConfig = {
  path: string;
  cwd?: string;
  dialect: DialectType;
};

export type FolderConfig = {
  path: string;
  cwd?: string;
  dialect: DialectType;
};

export type FileConfig = {
  dialect: 'file';
  path: string;
};

export type DialectConfig =
  | DuckdbConfig
  | FolderConfig
  | FileConfig

export type DBType = {
  id: string;
  dialect: DialectType;

  displayName: string;
  // tree node
  data: TreeNode;
  meta?: Record<string, Record<string, { name: string; type: string }[]>>;
  config?: DialectConfig;
  defaultDatabase?: string;
  defaultSchema?: string;
  loading?: boolean;
};

type DBListState = {
  dbList: DBType[];
};

type DBListAction = {
  append: (db: DBType) => void;
  update: (id: string, db: Partial<DBType>) => void;
  // remove db by db id
  remove: (id: string) => void;
  rename: (id: string, displayName: string) => void;
  setCwd: (cwd: string, id: string) => void;
  setDB: (id: string, config: DialectConfig) => void;
  updateByConfig: (id: string, config: DialectConfig) => Promise<void>;
};

type DBListStore = DBListState & DBListAction;

export function flattenTree(tree: TreeNode): Map<string, TreeNode> {
  const result: Map<string, TreeNode> = new Map();

  function flatten(node: TreeNode) {
    result.set(node.path, node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(flatten);
    }
  }

  flatten(tree);
  return result;
}

const computed = createComputed((s: DBListStore) => ({
  dbMap: new Map(s.dbList.map((db) => [db.id, db])),
  tableMap: new Map(s.dbList.map((db) => [db.id, flattenTree(db.data)])),
}));

export const useDBListStore = create<DBListStore>()(
  computed(
    persist<DBListStore>(
      (set, get) => ({
        // state
        dbList: [],

        // action
        append: (db) => set((state) => ({ dbList: [...state.dbList, db] })),
        remove: (id) =>
          set((state) => ({
            dbList: state.dbList?.filter((item) => !(item.id === id)),
          })),
        update: (id, { id: _id, ...db }) =>
          set((state) => ({
            dbList: state.dbList.map((item) =>
              item.id !== id ? item : { ...item, ...db },
            ),
          })),

        updateByConfig: async (id: string, config: DialectConfig) => {
          const updateDB = get().update;
          try {
            updateDB(id, { loading: true });
            const { data, meta, defaultDatabase } = await getDB(config);
            updateDB(id, { data, meta, defaultDatabase, loading: false });
          } catch (error) {
            console.log(error);
          } finally {
            updateDB(id, { loading: false });
          }
        },

        setCwd: (cwd: string, id: string) =>
          set((state) => ({
            dbList: state.dbList.map((item) => {
              return item.id == id
                ? {
                    ...item,
                    config: { ...(item.config ?? {}), cwd } as DialectConfig,
                  }
                : item;
            }),
          })),
        setDB: (id: string, config) =>
          set((state) => ({
            dbList: state.dbList.map((item) =>
              item.id == id ? { ...item, config } : item,
            ),
          })),

        rename: (dbId: string, displayName: string) => {
          set(({ dbList }) => ({
            dbList: dbList.map((item) => {
              return item.id == dbId
                ? {
                    ...item,
                    displayName,
                  }
                : item;
            }),
          }));
        },
      }),
      {
        name: 'dbListStore',
        storage: createJSONStorage(() => indexDBStorage),
        partialize: (state) => ({ dbList: state.dbList }) as DBListStore,
      },
    ),
  ),
);

const storeAtom = atomWithStore(useDBListStore);
export const dbListAtom = focusAtom(storeAtom, (o) => o.prop('dbList'));
export const dbMapAtom = atom(
  (get) => new Map(get(dbListAtom).map((db) => [db.id, db])),
);

export const schemaMapAtom = atom(
  (get) => new Map(get(dbListAtom).map((db) => [db.id, db.meta ?? []])),
);

export const tablesAtom = atom(
  (get) => new Map(get(dbListAtom).map((db) => [db.id, flattenTree(db.data)])),
);

export const dbAtomsAtom = splitAtom(dbListAtom);

export const selectedNodeAtom = atom<NodeContextType | null>(null);

// db rename
export const renameAtom = atom<DBType | null>(null);
// db setting
export const configAtom = atom<DBType | null>(null);

atomStore.sub(dbListAtom, () => {});
