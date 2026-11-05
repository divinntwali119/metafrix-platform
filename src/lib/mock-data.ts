import { User, Repository, Post, Issue, PullRequest, Commit, FileTreeItem, Conversation, Message, NotificationItem, Organization, CodeDiff } from "@/types";

const memberCoverImage = "/metafrix-member-cover.svg";

export const currentUser: User = {
  id: "user-divin",
  username: "divin",
  name: "Divin Ndagano",
  email: "divin@metafrix.dev",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  coverImage: memberCoverImage,
  bio: "Lead Software Architect & Open Source enthusiast. Building resilient distributed systems and empowering African tech talents.",
  location: "Kigali, Rwanda & Goma, RDC",
  website: "https://divin.dev",
  githubUrl: "https://github.com/divin",
  twitterUrl: "https://x.com/divin_dev",
  skills: ["TypeScript", "Next.js", "Python", "Django", "PostgreSQL", "Docker", "Git"],
  technologies: ["React", "FastAPI", "Tailwind CSS", "Redis", "Kafka", "AWS"],
  followersCount: 1420,
  followingCount: 385,
  repositoriesCount: 24,
  contributionsCount: 1842,
  createdAt: "2024-01-15T10:00:00Z",
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: "user-amara",
    username: "amara",
    name: "Amara Diallo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    coverImage: memberCoverImage,
    bio: "Senior AI & NLP Engineer. Fine-tuning LLMs for African languages (Wolof, Swahili, Yoruba).",
    location: "Dakar, Sénégal",
    website: "https://amara.ai",
    githubUrl: "https://github.com/amara-diallo",
    twitterUrl: "https://x.com/amara_ai",
    skills: ["Python", "PyTorch", "HuggingFace", "LangChain", "FastAPI"],
    technologies: ["Docker", "Kubernetes", "Transformers", "CUDA"],
    followersCount: 3200,
    followingCount: 210,
    repositoriesCount: 18,
    contributionsCount: 2104,
    isFollowed: true,
    createdAt: "2023-08-10T12:00:00Z",
  },
  {
    id: "user-kwame",
    username: "kwame_dev",
    name: "Kwame Mensah",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    coverImage: memberCoverImage,
    bio: "Fintech Systems Architect. Passionate about instant cross-border settlement protocols in Africa.",
    location: "Accra, Ghana",
    website: "https://kwamemensah.io",
    githubUrl: "https://github.com/kwame-dev",
    skills: ["Go", "Rust", "PostgreSQL", "Kafka", "Distributed Systems"],
    technologies: ["gRPC", "Docker", "Terraform", "Prometheus"],
    followersCount: 2450,
    followingCount: 198,
    repositoriesCount: 15,
    contributionsCount: 1650,
    isFollowed: true,
    createdAt: "2023-11-20T08:30:00Z",
  },
  {
    id: "user-fatou",
    username: "fatou_ui",
    name: "Fatou Sow",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
    coverImage: memberCoverImage,
    bio: "Design Technologist & Frontend Lead @AfriCraft. Obsessed with micro-interactions, accessibility & shadcn/ui.",
    location: "Abidjan, Côte d'Ivoire",
    website: "https://fatou.design",
    githubUrl: "https://github.com/fatou-sow",
    twitterUrl: "https://x.com/fatou_ui",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Figma", "Design Systems"],
    technologies: ["CSS Architecture", "Framer Motion", "Storybook", "Radix UI"],
    followersCount: 4120,
    followingCount: 340,
    repositoriesCount: 22,
    contributionsCount: 2890,
    isFollowed: false,
    createdAt: "2023-05-12T14:20:00Z",
  },
  {
    id: "user-chioma",
    username: "chioma_cloud",
    name: "Chioma Eze",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    coverImage: memberCoverImage,
    bio: "DevOps & Cloud Reliability Engineer. Automating multi-region cloud infrastructures across African data centers.",
    location: "Lagos, Nigeria",
    website: "https://chioma.cloud",
    githubUrl: "https://github.com/chioma-eze",
    skills: ["Kubernetes", "AWS", "Terraform", "Go", "CI/CD", "Linux"],
    technologies: ["Helm", "ArgoCD", "Grafana", "Ansible"],
    followersCount: 1890,
    followingCount: 150,
    repositoriesCount: 11,
    contributionsCount: 1420,
    isFollowed: false,
    createdAt: "2024-02-01T09:00:00Z",
  },
];

