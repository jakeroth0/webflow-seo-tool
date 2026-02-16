
import React, { useState, useEffect, useMemo } from 'react';
import { Project, ImageAsset } from './types';
import { MOCK_PROJECTS, MOCK_IMAGES, Icons } from './constants';
import SidebarRow from './components/SidebarRow';
import ImageRow from './components/ImageRow';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [images, setImages] = useState<ImageAsset[]>(MOCK_IMAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Filter projects by search
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Computed selected projects
  const selectedProjectIds = useMemo(() => 
    projects.filter(p => p.isSelected).map(p => p.id), 
    [projects]
  );

  // Filter images based on project selection
  const visibleImages = useMemo(() => {
    if (selectedProjectIds.length === 0) return [];
    return images.filter(img => selectedProjectIds.includes(img.projectId));
  }, [images, selectedProjectIds]);

  const toggleProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isSelected: !p.isSelected } : p));
  };

  const selectAllProjects = () => {
    const allSelected = projects.every(p => p.isSelected);
    setProjects(prev => prev.map(p => ({ ...p, isSelected: !allSelected })));
  };

  const updateImage = (id: string, updates: Partial<ImageAsset>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateAltWithAI = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    updateImage(id, { status: 'processing' });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Describe this image for SEO alt text. Context: This image is used in a Webflow project called "${img.projectName}" under the field "${img.fieldName}". Original alt text was: "${img.currentAlt}". Keep it under 125 characters. Return ONLY the description text.`,
      });
      
      const newAlt = response.text?.trim() || "No description generated.";
      updateImage(id, { newAlt, status: 'idle' });
      showToast("Alt text generated!");
    } catch (error) {
      console.error(error);
      updateImage(id, { status: 'idle' });
      showToast("Failed to generate AI text.", "error");
    }
  };

  const runBulkJob = async () => {
    const selectedImages = images.filter(img => img.isOptedIn && selectedProjectIds.includes(img.projectId));
    if (selectedImages.length === 0) {
      showToast("No images selected to sync.", "error");
      return;
    }

    setIsJobRunning(true);
    // Simulate API delay
    await new Promise(res => setTimeout(res, 2000));
    setIsJobRunning(false);
    showToast(`Successfully synced ${selectedImages.length} images to Webflow!`);
  };

  return (
    <div className="flex h-screen w-full bg-[#1E1F22] overflow-hidden select-none">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-2xl z-50 transition-all transform animate-bounce border ${toast.type === 'success' ? 'bg-[#23A559] border-[#1a8044]' : 'bg-[#F23F42] border-[#c03235]'} text-white text-sm font-medium`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar: Projects */}
      <aside className="w-[280px] md:w-[320px] flex flex-col bg-[#2B2D31] border-r border-[#1E1F22]">
        <header className="h-12 flex items-center px-4 shadow-sm shrink-0">
          <h1 className="text-[#F2F3F5] font-bold text-base truncate">Webflow Projects</h1>
        </header>

        <div className="px-3 py-2">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs px-2 py-1.5 rounded outline-none placeholder:text-[#949BA4] focus:ring-1 focus:ring-[#5865F2] transition-all"
            />
            <div className="absolute right-2 top-1.5 text-[#949BA4]">
              <Icons.Search />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 flex justify-between items-center text-[11px] font-bold text-[#949BA4] uppercase tracking-wider">
          <span>{filteredProjects.length} Collections</span>
          <button 
            onClick={selectAllProjects}
            className="hover:text-[#DBDEE1] transition-colors"
          >
            {projects.every(p => p.isSelected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-2 pb-10">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <SidebarRow 
                key={project.id} 
                project={project} 
                onToggle={toggleProject} 
              />
            ))
          ) : (
            <div className="px-4 py-10 text-center text-[#949BA4] text-xs italic">
              No projects found...
            </div>
          )}
        </div>

        {/* User / Footer area */}
        <div className="h-14 bg-[#232428] px-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#3F4147] cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm">WF</div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#F2F3F5] truncate leading-tight">Webflow API</span>
              <span className="text-[10px] text-[#949BA4] leading-tight">Connected</span>
            </div>
          </div>
          <button className="p-1.5 text-[#B5BAC1] hover:text-[#DBDEE1] hover:bg-[#3F4147] rounded transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Panel: Image List */}
      <main className="flex-1 flex flex-col bg-[#313338] min-w-0">
        <header className="h-12 flex items-center justify-between px-4 shadow-sm bg-[#313338] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#949BA4] font-medium">#</span>
            <h2 className="text-[#F2F3F5] font-bold text-base">Image Optimizer</h2>
          </div>
          
          <button 
            onClick={runBulkJob}
            disabled={isJobRunning || visibleImages.length === 0}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold text-white transition-all
              ${isJobRunning ? 'bg-[#404249] cursor-not-allowed' : 'bg-[#5865F2] hover:bg-[#4752C4] shadow-lg'}
            `}
          >
            {isJobRunning ? (
              <>
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Sync to Webflow
              </>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {visibleImages.length > 0 ? (
            <>
              <div className="px-4 py-3 bg-[#2B2D31]/30 border-b border-[#2B2D31]">
                <p className="text-xs text-[#949BA4]">
                  Showing <span className="text-[#F2F3F5] font-bold">{visibleImages.length} images</span> across {selectedProjectIds.length} selected projects.
                </p>
              </div>
              <div className="divide-y divide-[#2B2D31]">
                {visibleImages.map(image => (
                  <ImageRow 
                    key={image.id} 
                    image={image} 
                    onUpdate={updateImage} 
                    onGenerate={generateAltWithAI}
                    disabled={isJobRunning}
                  />
                ))}
              </div>
              <div className="p-8 text-center text-[#949BA4] text-xs">
                You've reached the end of the collection.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-48 h-48 mb-6 relative">
                <div className="absolute inset-0 bg-[#5865F2]/5 rounded-full animate-pulse" />
                <img 
                  src="https://picsum.photos/id/160/400/400" 
                  alt="Empty" 
                  className="w-full h-full object-cover rounded-full grayscale opacity-20 border-4 border-[#2B2D31]"
                />
              </div>
              <h3 className="text-[#F2F3F5] text-xl font-bold mb-2">Ready to optimize?</h3>
              <p className="text-[#949BA4] text-sm max-w-sm leading-relaxed">
                Select one or more projects from the sidebar to load and edit image alt text for SEO.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
