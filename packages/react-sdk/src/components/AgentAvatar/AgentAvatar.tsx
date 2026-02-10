import React from "react";
import type { Participant } from "../../core/index.js";

export interface AgentAvatarProps {
  participant: Participant;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showBadge?: boolean;
}

function getDefaultAvatar(participant: Participant): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.username)}&background=random`;
}

export function AgentAvatar({
  participant,
  size = "md",
  showStatus = false,
  showBadge = false,
}: AgentAvatarProps) {
  const isAgent = participant.type === "agent";
  const src = participant.avatar ?? getDefaultAvatar(participant);

  return (
    <div
      className={`agentchat-avatar agentchat-avatar--${size}`}
      data-participant-id={participant.id}
    >
      <img src={src} alt={participant.username} />
      {showStatus && (
        <span
          className="agentchat-avatar-status"
          data-online={participant.online ?? false}
        />
      )}
      {showBadge && isAgent && (
        <span className="agentchat-avatar-badge">Agent</span>
      )}
    </div>
  );
}
