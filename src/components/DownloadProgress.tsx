'use client';

interface DownloadProgressProps {
  id: number;
  progress: number;
  downloadSpeed?: string;
  timeRemaining?: string;
  status: string;
  name?: string;
}

export function DownloadProgressBar({ download }: { download: DownloadProgressProps }) {
  const getStatusColor = () => {
    switch (download.status) {
      case 'completed': return 'bg-green-500';
      case 'downloading': return 'bg-[#00fe9b]';
      case 'error': return 'bg-red-500';
      case 'stopped': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-200 truncate">
          {download.name || `Download #${download.id}`}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          download.status === 'completed' ? 'bg-green-500/10 text-green-400' :
          download.status === 'downloading' ? 'bg-[#00fe9b]/10 text-[#00fe9b]' :
          download.status === 'error' ? 'bg-red-500/10 text-red-400' :
          'bg-gray-500/10 text-gray-400'
        }`}>
          {download.status}
        </span>
      </div>

      <div className="w-full h-2 bg-black/45 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${Math.min(download.progress, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{download.downloadSpeed || '--'}</span>
        <span>{download.progress.toFixed(1)}%</span>
        <span>{download.timeRemaining || '--'}</span>
      </div>
    </div>
  );
}
