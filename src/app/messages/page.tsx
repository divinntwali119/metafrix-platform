"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Send,
  Code2,
  Users,
  CheckCheck,
  ExternalLink,
  ChevronLeft,
  X,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { CodeSnippetViewer } from "@/components/ui/CodeSnippetViewer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

export default function MessagesPage() {
  const { hasHydrated } = useAfriHubStore();
  const {
    currentUser,
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
  } = useAfriHubStore();

  const [textInput, setTextInput] = useState("");
  const [searchConv, setSearchConv] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLang, setCodeLang] = useState("typescript");
  const [mobileView, setMobileView] = useState<"list" | "chat">(() =>
    activeConversationId ? "chat" : "list"
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const activeMessages = (activeConv ? messages[activeConv.id] : []) || [];

  const otherParticipant = activeConv?.participants.find(
    (p) => p.id !== currentUser.id
  ) || activeConv?.participants[0];

  const filteredConversations = conversations.filter((conversation) => {
    const searchText = [
      conversation.name || "",
      ...conversation.participants.map((participant) => `${participant.name} ${participant.username}`),
    ]
      .join(" ")
      .toLowerCase();
    return searchText.includes(searchConv.trim().toLowerCase());
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activeConv?.id, activeMessages.length, hasHydrated]);

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeConv || (!textInput.trim() && !codeSnippet.trim())) return;

    if (codeSnippet.trim()) {
      sendMessage(
        activeConv.id,
        textInput.trim() || "Voici un extrait de code :",
        "code",
        {
          language: codeLang,
          code: codeSnippet.trim(),
        }
      );
      setCodeSnippet("");
      setShowCodeModal(false);
    } else {
      sendMessage(activeConv.id, textInput.trim(), "text");
    }

    setTextInput("");
  };

  return (
    <div className="-mb-20 mx-auto flex h-[calc(100dvh-7rem)] min-h-0 w-full max-w-[1600px] overflow-hidden bg-(--background) md:mb-0 md:h-[calc(100dvh-6.25rem)] md:px-6 md:py-5 lg:px-8">
      {/* Conversations list */}
      <aside
        aria-label="Liste des conversations"
        className={`w-full shrink-0 flex-col bg-(--background) md:w-80 md:pr-4 lg:w-88 xl:w-96 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="space-y-4 px-4 pb-4 pt-5 sm:px-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-(--primary-text)">
                Messages
              </h1>
              <p className="mt-1 text-xs text-(--secondary-text)">
                {conversations.length} conversations
              </p>
            </div>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--secondary-text)"
              aria-hidden="true"
            />
            <label htmlFor="conversation-search" className="sr-only">
              Rechercher une conversation
            </label>
            <input
              id="conversation-search"
              type="search"
              value={searchConv}
              onChange={(event) => setSearchConv(event.target.value)}
              placeholder="Rechercher une discussion"
              className="h-10 w-full rounded-lg border-0 bg-(--muted) pl-10 pr-10 text-xs text-(--primary-text) outline-none placeholder:text-(--secondary-text) focus:ring-1 focus:ring-(--accent)"
            />
            {searchConv && (
              <button
                type="button"
                onClick={() => setSearchConv("")}
                aria-label="Effacer la recherche"
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--card) hover:text-(--primary-text)"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 sm:px-3">
          {!hasHydrated ? (
            <div role="status" aria-label="Chargement des conversations" aria-busy="true" className="space-y-2 p-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl p-2">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Chargement des conversations…</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              className="my-2 min-h-0 border-0 bg-transparent px-4 py-8"
              icon={<MessageSquare className="h-5 w-5" />}
              title={conversations.length === 0 ? "Aucune conversation" : "Aucun résultat"}
              description={
                conversations.length === 0
                  ? "Vos échanges apparaîtront ici."
                  : "Essayez un autre nom pour retrouver une discussion."
              }
            />
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConv?.id;
                const participant = conv.participants.find((person) => person.id !== currentUser.id);
                const title = conv.type === "group" ? conv.name : participant?.name;
                const lastMessage = conv.lastMessage;
                const preview = lastMessage
                  ? `${lastMessage.sender.id === currentUser.id ? "Vous : " : ""}${lastMessage.type === "code" ? "Extrait de code" : lastMessage.content}`
                  : "Nouvelle conversation";

                return (
                  <button
                    key={conv.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setMobileView("chat");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-(--muted)"
                        : "hover:bg-(--muted)/70"
                    }`}
                  >
                    {conv.type === "group" ? (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-(--muted) text-(--accent)">
                        <Users className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-(--muted)">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={participant?.avatar}
                          alt=""
                          loading="lazy"
                          className="ui-avatar h-full w-full object-cover"
                        />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-(--primary-text)">
                          {title || "Conversation"}
                        </span>
                        <span className="shrink-0 text-[10px] text-(--secondary-text)">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-(--secondary-text)">
                          {preview}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 text-[10px] font-semibold text-(--accent)" aria-label={`${conv.unreadCount} messages non lus`}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

        {/* Active conversation */}
        <div
          className={`flex-1 flex flex-col bg-[#111113] min-w-0 ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {!hasHydrated ? (
            <div role="status" aria-label="Chargement de la discussion" aria-busy="true" className="flex flex-1 flex-col justify-end gap-5 p-5">
              <Skeleton className="h-16 w-3/4 max-w-md rounded-xl" />
              <Skeleton className="ml-auto h-16 w-2/3 max-w-md rounded-xl" />
              <Skeleton className="h-20 w-4/5 max-w-lg rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <span className="sr-only">Chargement des messages…</span>
            </div>
          ) : activeConv ? (
            <>
              <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    aria-label="Retour aux conversations"
                    className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text) md:hidden"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {activeConv.type === "group" ? (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-(--muted) text-(--accent)">
                      <Users className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-(--muted)">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={otherParticipant?.avatar}
                        alt=""
                        className="ui-avatar h-full w-full object-cover"
                      />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-(--primary-text)">
                      {activeConv.type === "group" ? activeConv.name : otherParticipant?.name}
                    </h2>
                    <p className="truncate text-[11px] text-(--secondary-text)">
                      {activeConv.type === "group"
                        ? `${activeConv.participants.length} membres`
                        : `@${otherParticipant?.username}`}
                    </p>
                  </div>
                </div>

                {activeConv.type === "direct" && otherParticipant && (
                  <Link
                    href={`/developers/${otherParticipant.username}`}
                    aria-label={`Voir le profil de ${otherParticipant.name}`}
                    title="Voir le profil"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text)"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>

              <div
                ref={messagesContainerRef}
                aria-label="Messages de la conversation"
                role="log"
                aria-live="polite"
                className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7"
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                  {activeMessages.length === 0 ? (
                    <p className="my-auto py-10 text-center text-sm text-(--secondary-text)">
                      Aucun message pour le moment. Envoyez le premier message.
                    </p>
                  ) : activeMessages.map((msg) => {
                    const isMe = msg.sender.id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {activeConv.type === "group" && !isMe && (
                          <span className="mb-1.5 pl-1 text-[10px] font-medium text-(--secondary-text)">
                            {msg.sender.name}
                          </span>
                        )}
                        <div
                          className={`max-w-[88%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                            isMe
                              ? "rounded-br-md bg-(--action) text-white"
                              : "rounded-bl-md bg-(--muted) text-(--primary-text)"
                          }`}
                        >
                          <p className="wrap-break-word">{msg.content}</p>

                          {msg.codeSnippet && (
                            <div className="overflow-hidden rounded-lg text-left">
                              <CodeSnippetViewer
                                code={msg.codeSnippet.code}
                                language={msg.codeSnippet.language}
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center gap-1 px-1 text-[10px] text-(--secondary-text)">
                          <span>{formatDate(msg.createdAt)}</span>
                          {isMe && <CheckCheck className="h-3 w-3 text-(--accent)" aria-label="Envoyé" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {showCodeModal && (
                <div className="mx-auto w-full max-w-3xl space-y-3 px-4 pb-2 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-(--primary-text)">
                      Partager un extrait de code
                    </span>
                    <div className="flex items-center gap-2">
                      <label htmlFor="message-code-language" className="sr-only">
                        Langage du code
                      </label>
                      <select
                        id="message-code-language"
                        value={codeLang}
                        onChange={(event) => setCodeLang(event.target.value)}
                        className="rounded-md bg-(--muted) px-2 py-1.5 text-[11px] text-(--primary-text) outline-none focus:ring-1 focus:ring-(--accent)"
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="bash">Bash</option>
                        <option value="json">JSON</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCodeModal(false)}
                        aria-label="Fermer le partage de code"
                        className="grid h-8 w-8 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text)"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="Collez votre code ici…"
                    className="w-full resize-y rounded-xl bg-(--muted) p-3 text-xs font-mono text-(--primary-text) outline-none placeholder:text-(--secondary-text) focus:ring-1 focus:ring-(--accent)"
                  />
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-3xl shrink-0 items-center gap-2 px-4 pb-4 pt-2 sm:px-6 sm:pb-5"
              >
                <button
                  type="button"
                  onClick={() => setShowCodeModal(!showCodeModal)}
                  aria-label={showCodeModal ? "Fermer le partage de code" : "Ajouter un extrait de code"}
                  aria-pressed={showCodeModal}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                    showCodeModal
                      ? "bg-(--muted) text-(--accent)"
                      : "text-(--secondary-text) hover:bg-(--muted) hover:text-(--primary-text)"
                  }`}
                >
                  <Code2 className="h-4 w-4" aria-hidden="true" />
                </button>

                <input
                  aria-label="Écrire un message"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="h-11 min-w-0 flex-1 rounded-full border-0 bg-(--muted) px-4 text-sm text-(--primary-text) outline-none placeholder:text-(--secondary-text) focus:ring-1 focus:ring-(--accent)"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() && !codeSnippet.trim()}
                  aria-label="Envoyer le message"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-(--action) text-white transition-colors hover:bg-(--action-hover) disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <EmptyState
                className="m-5 min-h-0 flex-1 border-0 bg-transparent"
              icon={<MessageSquare className="h-5 w-5" />}
              title="Aucune discussion sélectionnée"
              description="Choisissez une conversation dans la liste de gauche."
            />
          )}
        </div>
    </div>
  );
}