export const mockRepositories: Repository[] = [
  {
    id: "repo-afripay",
    name: "afri-pay-gateway",
    owner: currentUser,
    description: "SDK universel et passerelle unifiée pour les paiements Mobile Money (M-Pesa, Orange Money, Wave, MTN Momo) en Afrique.",
    isPrivate: false,
    defaultBranch: "main",
    starsCount: 342,
    forksCount: 78,
    watchersCount: 24,
    issuesCount: 12,
    pullsCount: 4,
    language: "TypeScript",
    languageColor: "#3178c6",
    size: "4.8 MB",
    updatedAt: "2026-11-02T14:32:00Z",
    createdAt: "2024-03-10T11:00:00Z",
    license: "MIT",
    topics: ["fintech", "mobile-money", "payments", "africa", "typescript", "api"],
  },
  {
    id: "repo-swahili-nlp",
    name: "swahili-bert-base",
    owner: mockUsers[1],
    description: "Modèle de langage Transformers pré-entraîné sur un corpus de 15GB de textes en Swahili et langues bantu côtières.",
    isPrivate: false,
    defaultBranch: "main",
    starsCount: 512,
    forksCount: 115,
    watchersCount: 45,
    issuesCount: 8,
    pullsCount: 3,
    language: "Python",
    languageColor: "#3572A5",
    size: "820 MB",
    updatedAt: "2026-11-01T18:20:00Z",
    createdAt: "2024-01-20T09:15:00Z",
    license: "Apache-2.0",
    topics: ["nlp", "machine-learning", "swahili", "transformers", "pytorch"],
  },
  {
    id: "repo-africraft-ui",
    name: "africraft-design-system",
    owner: mockUsers[3],
    description: "Composants React modernes, accessibles et légers conçus pour les connexions bas débit et interfaces mobiles d'Afrique.",
    isPrivate: false,
    defaultBranch: "main",
    starsCount: 720,
    forksCount: 94,
    watchersCount: 52,
    issuesCount: 5,
    pullsCount: 6,
    language: "TypeScript",
    languageColor: "#3178c6",
    size: "2.1 MB",
    updatedAt: "2026-11-03T08:12:00Z",
    createdAt: "2024-04-05T16:00:00Z",
    license: "MIT",
    topics: ["design-system", "react", "tailwind", "ui", "accessibility"],
  },
  {
    id: "repo-kigali-smart-bus",
    name: "kigali-smart-transit",
    owner: currentUser,
    description: "Système télématique temps-réel de suivi de flotte et calcul de temps d'attente pour le réseau de transport urbain.",
    isPrivate: true,
    defaultBranch: "main",
    starsCount: 48,
    forksCount: 12,
    watchersCount: 7,
    issuesCount: 3,
    pullsCount: 1,
    language: "Go",
    languageColor: "#00ADD8",
    size: "6.2 MB",
    updatedAt: "2026-10-28T11:45:00Z",
    createdAt: "2024-06-12T10:00:00Z",
    license: "Proprietary",
    topics: ["iot", "transit", "golang", "websockets", "kigali"],
  },
];

