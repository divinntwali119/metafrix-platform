import { apiClient } from "./api";
import { Repository, FileTreeItem, Commit, Issue, PullRequest } from "@/types";
import { mockRepositories, mockFileTree, mockFileContents, mockCommits, mockIssues, mockPullRequests } from "@/lib/mock-data";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function listData<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

export const repositoryService = {
  async getRepositories(params: { owner?: string; search?: string; page?: number; page_size?: number } = {}): Promise<Repository[]> {
    try {
      const res = await apiClient.get("/repositories/", { params });
      return listData<Repository>(res.data);
    } catch (error) {
      if (demoMode) return mockRepositories;
      throw error;
    }
  },

  async getRepository(owner: string, name: string): Promise<Repository | null> {
    try {
      const res = await apiClient.get(
        `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/`,
      );
      return res.data;
    } catch (error) {
      if (!demoMode && (error as { response?: { status?: number } }).response?.status === 404) {
        return null;
      }
      if (!demoMode) throw error;
      const found = mockRepositories.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      return found && found.owner.username.toLowerCase() === owner.toLowerCase()
        ? found
        : null;
    }
  },

  async createRepository(data: {
    name: string;
    description: string;
    isPrivate: boolean;
    language: string;
    topics: string[];
    initializeReadme: boolean;
  }): Promise<Repository> {
    const response = await apiClient.post("/repositories/", data);
    return response.data;
  },

  async updateRepository(
    repositoryId: string,
    data: { description: string; isPrivate: boolean },
  ): Promise<Repository> {
    const response = await apiClient.patch(
      `/repositories/${encodeURIComponent(repositoryId)}/`,
      data,
    );
    return response.data;
  },

  async setRepositoryStarred(repositoryId: string, starred: boolean): Promise<{
    isStarred: boolean;
    starsCount: number;
  }> {
    const url = `/repositories/${encodeURIComponent(repositoryId)}/star/`;
    const response = starred ? await apiClient.put(url) : await apiClient.delete(url);
    return response.data;
  },

  async setRepositoryWatching(repositoryId: string, watching: boolean): Promise<{
    isWatching: boolean;
    watchersCount: number;
  }> {
    const url = `/repositories/${encodeURIComponent(repositoryId)}/watch/`;
    const response = watching ? await apiClient.put(url) : await apiClient.delete(url);
    return response.data;
  },

  async getBranches(repoId: string): Promise<string[]> {
    try {
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/branches/`);
      return listData<string>(res.data);
    } catch (error) {
      if (!demoMode) throw error;
      const repository = mockRepositories.find((item) => item.id === repoId);
      return repository ? [repository.defaultBranch] : [];
    }
  },

  async getFileTree(
    repoId: string,
    path: string = "root",
    branch?: string,
  ): Promise<FileTreeItem[]> {
    try {
      const params = new URLSearchParams({ path });
      if (branch) params.set("branch", branch);
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/tree/?${params.toString()}`);
      return listData<FileTreeItem>(res.data);
    } catch (error) {
      if (!demoMode) throw error;
      return mockFileTree[path] || mockFileTree["root"];
    }
  },

  async getFileContent(repoId: string, filePath: string, branch?: string): Promise<string> {
    try {
      const params = new URLSearchParams({ path: filePath });
      if (branch) params.set("branch", branch);
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/blob/?${params.toString()}`);
      return res.data.content;
    } catch (error) {
      if (!demoMode) throw error;
      return mockFileContents[filePath] || `// Contenu du fichier: ${filePath}\nconsole.log("Fichier chargé dans MetafriX");\n`;
    }
  },

  async getCommits(repoId: string, branch?: string): Promise<Commit[]> {
    try {
      const params = branch ? `?${new URLSearchParams({ branch }).toString()}` : "";
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/commits/${params}`);
      return listData<Commit>(res.data);
    } catch (error) {
      if (!demoMode) throw error;
      return mockCommits;
    }
  },

  async getIssues(repoId: string): Promise<Issue[]> {
    try {
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/issues/`);
      return listData<Issue>(res.data);
    } catch (error) {
      if (!demoMode) throw error;
      return mockIssues;
    }
  },

  async getPullRequests(repoId: string): Promise<PullRequest[]> {
    try {
      const res = await apiClient.get(`/repositories/${encodeURIComponent(repoId)}/pulls/`);
      return listData<PullRequest>(res.data);
    } catch (error) {
      if (!demoMode) throw error;
      return mockPullRequests;
    }
  },

  async createIssue(
    repositoryId: string,
    data: { title: string; body: string; labels: { name: string; color: string }[] },
  ): Promise<Issue> {
    const response = await apiClient.post(
      `/repositories/${encodeURIComponent(repositoryId)}/issues/`,
      data,
    );
    return response.data;
  },

  async createPullRequest(
    repositoryId: string,
    data: { title: string; body: string; sourceBranch: string; targetBranch: string },
  ): Promise<PullRequest> {
    const response = await apiClient.post(
      `/repositories/${encodeURIComponent(repositoryId)}/pulls/`,
      data,
    );
    return response.data;
  },
};
