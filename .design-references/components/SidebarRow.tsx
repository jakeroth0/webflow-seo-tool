
import React from 'react';
import { Project } from '../types';
import { Icons } from '../constants';

interface SidebarRowProps {
  project: Project;
  onToggle: (id: string) => void;
}

const SidebarRow: React.FC<SidebarRowProps> = ({ project, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(project.id)}
      className={`
        group flex items-center px-2 py-1.5 mx-2 mb-0.5 rounded cursor-pointer transition-colors duration-150
        ${project.isSelected ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#DBDEE1]'}
      `}
    >
      <div className={`
        w-4 h-4 rounded flex items-center justify-center mr-2 border transition-colors
        ${project.isSelected ? 'bg-[#5865F2] border-[#5865F2]' : 'bg-[#1E1F22] border-[#4E5058] group-hover:border-[#DBDEE1]'}
      `}>
        {project.isSelected && <Icons.Check />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{project.name}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#949BA4] opacity-70">
          {project.itemCount} items • {project.lastUpdated}
        </div>
      </div>

      <div className={`transition-opacity duration-150 ${project.isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
        <Icons.ChevronRight />
      </div>
    </div>
  );
};

export default SidebarRow;