export const mockFileTree: Record<string, FileTreeItem[]> = {
  "root": [
    { name: ".github", path: ".github", type: "dir", lastCommitMessage: "ci: add automated test workflow", lastCommitDate: "il y a 2 jours" },
    { name: "src", path: "src", type: "dir", lastCommitMessage: "feat: add Wave mobile money provider adapter", lastCommitDate: "il y a 3 heures" },
    { name: "tests", path: "tests", type: "dir", lastCommitMessage: "test: mock webhook callbacks", lastCommitDate: "il y a 1 jour" },
    { name: ".env.example", path: ".env.example", type: "file", size: "340 B", lastCommitMessage: "docs: update API key env names", lastCommitDate: "il y a 5 jours" },
    { name: ".gitignore", path: ".gitignore", type: "file", size: "210 B", lastCommitMessage: "chore: ignore dist and node_modules", lastCommitDate: "il y a 2 mois" },
    { name: "package.json", path: "package.json", type: "file", size: "1.4 KB", lastCommitMessage: "chore: bump dependencies to v2.4.0", lastCommitDate: "il y a 3 heures" },
    { name: "README.md", path: "README.md", type: "file", size: "4.2 KB", lastCommitMessage: "docs: add architecture diagram and quickstart", lastCommitDate: "hier" },
    { name: "tsconfig.json", path: "tsconfig.json", type: "file", size: "580 B", lastCommitMessage: "config: strict mode enabled", lastCommitDate: "il y a 1 mois" },
  ],
  "src": [
    { name: "adapters", path: "src/adapters", type: "dir", lastCommitMessage: "feat: add Wave and Orange adapters", lastCommitDate: "il y a 3 heures" },
    { name: "core", path: "src/core", type: "dir", lastCommitMessage: "refactor: idempotent transaction pipeline", lastCommitDate: "hier" },
    { name: "types", path: "src/types", type: "dir", lastCommitMessage: "types: define MomoPayload interfaces", lastCommitDate: "il y a 2 jours" },
    { name: "index.ts", path: "src/index.ts", type: "file", size: "1.2 KB", lastCommitMessage: "feat: export main AfriPay client", lastCommitDate: "il y a 3 heures" },
  ],
  "src/adapters": [
    { name: "mpesa.ts", path: "src/adapters/mpesa.ts", type: "file", size: "3.8 KB", lastCommitMessage: "fix: handle STK Push timeout properly", lastCommitDate: "il y a 2 jours" },
    { name: "orange-money.ts", path: "src/adapters/orange-money.ts", type: "file", size: "4.1 KB", lastCommitMessage: "feat: integrate Orange Money Web Pay API", lastCommitDate: "il y a 1 jour" },
    { name: "wave.ts", path: "src/adapters/wave.ts", type: "file", size: "2.9 KB", lastCommitMessage: "feat: add QR-code generation support", lastCommitDate: "il y a 3 heures" },
  ],
};

export const mockFileContents: Record<string, string> = {
  "README.md": `# AfriPay Gateway SDK

> SDK universel et passerelle unifiée pour les paiements Mobile Money (M-Pesa, Orange Money, Wave, MTN Momo) en Afrique.

[![MetafriX Build](https://img.shields.io/badge/MetafriX-CI%20Passing-6366F1)](https://metafrix.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](https://metafrix.dev/divin/afri-pay-gateway)

## Caractéristiques
- **Multi-opérateurs :** Support unifié de M-Pesa (Safaricom, Vodacom), Orange Money, MTN MoMo, Wave et Airtel Money.
- **Idempotence native :** Prévention automatique des doubles débits.
- **Webhooks vérifiés :** Signature cryptographique HMAC SHA256 pour sécuriser vos notifications.
- **Typescript Strict :** Typage complet avec Zod et autocomplétion IDE.

## Installation rapide

\`\`\`bash
npm install @metafrix/afri-pay
\`\`\`

## Exemple d'utilisation

\`\`\`typescript
import { AfriPayClient } from "@metafrix/afri-pay";

const client = new AfriPayClient({
  apiKey: process.env.AFRIPAY_API_KEY!,
  environment: "production",
});

// Déclenchement d'un paiement Mobile Money
const charge = await client.charges.create({
  amount: 5000,
  currency: "XOF",
  phoneNumber: "+221771234567",
  provider: "wave",
  reference: "CMD-2026-9921",
  metadata: { customerId: "usr_992" },
});

console.log("Paiement initié avec succès :", charge.status);
\`\`\`

## Contribution
Les contributions sont grandement appréciées ! Veuillez consulter nos [Issues ouvertes](issues) et soumettre vos [Pull Requests](pulls).
`,
  "package.json": `{
  "name": "@metafrix/afri-pay",
  "version": "2.4.0",
  "description": "Unified Mobile Money Gateway SDK for African Fintechs",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --dts",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "license": "MIT"
}`,
  "src/index.ts": `import { MpesaAdapter } from "./adapters/mpesa";
import { WaveAdapter } from "./adapters/wave";
import { OrangeMoneyAdapter } from "./adapters/orange-money";

export interface AfriPayConfig {
  apiKey: string;
  environment: "sandbox" | "production";
}

export class AfriPayClient {
  public mpesa: MpesaAdapter;
  public wave: WaveAdapter;
  public orangeMoney: OrangeMoneyAdapter;

  constructor(private config: AfriPayConfig) {
    this.mpesa = new MpesaAdapter(config);
    this.wave = new WaveAdapter(config);
    this.orangeMoney = new OrangeMoneyAdapter(config);
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // HMAC signature validation logic
    return true;
  }
}
`,
  "src/adapters/wave.ts": `import axios from "axios";

export interface WaveChargeOptions {
  amount: number;
  currency: "XOF" | "XAF";
  phoneNumber: string;
  reference: string;
}

export class WaveAdapter {
  constructor(private config: { apiKey: string; environment: string }) {}

  async createCheckoutSession(options: WaveChargeOptions) {
    const endpoint = this.config.environment === "production"
      ? "https://api.wave.com/v1/checkout/sessions"
      : "https://api.wave.sandbox.com/v1/checkout/sessions";

    const response = await axios.post(endpoint, {
      amount: options.amount,
      currency: options.currency,
      client_reference: options.reference,
    }, {
      headers: {
        Authorization: \`Bearer \${this.config.apiKey}\`,
      },
    });

    return response.data;
  }
}
`,
};

