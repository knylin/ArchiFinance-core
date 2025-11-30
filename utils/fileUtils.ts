import { FileNode, ProjectStats } from "../types";

export const buildFileTree = (files: FileList): { tree: FileNode[], stats: ProjectStats } => {
  const root: FileNode[] = [];
  const stats: ProjectStats = {
    fileCount: 0,
    totalSize: 0,
    extensions: {}
  };

  // Convert FileList to array and sort by path length to ensure parent folders processed potentially (though logic handles creation)
  // Actually, we just iterate and build the path.
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    // Basic stats
    stats.fileCount++;
    stats.totalSize += file.size;
    const ext = file.name.split('.').pop() || 'unknown';
    stats.extensions[ext] = (stats.extensions[ext] || 0) + 1;

    // Path parsing
    // webkitRelativePath usually looks like "ProjectFolder/src/index.ts"
    const parts = file.webkitRelativePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let existingNode = currentLevel.find(node => node.name === part);

      if (existingNode) {
        if (isFile) {
          // Should not happen ideally if paths are unique files
          existingNode.file = file;
          existingNode.kind = 'file';
        } else {
          // It's a directory, traverse into it
          if (!existingNode.children) existingNode.children = [];
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          kind: isFile ? 'file' : 'directory',
          file: isFile ? file : undefined,
          children: isFile ? undefined : [],
          isOpen: false // Directories start collapsed by default
        };
        
        currentLevel.push(newNode);
        
        if (!isFile) {
          currentLevel = newNode.children!;
        }
      }
    }
  }

  // Sort function: Directories first, then files, alphabetical
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind === b.kind) {
        return a.name.localeCompare(b.name);
      }
      return a.kind === 'directory' ? -1 : 1;
    });
    nodes.forEach(node => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);

  return { tree: root, stats };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};