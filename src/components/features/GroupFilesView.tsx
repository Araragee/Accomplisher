import React from 'react';
import { UploadCloud, File as FileIcon } from 'lucide-react';
import { Card } from '../ui';

const MOCK_FILES = [
  { id: '1', name: 'Q3_Report.pdf', size: '2.4 MB', uploader: 'Dex', date: 'Oct 1' },
  { id: '2', name: 'logo-assets.zip', size: '14 MB', uploader: 'Sarah', date: 'Oct 3' },
];

export function GroupFilesView(): React.JSX.Element {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 rounded-xl border border-dashed border-line-strong bg-panel p-8 text-center flex flex-col items-center gap-3">
        <div className="p-3 bg-surface rounded-full shadow-sm">
          <UploadCloud className="size-6 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Upload Files</p>
          <p className="text-xs text-muted mt-1">Drag and drop or click to upload</p>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_FILES.map(f => (
          <Card key={f.id} className="p-4 flex items-center gap-4 hover:border-line-strong transition-colors cursor-pointer">
            <div className="p-2 bg-panel rounded-lg">
              <FileIcon className="size-5 text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{f.name}</p>
              <div className="flex items-center gap-3 text-xs text-subtle mt-1">
                <span>{f.size}</span>
                <span>•</span>
                <span>Uploaded by {f.uploader}</span>
                <span>•</span>
                <span>{f.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
