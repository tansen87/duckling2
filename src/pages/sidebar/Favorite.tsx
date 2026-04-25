import { useAtomValue, useSetAtom } from 'jotai';
import { Code2Icon, DatabaseIcon, SearchIcon, TableIcon, Trash2Icon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/custom/search';
import { HistoryContextMenu } from '@/pages/sidebar/context-menu/HistoryContextMenu';
import { docsAtom, favoriteAtom, runsAtom } from '@/stores/app';
import { dbMapAtom } from '@/stores/dbList';
import { QueryContextType, TabContextType, useTabsStore } from '@/stores/tabs';

interface ItemLabelProps {
  icon?: ReactNode;
  content: ReactNode;
  onClick?: () => void;
  suffix?: ReactNode;
}

export const ItemLabel = React.forwardRef(
  ({ icon, content, onClick, suffix }: ItemLabelProps, ref) => {
    return (
      <div className="flex items-center w-full">
        <Button
          variant="ghost"
          className="flex-1 flex flex-row items-center justify-start p-0 pt-0.5 pb-0.5 text-sm h-6 min-w-0"
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={onClick}
        >
          {icon ? (
            <div className="ml-2 flex items-center h-full">{icon}</div>
          ) : null}
          <div className="ml-2 w-full truncate font-mono text-left">
            {content}
          </div>
        </Button>
        {suffix && <div className="mr-1">{suffix}</div>}
      </div>
    );
  },
);

export function Container({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="grid h-full w-full">
      <div className="hidden border-r md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-8 items-center border-b px-2">
            <a className="flex items-center gap-2 font-semibold">
              <span className="text-sm">{title}</span>
            </a>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-1 text-sm">{children}</nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Favorite() {
  const items = useAtomValue(favoriteAtom);
  const updateTab = useTabsStore((state) => state.update);
  const setFavorite = useSetAtom(favoriteAtom);
  const [searchText, setSearchText] = useState('');

  const filteredItems = items.filter((item) => {
    if (!searchText.trim()) return true;
    return item.displayName?.toLowerCase().includes(searchText.toLowerCase());
  });

  const handleClick = (item: TabContextType) => {
    updateTab(item);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Container title="Favorite">
      <div className="-mt-px">
        <SearchInput
          placeholder="Search favorites..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {filteredItems.map((item, i) => {
        const Comp =
          item.type == 'search'
            ? SearchIcon
            : item.type == 'editor'
              ? Code2Icon
              : TableIcon;
        return (
          <ItemLabel
            key={i}
            content={item.displayName}
            icon={<Comp className="size-4 min-w-4 mr-1" />}
            onClick={() => {
              handleClick(item);
            }}
            suffix={
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id, e);
                }}
              >
                <Trash2Icon className="size-3" />
              </Button>
            }
          />
        );
      })}
    </Container>
  );
}

export function History() {
  const items = useAtomValue(runsAtom) as QueryContextType[];
  const dbMap = useAtomValue(dbMapAtom);
  const updateTab = useTabsStore((state) => state.update);
  const setDocs = useSetAtom(docsAtom);
  const setRuns = useSetAtom(runsAtom);
  const [searchText, setSearchText] = useState('');

  const filteredItems = React.useMemo(() => {
    if (!searchText.trim()) {
      return items;
    }
    const searchLower = searchText.toLowerCase();
    return items.filter((item) =>
      item.stmt?.toLowerCase().includes(searchLower)
    );
  }, [items, searchText]);

  const itemsByDB = React.useMemo(() => {
    const grouped = new Map<string, QueryContextType[]>();
    filteredItems.forEach((item) => {
      const dbId = item.dbId;
      if (!grouped.has(dbId)) {
        grouped.set(dbId, []);
      }
      grouped.get(dbId)!.push(item);
    });
    return grouped;
  }, [filteredItems]);

  const truncateSQL = (sql: string, maxLength: number = 60) => {
    if (!sql) return '';
    const singleLine = sql.replace(/\s+/g, ' ').trim();
    if (singleLine.length <= maxLength) return singleLine;
    return singleLine.substring(0, maxLength) + '...';
  };

  const handleClick = (item: QueryContextType) => {
    const editorId = nanoid();
    const db = dbMap.get(item.dbId);
    const displayName = db?.displayName || 'SQL Editor';
    setDocs((prev) => ({ ...prev, [editorId]: item.stmt || '' }));
    updateTab({
      id: editorId,
      dbId: item.dbId,
      schema: item.schema,
      type: 'editor',
      displayName,
    });
  };

  const handleDeleteDBHistory = (dbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRuns((prev) => prev.filter((item) => item.dbId !== dbId));
  };

  return (
    <Container title="History">
      <div className="-mt-px">
        <SearchInput
          placeholder="Search history..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {Array.from(itemsByDB.entries()).map(([dbId, dbItems]) => {
        const db = dbMap.get(dbId);
        const dbName = db?.displayName || dbId;
        return (
          <React.Fragment key={dbId}>
            <div className="flex items-center justify-between px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-1">
                <DatabaseIcon className="size-3" />
                <span>{dbName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={(e) => handleDeleteDBHistory(dbId, e)}
              >
                <Trash2Icon className="size-3" />
              </Button>
            </div>
            {dbItems.map((item, i) => (
              <HistoryContextMenu key={`${dbId}-${i}`} ctx={item}>
                <ItemLabel
                  content={truncateSQL(item.stmt || '')}
                  onClick={() => handleClick(item)}
                />
              </HistoryContextMenu>
            ))}
          </React.Fragment>
        );
      })}
    </Container>
  );
}

export function SqlCode() {
  const tabs = useTabsStore((state) => state.tabs);
  const updateTab = useTabsStore((state) => state.update);

  const handleClick = (item: TabContextType) => {
    updateTab(item);
  };

  return (
    <Container title="Code">
      {Object.values(tabs)
        .filter((tab) => tab.type == 'editor')
        .map((item) => {
          return (
            <ItemLabel
              key={item.id}
              content={item.displayName}
              onClick={() => {
                handleClick(item);
              }}
            />
          );
        })}
    </Container>
  );
}
