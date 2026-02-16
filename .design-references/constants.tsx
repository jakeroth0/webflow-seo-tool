
import React from 'react';

export const COLORS = {
  bgApp: '#1E1F22',      // Discord Deep Background
  bgSidebar: '#2B2D31',  // Discord Sidebar
  bgMain: '#313338',     // Discord Chat Area
  bgHover: '#35373C',    // Sidebar Hover
  bgSelected: '#404249', // Sidebar Selected
  bgInput: '#1E1F22',    // Input Background
  bgMuted: '#2B2D31',    // Read-only block
  accent: '#5865F2',     // Discord Blurple
  accentHover: '#4752C4',
  textMain: '#DBDEE1',
  textMuted: '#949BA4',
  textHeader: '#F2F3F5',
};

export const MOCK_PROJECTS = [
  { id: 'p1', name: 'Blog Posts', itemCount: 24, lastUpdated: '2h ago', isSelected: false },
  { id: 'p2', name: 'Products Catalog', itemCount: 156, lastUpdated: '1d ago', isSelected: false },
  { id: 'p3', name: 'Team Members', itemCount: 12, lastUpdated: '3d ago', isSelected: false },
  { id: 'p4', name: 'Case Studies', itemCount: 45, lastUpdated: '5h ago', isSelected: false },
  { id: 'p5', name: 'Service Pages', itemCount: 8, lastUpdated: '1w ago', isSelected: false },
  { id: 'p6', name: 'Client Testimonials', itemCount: 30, lastUpdated: '2d ago', isSelected: false },
  { id: 'p7', name: 'Landing Pages (LP)', itemCount: 15, lastUpdated: '4h ago', isSelected: false },
  { id: 'p8', name: 'FAQ Database', itemCount: 110, lastUpdated: '12h ago', isSelected: false },
];

export const MOCK_IMAGES = [
  {
    id: 'img1',
    projectId: 'p1',
    projectName: 'Blog Posts',
    fieldName: 'Main Hero Image',
    thumbnailUrl: 'https://picsum.photos/id/10/200/200',
    currentAlt: 'A beautiful sunset over the mountains with clear sky.',
    newAlt: '',
    isOptedIn: false,
    status: 'idle' as const
  },
  {
    id: 'img2',
    projectId: 'p1',
    projectName: 'Blog Posts',
    fieldName: 'Author Avatar',
    thumbnailUrl: 'https://picsum.photos/id/64/200/200',
    currentAlt: 'Profile picture of the author John Doe.',
    newAlt: '',
    isOptedIn: false,
    status: 'idle' as const
  },
  {
    id: 'img3',
    projectId: 'p2',
    projectName: 'Products Catalog',
    fieldName: 'Product Gallery 01',
    thumbnailUrl: 'https://picsum.photos/id/250/200/200',
    currentAlt: 'Standard camera lens on white background.',
    newAlt: '',
    isOptedIn: false,
    status: 'idle' as const
  },
  {
    id: 'img4',
    projectId: 'p4',
    projectName: 'Case Studies',
    fieldName: 'Results Chart',
    thumbnailUrl: 'https://picsum.photos/id/201/200/200',
    currentAlt: 'A generic chart showing growth.',
    newAlt: '',
    isOptedIn: false,
    status: 'idle' as const
  }
];

export const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
};