export const mockCommits: Commit[] = [
  {
    id: "c8f921a4",
    repositoryId: "repo-afripay",
    shortSha: "c8f921a",
    message: "feat: add Wave mobile money provider adapter and QR code generator",
    author: currentUser,
    date: "2026-11-03T08:30:00Z",
    stats: { additions: 142, deletions: 12, total: 154 },
  },
  {
    id: "a12d49b2",
    repositoryId: "repo-afripay",
    shortSha: "a12d49b",
    message: "refactor: idempotent transaction pipeline with Redis lock",
    author: currentUser,
    date: "2026-11-02T16:15:00Z",
    stats: { additions: 85, deletions: 42, total: 127 },
  },
  {
    id: "9f01bc77",
    repositoryId: "repo-africraft-ui",
    shortSha: "9f01bc7",
    message: "docs: add architecture diagram and quickstart in README",
    author: mockUsers[3],
    date: "2026-11-01T14:00:00Z",
    stats: { additions: 64, deletions: 8, total: 72 },
  },
  {
    id: "7e44bb10",
    repositoryId: "repo-afripay",
    shortSha: "7e44bb1",
    message: "ci: add automated test workflow and linting checks",
    author: currentUser,
    date: "2026-10-31T11:20:00Z",
    stats: { additions: 52, deletions: 0, total: 52 },
  },
];

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    repositoryId: "repo-afripay",
    number: 14,
    title: "Support des remboursements partiels pour Orange Money CI",
    body: "L'API v2 d'Orange Money permet maintenant les remboursements partiels via le paramètre \`partial_refund: true\`. Il faudrait adapter notre adapter pour le supporter sans casser la rétrocompatibilité.",
    author: mockUsers[2],
    status: "open",
    labels: [
      { name: "enhancement", color: "#6366f1" },
      { name: "orange-money", color: "#f97316" },
    ],
    assignees: [currentUser],
    commentsCount: 4,
    createdAt: "2026-11-01T10:12:00Z",
    updatedAt: "2026-11-02T15:30:00Z",
  },
  {
    id: "issue-2",
    repositoryId: "repo-afripay",
    number: 13,
    title: "Timeout intermittent sur Safaricom M-Pesa STK Push en heures de pointe",
    body: "Quand le réseau Safaricom est saturé, la requête met plus de 45 secondes à répondre. Nous devons ajouter un mécanisme de polling asynchrone plutôt qu'une attente bloquante.",
    author: mockUsers[1],
    status: "open",
    labels: [
      { name: "bug", color: "#ef4444" },
      { name: "critical", color: "#b91c1c" },
    ],
    assignees: [mockUsers[2], currentUser],
    commentsCount: 9,
    createdAt: "2026-10-29T14:40:00Z",
    updatedAt: "2026-11-02T09:10:00Z",
  },
  {
    id: "issue-3",
    repositoryId: "repo-afripay",
    number: 12,
    title: "Mise à niveau vers TypeScript 5.5 et Node 22 LTS",
    body: "Toutes les dépendances ont été testées avec succès sur Node 22. Clôturé par la PR #11.",
    author: currentUser,
    status: "closed",
    labels: [{ name: "maintenance", color: "#10b981" }],
    assignees: [currentUser],
    commentsCount: 2,
    createdAt: "2026-10-25T08:00:00Z",
    updatedAt: "2026-10-28T17:00:00Z",
  },
];

