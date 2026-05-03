// components/ui/user-avatar.tsx
export function UserAvatar({ image, name }: { image?: string | null; name?: string | null }) {
  // If no image exists, render a fallback initial instead of an empty <img> tag
  if (!image) {
    return (
      <div className="h-8 w-8 rounded-full border border-white/20 ring-2 ring-blue-500/20 bg-zinc-800 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-slate-400">
          {name?.charAt(0).toUpperCase() || "H"}
        </span>
      </div>
    );
  }

  return (
    <div className="h-8 w-8 rounded-full border border-white/20 ring-2 ring-blue-500/20 overflow-hidden shrink-0">
      <img 
        src={image} 
        alt={name || "User profile"} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer" 
      />
    </div>
  );
}