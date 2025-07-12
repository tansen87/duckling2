import { ComponentProps, PropsWithChildren } from 'react';

import {
  DropdownMenuTrigger,
  DropdownMenu as UIDropdownMenu,
  DropdownMenuItem as UIDropdownMenuItem,
  DropdownMenuLabel as UIDropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { ChevronDownIcon } from 'lucide-react';

export interface DropdownProps
  extends PropsWithChildren<ComponentProps<typeof UIDropdownMenu>> {
  content: string;
}

export function DropdownMenu({ content, children }: DropdownProps) {
  return (
    <UIDropdownMenu>
      <DropdownMenuTrigger asChild>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink className="w-full px-2 text-xs" size={'sm'}>
              {content}
              <ChevronDownIcon size={16} />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </DropdownMenuTrigger>
      {children}
    </UIDropdownMenu>
  );
}

export function DropdownMenuItem(
  props: ComponentProps<typeof UIDropdownMenuItem>,
) {
  return <UIDropdownMenuItem className="py-1 text-xs" {...props} />;
}
export function DropdownMenuLabel(
  props: ComponentProps<typeof UIDropdownMenuLabel>,
) {
  return <UIDropdownMenuLabel className="py-1 text-xs" {...props} />;
}