export const mockPullRequests: PullRequest[] = [
  {
    id: "pr-1",
    repositoryId: "repo-afripay",
    number: 15,
    title: "feat(wave): intégration native de l'API Wave CI et SN avec Webhooks HMAC",
    body: "Cette PR implémente le nouvel adaptateur Wave avec validation des webhooks et gestion du QR code instantané.",
    author: mockUsers[3],
    status: "open",
    sourceBranch: "feature/wave-ci-sn",
    targetBranch: "main",
    additions: 230,
    deletions: 18,
    changedFilesCount: 4,
    createdAt: "2026-11-02T20:15:00Z",
    updatedAt: "2026-11-03T07:45:00Z",
  },
  {
    id: "pr-2",
    repositoryId: "repo-afripay",
    number: 11,
    title: "chore: migration vers TypeScript 5.5 & strict null checks",
    body: "Amélioration des types du SDK et suppression de tous les casts \`any\`.",
    author: currentUser,
    status: "merged",
    sourceBranch: "chore/ts-upgrade",
    targetBranch: "main",
    additions: 120,
    deletions: 95,
    changedFilesCount: 8,
    createdAt: "2026-10-27T11:00:00Z",
    updatedAt: "2026-10-28T16:20:00Z",
  },
];

export const mockCodeDiff: CodeDiff[] = [
  {
    filename: "src/adapters/wave.ts",
    status: "modified",
    additions: 24,
    deletions: 4,
    hunks: [
      {
        oldStart: 12,
        newStart: 12,
        lines: [
          { type: "context", content: "  async createCheckoutSession(options: WaveChargeOptions) {", oldLineNumber: 12, newLineNumber: 12 },
          { type: "delete", content: "-    const endpoint = 'https://api.wave.com/v1/checkout';", oldLineNumber: 13 },
          { type: "add", content: "+    const endpoint = this.config.environment === 'production'", newLineNumber: 13 },
          { type: "add", content: "+      ? 'https://api.wave.com/v1/checkout/sessions'", newLineNumber: 14 },
          { type: "add", content: "+      : 'https://api.wave.sandbox.com/v1/checkout/sessions';", newLineNumber: 15 },
          { type: "context", content: "    const response = await axios.post(endpoint, {", oldLineNumber: 14, newLineNumber: 16 },
        ],
      },
    ],
  },
];

