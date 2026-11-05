import { apiClient } from "./api";
import { Repository, FileTreeItem, Commit, Issue, PullRequest } from "@/types";
import { mockRepositories, mockFileTree, mockFileContents, mockCommits, mockIssues, mockPullRequests } from "@/lib/mock-data";

export const repositoryService = {
  async getRepositories(): Promise<Repository[]> {
    try {
      const res = await apiClient.get("/repositories/");
      return res.data;
    } catch {
      return mockRepositories;
    }
  },

  async getRepository(owner: string, name: string): Promise<Repository | null> {
    try {
      const res = await apiClient.get(`/repositories/${owner}/${name}/`);
      return res.data;
    } catch {
      const found = mockRepositories.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      return found || mockRepositories[0];
    }
  },

  async getFileTree(repoId: string, path: string = "root"): Promise<FileTreeItem[]> {
    try {
      const res = await apiClient.get(`/repositories/${repoId}/tree/?path=${path}`);
      return res.data;
    } catch {
      return mockFileTree[path] || mockFileTree["root"];
    }
  },

  async getFileContent(repoId: string, filePath: string): Promise<string> {
    try {
      const res = await apiClient.get(`/repositories/${repoId}/blob/?path=${filePath}`);
      return res.data.content;
    } catch {
      return mockFileContents[filePath] || `// Contenu du fichier: ${filePath}\nconsole.log("Fichier chargé dans MetafriX");\n`;
    }
  },

  async getCommits(repoId: string): Promise<Commit[]> {
    try {
      const res = await apiClient.get(`/repositories/${repoId}/commits/`);
      return res.data;
    } catch {
      return mockCommits;
    }
  },

  async getIssues(repoId: string): Promise<Issue[]> {
    try {
      const res = await apiClient.get(`/repositories/${repoId}/issues/`);
      return res.data;
    } catch {
      return mockIssues;
    }
  },

  async getPullRequests(repoId: string): Promise<PullRequest[]> {
    try {
      const res = await apiClient.get(`/repositories/${repoId}/pulls/`);
      return res.data;
    } catch {
      return mockPullRequests;
    }
  },
};
