import React from 'react';
import { Copy, Download } from 'lucide-react';
import { Button, useToast } from '../ui';
import { copyText, downloadText } from '../../lib/export';

export interface ExportButtonsProps {
  report: string;
  filename: string;
  disabled?: boolean;
}

export function ExportButtons({ report, filename, disabled }: ExportButtonsProps): React.JSX.Element {
  const toast = useToast();
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={async () => {
          const ok = await copyText(report);
          toast(ok ? 'Report copied to clipboard' : 'Could not copy', { tone: ok ? 'success' : 'warn' });
        }}
      >
        <Copy className="size-4" /> Copy report
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => {
          downloadText(filename, report);
          toast('Report downloaded');
        }}
      >
        <Download className="size-4" /> Download
      </Button>
    </div>
  );
}