export const mockPosts: Post[] = [
  {
    id: "post-1",
    author: currentUser,
    content: "Ravis d'annoncer la version **v2.4.0** de notre passerelle Mobile Money `@metafrix/afri-pay` !\n\nNous venons d'intégrer le support natif de **Wave** pour le Sénégal et la Côte d'Ivoire avec validation cryptographique des webhooks en temps réel. Vous pouvez tester la démo et inspecter le code directement sur MetafriX.",
    type: "project",
    repositoryRef: {
      id: "repo-afripay",
      name: "afri-pay-gateway",
      ownerUsername: "divin",
      description: "SDK universel et passerelle unifiée pour les paiements Mobile Money (M-Pesa, Orange Money, Wave, MTN Momo) en Afrique.",
      starsCount: 342,
      language: "TypeScript",
    },
    codeSnippet: {
      language: "typescript",
      filename: "payment-demo.ts",
      code: `const charge = await afriPay.charges.create({
  amount: 25000,
  currency: "XOF",
  provider: "wave",
  phoneNumber: "+225070000000",
  reference: "METAFRIX-PRO-SUB",
});
console.log("Paiement instantané validé:", charge.status);`,
    },
    likesCount: 128,
    isLiked: false,
    commentsCount: 24,
    sharesCount: 19,
    isBookmarked: false,
    createdAt: "2026-11-03T09:15:00Z",
  },
  {
    id: "post-2",
    author: mockUsers[1],
    content: "Question d'architecture pour les devs Django & PyTorch :\n\nComment gérez-vous le serving de modèles NLP volumineux (>= 3GB) avec Django REST Framework ? Privilégiez-vous un worker Celery dédié avec Redis, ou un micro-service FastAPI/Triton séparé derrière votre reverse proxy ?",
    type: "question",
    codeSnippet: {
      language: "python",
      filename: "nlp_worker.py",
      code: `@shared_task(bind=True, max_retries=3)
def process_swahili_sentiment(self, text_input: str):
    tokens = tokenizer(text_input, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**tokens)
    return parse_sentiment_logits(outputs)`,
    },
    likesCount: 84,
    isLiked: true,
    commentsCount: 32,
    sharesCount: 11,
    isBookmarked: true,
    createdAt: "2026-11-02T18:40:00Z",
  },
  {
    id: "post-3",
    author: mockUsers[3],
    content: "Nouveau pattern d'interface pour le thème sombre de MetafriX :\n\nInspiré par Linear et GitHub, nous avons choisi une échelle de gris neutre (#09090B, #18181B, #27272A) relevée par un accent indigo vibrant (#6366F1). La lisibilité du code est optimale même en plein soleil ou en session nocturne.",
    type: "announcement",
    mediaUrls: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80",
    ],
    likesCount: 215,
    isLiked: false,
    commentsCount: 18,
    sharesCount: 42,
    isBookmarked: false,
    createdAt: "2026-11-02T11:20:00Z",
  },
  {
    id: "post-4",
    author: mockUsers[2],
    content: "Nous avons déployé un cluster Kafka sur 3 régions (Lagos, Nairobi, Johannesburg) avec une latence inter-datacenter < 45ms. Voici notre benchmark de débit en production pour 50,000 transactions/seconde.",
    type: "tutorial",
    likesCount: 165,
    isLiked: true,
    commentsCount: 14,
    sharesCount: 28,
    isBookmarked: false,
    createdAt: "2026-11-01T15:00:00Z",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    type: "direct",
    participants: [currentUser, mockUsers[1]],
    lastMessage: {
      id: "msg-10",
      conversationId: "conv-1",
      sender: mockUsers[1],
      content: "Super le nouveau commit sur AfriPay ! Tu penses qu'on peut brancher le modèle Swahili pour la détection de fraude sur les libellés de virement ?",
      type: "text",
      createdAt: "2026-11-03T09:40:00Z",
      isRead: false,
    },
    unreadCount: 1,
    updatedAt: "2026-11-03T09:40:00Z",
  },
  {
    id: "conv-2",
    type: "direct",
    participants: [currentUser, mockUsers[3]],
    lastMessage: {
      id: "msg-20",
      conversationId: "conv-2",
      sender: currentUser,
      content: "J'ai validé ta PR #15 pour Wave, le code diff est très propre !",
      type: "text",
      createdAt: "2026-11-02T21:10:00Z",
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: "2026-11-02T21:10:00Z",
  },
  {
    id: "conv-3",
    type: "group",
    name: "MetafriX Core Contributors",
    participants: [currentUser, mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
    lastMessage: {
      id: "msg-30",
      conversationId: "conv-3",
      sender: mockUsers[2],
      content: "La démo de la plateforme sera présentée au DevFest Kigali ce vendredi !",
      type: "text",
      createdAt: "2026-11-02T19:05:00Z",
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: "2026-11-02T19:05:00Z",
  },
];

export const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      sender: currentUser,
      content: "Salut Amara, comment avance le fine-tuning sur le corpus Wolof ?",
      type: "text",
      createdAt: "2026-11-03T08:15:00Z",
      isRead: true,
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      sender: mockUsers[1],
      content: "Très bien ! On a atteint 89.4% de F1-score sur la classification d'intentions. J'ai partagé les poids sur le dépôt.",
      type: "text",
      createdAt: "2026-11-03T08:22:00Z",
      isRead: true,
    },
    {
      id: "msg-10",
      conversationId: "conv-1",
      sender: mockUsers[1],
      content: "Super le nouveau commit sur AfriPay ! Tu penses qu'on peut brancher le modèle Swahili pour la détection de fraude sur les libellés de virement ?",
      type: "text",
      createdAt: "2026-11-03T09:40:00Z",
      isRead: false,
    },
  ],
  "conv-2": [
    {
      id: "msg-20",
      conversationId: "conv-2",
      sender: currentUser,
      content: "J'ai validé ta PR #15 pour Wave, le code diff est très propre !",
      type: "text",
      createdAt: "2026-11-02T21:10:00Z",
      isRead: true,
    },
  ],
  "conv-3": [
    {
      id: "msg-30",
      conversationId: "conv-3",
      sender: mockUsers[2],
      content: "La démo de la plateforme sera présentée au DevFest Kigali ce vendredi !",
      type: "text",
      createdAt: "2026-11-02T19:05:00Z",
      isRead: true,
    },
  ],
};

