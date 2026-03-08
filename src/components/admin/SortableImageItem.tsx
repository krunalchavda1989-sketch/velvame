import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";

interface SortableImageItemProps {
  id: string;
  imageUrl: string;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImageItem = ({ id, imageUrl, index, onRemove }: SortableImageItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group"
    >
      <img src={imageUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 rounded bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <button
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] text-muted-foreground">
        {index + 1}
      </div>
    </div>
  );
};

export default SortableImageItem;
