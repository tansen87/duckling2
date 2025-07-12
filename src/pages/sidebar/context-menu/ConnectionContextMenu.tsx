import { Code, RefreshCcw, Settings } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { PropsWithChildren, useState } from 'react';

import { ContextMenuItem } from '@/components/custom/context-menu';
import { useDialog } from '@/components/custom/use-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ConfigDialog } from '@/pages/sidebar/dialog/ConfigDialog';
import { RenameDialog } from '@/pages/sidebar/dialog/RenameDialog';
import { DBType, useDBListStore } from '@/stores/dbList';
import { useTabsStore } from '@/stores/tabs';

import { useHotkeys } from 'react-hotkeys-hook';

export const ConnectionContextMenu = React.memo(function ConnectionContextMenu({
  children,
  db,
}: PropsWithChildren<{ db: DBType }>) {
  const updateTab = useTabsStore((state) => state.update);
  const removeDB = useDBListStore((state) => state.remove);
  const updateDB = useDBListStore((state) => state.updateByConfig);

  const dialog = useDialog();
  const configDialog = useDialog();

  const handleEditor = () => {
    if (db) {
      const displayName = db?.displayName ?? '';
      updateTab!({
        id: nanoid(),
        dbId: db.id,
        displayName,
        type: 'editor',
      });
    }
  };

  const handleRemove = () => {
    removeDB(db.id);
  };
  const handleProperties = () => {
    configDialog.trigger();
  };

  const handleRefresh = async () => {
    if (db.config) {
      updateDB(db.id, db.config);
    }
  };

  const handleRename = () => {
    dialog.trigger();
  };
  const [enabled, setEnabled] = useState(false);

  useHotkeys('f2', handleRename, { enabled });
  useHotkeys('f3', handleProperties, { enabled });
  useHotkeys('f4', handleEditor, { enabled });
  useHotkeys('f5', handleRefresh, { enabled });
  useHotkeys('delete', handleRemove, { enabled });

  return (
    <>
      <ContextMenu onOpenChange={setEnabled}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onSelect={handleProperties} icon={Settings}>
            Properties
            <ContextMenuShortcut>F3</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={handleEditor} icon={Code}>
            SQL Editor
            <ContextMenuShortcut>F4</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem inset onSelect={handleRename}>
            Rename
            <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleRefresh} icon={RefreshCcw}>
            Refresh
            <ContextMenuShortcut>F5</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem inset onSelect={handleRemove} tabIndex={-1}>
            Delete
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <RenameDialog {...dialog.props} ctx={db} />
      <ConfigDialog {...configDialog.props} ctx={db} />
    </>
  );
});
