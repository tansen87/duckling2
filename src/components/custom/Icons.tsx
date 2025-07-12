import {
  IconBorderOuter,
  IconDatabase,
  IconFilePower,
  IconFileTypeCsv,
  IconFileTypeXls,
  IconFolder,
  IconFolderOpen,
  IconTable,
} from '@tabler/icons-react';
import { DatabaseIcon, FolderArchive } from 'lucide-react';
import * as React from 'react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: never;
  color?: string;
}

export const TransposeIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ color = 'currentColor', ...props }, forwardedRef) => {
    return (
      <svg
        viewBox="0 0 16 16"
        height="16"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
        ref={forwardedRef}
      >
        <path
          d="m1 1v14h7v-7h7v-7zm2 2h3v3h-3zm0 5h3v5h-3zm12 2-5 5h5z"
          fill={color}
        />
      </svg>
    );
  },
);

export const Transpose1Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ color = 'currentColor', ...props }, forwardedRef) => {
    return (
      <svg
        viewBox="0 0 32 32"
        height="32"
        width="32"
        xmlns="http://www.w3.org/2000/svg"
        fill={color}
        {...props}
        ref={forwardedRef}
      >
        <defs></defs>
        <path d="M19,26H14V24h5a5.0055,5.0055,0,0,0,5-5V14h2v5A7.0078,7.0078,0,0,1,19,26Z" />
        <path d="M8,30H4a2.0023,2.0023,0,0,1-2-2V14a2.0023,2.0023,0,0,1,2-2H8a2.0023,2.0023,0,0,1,2,2V28A2.0023,2.0023,0,0,1,8,30ZM4,14V28H8V14Z" />
        <path d="M28,10H14a2.0023,2.0023,0,0,1-2-2V4a2.0023,2.0023,0,0,1,2-2H28a2.0023,2.0023,0,0,1,2,2V8A2.0023,2.0023,0,0,1,28,10ZM14,4V8H28V4Z" />
        <rect height="32" width="32" />
      </svg>
    );
  },
);

export const DuckdbIcon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ color = 'currentColor', ...props }, forwardedRef) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 300"
        width="300"
        height="300"
        {...props}
        ref={forwardedRef}
      >
        <defs>
          <clipPath id="a">
            <path d="M0 0h300v300H0z" />
          </clipPath>
        </defs>
        <g>
          <path
            d="M0 148c-81.853 0-148-66.146-148-148S-81.853-148 0-148c81.854 0 148 66.146 148 148S81.854 148 0 148z"
            transform="translate(150 150)"
          />
          <path
            fill="#FFF000"
            d="M-61.314 0c0 33.828 27.486 61.314 61.314 61.314 33.829 0 61.314-27.486 61.314-61.314S33.829-61.314 0-61.314c-33.828 0-61.314 27.486-61.314 61.314z"
            transform="translate(119.191 150)"
          />
          <path
            fill="#FFF000"
            d="M3.474-21.898h-28.996v43.796H3.474c12.082 0 22.049-9.968 22.049-22.049 0-12.082-9.967-21.747-22.049-21.747z"
            transform="translate(225.661 149.849)"
          />
        </g>
      </svg>
    );
  },
);

export const getTypeIcon = (type: string, expanded?: boolean) => {
  if (type == 'path' && expanded) {
    return <IconFolderOpen />;
  }
  if (type == 'path' && !expanded) {
    return <IconFolder />;
  }
  if (type == 'folder') {
    return <FolderArchive />;
  }
  if (type == 'root') {
    return <IconDatabase />;
  }
  if (type == 'duckdb') {
    return <DuckdbIcon />;
  }
  if (type == 'database') {
    return <DatabaseIcon />;
  }
  if (type == 'table') {
    return <IconTable />;
  }
  if (type == 'view') {
    return <IconBorderOuter />;
  }
  if (type == 'csv') {
    return <IconFileTypeCsv />;
  }
  if (type == 'xlsx') {
    return <IconFileTypeXls />;
  }
  if (type == 'parquet') {
    return <IconFilePower />;
  }
};
