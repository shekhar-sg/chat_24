import Conversation from "@/components/Conversation";
import { use } from "react";

const ConversationPage = (props: {
  params: Promise<{
    conversationId: string;
  }>;
}) => {
  const params = use(props.params);

  return (
    <Conversation
      key={params.conversationId}
      conversationId={params.conversationId}
    />
  );
};

export default ConversationPage;
