import { Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FormStatusBadge({ status }) {
  const isLive = status === 'published';

  return (
    <Badge variant={isLive ? 'success' : 'subtle'}>
      {isLive ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-success-indicator" />
      ) : (
        <Circle aria-hidden="true" />
      )}
      {isLive ? 'Live' : 'Draft'}
    </Badge>
  );
}
