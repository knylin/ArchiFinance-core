import React from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, File as FileIcon } from 'lucide-react';

interface FileTreeProps {
  nodes: FileNode[];
  activeFile: FileNode | null;
  onSelectFile: (node: FileNode) => void;
  onToggleDirectory: (node: FileNode) => void;
  depth?: number;
}

const FileTree: React.FC<FileTreeProps> = ({ 
  nodes, 
  activeFile, 
  onSelectFile, 
  onToggleDirectory,
  depth = 0 
}) => {
  return (
    <ul className="select-none">
      {nodes.map((node) => (
        <li key={node.path}>
          <div