export const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "reaction",
    actor: mockUsers[1],
    message: "a aimé votre publication sur la sortie d'AfriPay v2.4.0",
    targetUrl: "/feed",
    isRead: false,
    createdAt: "2026-11-03T09:20:00Z",
  },
  {
    id: "notif-2",
    type: "pr_review",
    actor: mockUsers[3],
    message: "a ouvert la Pull Request #15 sur afri-pay-gateway",
    targetUrl: "/divin/afri-pay-gateway/pulls",
    isRead: false,
    createdAt: "2026-11-02T20:15:00Z",
  },
  {
    id: "notif-3",
    type: "follow",
    actor: mockUsers[4],
    message: "a commencé à vous suivre",
    targetUrl: "/developers/chioma_cloud",
    isRead: true,
    createdAt: "2026-11-02T16:10:00Z",
  },
  {
    id: "notif-4",
    type: "comment",
    actor: mockUsers[2],
    message: "a commenté votre publication : \"Bravo pour le benchmark Kafka !\"",
    targetUrl: "/feed",
    isRead: true,
    createdAt: "2026-11-02T12:00:00Z",
  },
  {
    id: "notif-5",
    type: "issue_assigned",
    actor: mockUsers[2],
    message: "vous a assigné l'Issue #14 : Remboursements partiels Orange Money",
    targetUrl: "/divin/afri-pay-gateway/issues",
    isRead: true,
    createdAt: "2026-11-01T10:12:00Z",
  },
];

export const mockOrganizations: Organization[] = [
  {
    id: "org-africraft",
    name: "AfriCraft Open Source",
    slug: "africraft",
    description: "Collectif panafricain de développeurs open source créant des briques logicielles fondamentales pour l'écosystème numérique africain.",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
    website: "https://africraft.org",
    location: "Kigali, Rwanda",
    membersCount: 48,
    repositoriesCount: 16,
    repositoryIds: ["repo-africraft-ui"],
    createdAt: "2023-01-10T10:00:00Z",
    members: [
      { user: currentUser, role: "owner" },
      { user: mockUsers[1], role: "admin" },
      { user: mockUsers[3], role: "admin" },
      { user: mockUsers[2], role: "member" },
    ],
  },
  {
    id: "org-kigali-ai",
    name: "Kigali Machine Learning Lab",
    slug: "kigali-ml",
    description: "Laboratoire de recherche appliquée en intelligence artificielle et traitement automatique des langues africaines.",
    avatar: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80",
    website: "https://kigaliml.org",
    location: "Kigali, Rwanda",
    membersCount: 26,
    repositoriesCount: 9,
    repositoryIds: ["repo-swahili-nlp"],
    createdAt: "2023-06-15T08:00:00Z",
    members: [
      { user: mockUsers[1], role: "owner" },
      { user: currentUser, role: "member" },
    ],
  },
];
