'use client';

import Logger from '../logger/logger';
import { Button } from '@/components/ui/button';
import { modelOptions } from '@/app/audio/constants';
import { useLoggerStore } from '@/app/audio/store-logger';
import { cn } from '@/lib/utils';
import { useLiveAPIContext } from '@/hooks/use-live-api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { IoSettingsOutline } from 'react-icons/io5';
import { MdOutlineHistory } from 'react-icons/md';
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from 'react-icons/ri';
import Select from 'react-select';

interface SidePanelProps {
  onCollapse: (collapsed: boolean) => void;
  isCollapsed: boolean;
}

export default function SidePanel({ onCollapse, isCollapsed }: SidePanelProps) {
  const { connected, client } = useLiveAPIContext();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();

  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);

  //scroll the log to the bottom when new logs come in
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  // listen for log events and store them
  useEffect(() => {
    client.on('log', log);
    return () => {
      client.off('log', log);
    };
  }, [client, log]);

  const handleToggle = useCallback(() => {
    if (typeof onCollapse === 'function') {
      onCollapse(!isCollapsed);
    }
  }, [onCollapse, isCollapsed]);

  return (
    <div className="flex h-screen w-fit">
      {/* Navigation Bar */}
      <nav className="flex w-16 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/50 py-6">
        {/* Top buttons */}
        <div className="flex flex-1 flex-col items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-blue-500/10 p-3 text-blue-400 hover:bg-blue-500/20"
            disabled={!connected}
          >
            <HiOutlineClipboardDocumentList size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-3"
            disabled={!connected}
          >
            <MdOutlineHistory size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-3"
            disabled={!connected}
          >
            <IoSettingsOutline size={24} />
          </Button>
        </div>

        {/* Collapse button - Always at bottom */}
        <div className="flex flex-none justify-center pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="p-3 hover:bg-muted/20"
            onClick={handleToggle}
          >
            {isCollapsed ? (
              <RiSidebarUnfoldLine size={24} />
            ) : (
              <RiSidebarFoldLine size={24} />
            )}
          </Button>
        </div>
      </nav>

      {/* Main Panel */}
      <div
        className={cn(
          'flex flex-col overflow-hidden bg-neutral-900 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-0' : 'w-[340px]'
        )}
      >
        <div
          className={cn(
            'flex h-full w-[340px] flex-col transition-opacity duration-300',
            isCollapsed ? 'invisible opacity-0' : 'visible opacity-100'
          )}
        >
          {/* Header */}
          <header className="flex flex-none items-center justify-between border-b border-neutral-800 px-8 py-4 pr-10">
            <h2 className="text-xl font-medium text-neutral-100">Settings</h2>
          </header>

          {/* Content Area */}
          <div className="flex h-full flex-1 flex-col pb-5">
            {/* Model Selection - Fixed */}
            <div className="flex-none space-y-4 border-b border-neutral-800 px-6 py-4 pr-14">
              <label className="text-sm font-medium text-neutral-400">
                Model
              </label>
              <Select
                className="mt-2 h-fit flex-1 text-sm"
                value={selectedModel}
                options={modelOptions}
                onChange={(option) => setSelectedModel(option!)}
                isDisabled={connected}
                styles={{
                  control: (base) => ({
                    ...base,
                    background: 'rgb(23 23 23)',
                    borderColor: 'rgb(38 38 38)',
                  }),
                  menu: (base) => ({
                    ...base,
                    background: 'rgb(23 23 23)',
                    borderColor: 'rgb(38 38 38)',
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isFocused
                      ? 'rgb(38 38 38)'
                      : isSelected
                        ? 'rgb(64 64 64)'
                        : undefined,
                    color: 'rgb(229 229 229)',
                  }),
                }}
              />

              <div
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm whitespace-nowrap',
                  connected
                    ? 'border-blue-900/50 bg-blue-950/20 text-blue-400'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                )}
              >
                {connected ? '🟢 Connected' : '⚫ Disconnected'}
              </div>
            </div>

            {/* Logger Section - Scrollable */}
            <div className="h-full flex-1">
              <OverlayScrollbarsComponent
                defer
                options={{
                  scrollbars: {
                    theme: 'os-theme-dark',
                    autoHide: 'move',
                  },
                }}
                className="h-full"
              >
                <div className="p-6">
                  {logs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <p>No transcripts yet</p>
                    </div>
                  ) : (
                    <Logger filter="none" />
                  )}
                </div>
              </OverlayScrollbarsComponent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
