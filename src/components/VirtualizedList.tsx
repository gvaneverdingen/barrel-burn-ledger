import { FixedSizeList as List } from 'react-window';
import { useEffect, useState } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
}

export function VirtualizedList<T>({ 
  items, 
  renderItem, 
  itemHeight,
  className 
}: VirtualizedListProps<T>) {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      setHeight(Math.min(window.innerHeight - 300, items.length * itemHeight));
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [items.length, itemHeight]);

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className={className}
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(items[index], index)}
        </div>
      )}
    </List>
  );
}
