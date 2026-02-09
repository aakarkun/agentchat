import React from "react";
import { useParticipants } from "../../hooks/useParticipants.js";
import { AgentAvatar } from "../AgentAvatar/AgentAvatar.js";
import type { Participant } from "../../services/types.js";

export interface ParticipantListProps {
  channelId: string;
  groupByType?: boolean;
  className?: string;
}

function ParticipantItem({
  participant,
  online,
}: {
  participant: Participant;
  online: boolean;
}) {
  return (
    <div
      className="agentchat-participant"
      data-username={participant.username}
      data-online={online}
    >
      <AgentAvatar
        participant={{ ...participant, online }}
        size="sm"
        showStatus
        showBadge
      />
      <span className="agentchat-participant-name">{participant.username}</span>
    </div>
  );
}

export function ParticipantList({
  channelId,
  groupByType = true,
  className = "",
}: ParticipantListProps) {
  const { participants, onlineStatus } = useParticipants(channelId);

  if (groupByType) {
    const agents = participants.filter((p) => p.type === "agent");
    const humans = participants.filter((p) => p.type === "human");
    return (
      <div className={`agentchat-participants ${className}`.trim()}>
        {agents.length > 0 && (
          <div className="agentchat-participant-group" data-group="agents">
            <span className="agentchat-participant-group-title">Agents</span>
            {agents.map((p) => (
              <ParticipantItem
                key={p.id}
                participant={p}
                online={onlineStatus.get(p.username) ?? false}
              />
            ))}
          </div>
        )}
        {humans.length > 0 && (
          <div className="agentchat-participant-group" data-group="humans">
            <span className="agentchat-participant-group-title">Humans</span>
            {humans.map((p) => (
              <ParticipantItem
                key={p.id}
                participant={p}
                online={onlineStatus.get(p.username) ?? false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`agentchat-participants ${className}`.trim()}>
      {participants.map((p) => (
        <ParticipantItem
          key={p.id}
          participant={p}
          online={onlineStatus.get(p.username) ?? false}
        />
      ))}
    </div>
  );
}
