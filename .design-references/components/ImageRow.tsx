
import React from 'react';
import { ImageAsset } from '../types';
import { Icons } from '../constants';

interface ImageRowProps {
  image: ImageAsset;
  onUpdate: (id: string, updates: Partial<ImageAsset>) => void;
  onGenerate: (id: string) => void;
  disabled?: boolean;
}

const ImageRow: React.FC<ImageRowProps> = ({ image, onUpdate, onGenerate, disabled }) => {
  const charCount = image.newAlt.length;
  const isOverLimit = charCount > 125;

  return (
    <div className={`
      flex flex-col md:flex-row gap-4 p-4 border-b border-[#2B2D31] hover:bg-[#35373C] transition-colors
      ${disabled ? 'opacity-50 pointer-events-none' : ''}
    `}>
      {/* Selection Toggle */}
      <div className="flex items-start pt-1">
        <button 
          onClick={() => onUpdate(image.id, { isOptedIn: !image.isOptedIn })}
          className={`
            w-10 h-5 rounded-full relative transition-colors duration-200
            ${image.isOptedIn ? 'bg-[#23A559]' : 'bg-[#4E5058]'}
          `}
        >
          <div className={`
            absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200
            ${image.isOptedIn ? 'left-[22px]' : 'left-0.5'}
          `} />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="shrink-0">
        <img 
          src={image.thumbnailUrl} 
          alt="Preview" 
          className="w-20 h-20 rounded object-cover bg-[#1E1F22] border border-[#2B2D31]"
        />
      </div>

      {/* Info & Current Alt */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-[#F2F3F5]">{image.fieldName}</span>
          <span className="text-xs text-[#949BA4]">in {image.projectName}</span>
        </div>

        <div className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wider mb-1">Current Alt Text</div>
        <div className="p-2 rounded bg-[#1E1F22] border border-[#2B2D31] text-xs text-[#DBDEE1] leading-relaxed break-words">
          {image.currentAlt || <span className="italic opacity-50">Empty Alt Text</span>}
        </div>
      </div>

      {/* New Alt Text Input */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">New SEO Alt Text</label>
          <span className={`text-[10px] font-bold ${isOverLimit ? 'text-[#F23F42]' : 'text-[#949BA4]'}`}>
            {charCount}/125
          </span>
        </div>
        
        <div className="relative group">
          <textarea
            value={image.newAlt}
            onChange={(e) => onUpdate(image.id, { newAlt: e.target.value })}
            placeholder="Describe the image context for SEO..."
            className={`
              w-full h-20 p-2.5 rounded bg-[#1E1F22] border border-transparent focus:border-[#5865F2] outline-none text-xs text-[#DBDEE1] resize-none transition-all
              ${isOverLimit ? 'border-[#F23F42] focus:border-[#F23F42]' : ''}
            `}
          />
          <button 
            onClick={() => onGenerate(image.id)}
            disabled={image.status === 'processing'}
            className="absolute bottom-2 right-2 p-1.5 rounded bg-[#2B2D31] hover:bg-[#404249] text-[#B5BAC1] hover:text-white transition-colors"
            title="Auto-generate with AI"
          >
            <Icons.Sparkles />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageRow;
