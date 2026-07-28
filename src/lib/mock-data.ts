import { EmailThread } from "@/types/email";
import { AISummary, AIDraftResponse, ExecutiveBriefing } from "@/types/ai";

export const MOCK_EXECUTIVE_USER = {
  id: "usr_exec_001",
  name: "Alex Mercer",
  email: "alex.mercer@priora.ai",
  title: "Chief Executive Officer",
  company: "Priora Technologies",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
};

export const MOCK_THREADS: EmailThread[] = [
  {
    id: "thread_01",
    subject: "URGENT: Final Sign-off on Series B Term Sheet & Board Deck",
    participants: [
      { name: "Sarah Lin", email: "sarah.lin@sequoiacap.com", isVIP: true },
      { name: "Alex Mercer", email: "alex.mercer@priora.ai" },
    ],
    lastMessageTimestamp: "10 minutes ago",
    snippet: "Alex, we need your signature on the updated term sheet clause 4.2 before 3:00 PM EST to finalize the allocation...",
    isUnread: true,
    isArchived: false,
    isSnoozed: false,
    priority: "urgent",
    category: "deadline_today",
    unreadCount: 1,
    messages: [
      {
        id: "msg_01_1",
        threadId: "thread_01",
        sender: { name: "Sarah Lin", email: "sarah.lin@sequoiacap.com", isVIP: true },
        recipients: [{ name: "Alex Mercer", email: "alex.mercer@priora.ai" }],
        subject: "URGENT: Final Sign-off on Series B Term Sheet & Board Deck",
        bodySnippet: "Alex, we need your signature on the updated term sheet clause 4.2 before 3:00 PM EST...",
        bodyText: `Hi Alex,

I hope you're having a productive morning.

Legal finished reviewing the updated Series B Term Sheet. Clause 4.2 regarding option pool dilution has been adjusted per our conversation yesterday. 

We require your formal signature before 3:00 PM EST today to include this in the final board deck package going to partners tonight.

Please confirm if the attached revised clause works or if you'd like a quick 5-minute sync with our counsel.

Best,
Sarah Lin
Partner, Sequoia Capital`,
        timestamp: "Today at 9:45 AM",
        isUnread: true,
      },
    ],
  },
  {
    id: "thread_02",
    subject: "Action Required: AWS Enterprise Discount Agreement Renewal",
    participants: [
      { name: "Marcus Vance", email: "mvance@amazon.com", isVIP: false },
      { name: "Alex Mercer", email: "alex.mercer@priora.ai" },
    ],
    lastMessageTimestamp: "1 hour ago",
    snippet: "Our EDP renewal proposal expires at midnight. We've locked in the requested 18% commit discount...",
    isUnread: true,
    isArchived: false,
    isSnoozed: false,
    priority: "high",
    category: "action_required",
    unreadCount: 1,
    messages: [
      {
        id: "msg_02_1",
        threadId: "thread_02",
        sender: { name: "Marcus Vance", email: "mvance@amazon.com" },
        recipients: [{ name: "Alex Mercer", email: "alex.mercer@priora.ai" }],
        subject: "Action Required: AWS Enterprise Discount Agreement Renewal",
        bodySnippet: "Our EDP renewal proposal expires at midnight...",
        bodyText: `Alex,

Quick reminder that our 2-year AWS Enterprise Discount Program (EDP) proposal expires tonight at midnight. 

We managed to secure approval for the 18% baseline discount with your $400k annual commit threshold. If you approve via reply, I will release the formal DocuSign link immediately.

Let me know if you approve proceeding on these terms.

Best regards,
Marcus Vance
Account Executive, AWS`,
        timestamp: "Today at 8:30 AM",
        isUnread: true,
      },
    ],
  },
  {
    id: "thread_03",
    subject: "VP of Product Offer Letter - Candidate Counter-Proposal",
    participants: [
      { name: "David Chen", email: "d.chen@priora.ai", isVIP: true },
      { name: "Alex Mercer", email: "alex.mercer@priora.ai" },
    ],
    lastMessageTimestamp: "3 hours ago",
    snippet: "Elena accepted our base compensation offer but requested an extra 0.25% equity grant vesting over 4 years...",
    isUnread: false,
    isArchived: false,
    isSnoozed: false,
    priority: "high",
    category: "vip",
    unreadCount: 0,
    messages: [
      {
        id: "msg_03_1",
        threadId: "thread_03",
        sender: { name: "David Chen", email: "d.chen@priora.ai", isVIP: true },
        recipients: [{ name: "Alex Mercer", email: "alex.mercer@priora.ai" }],
        subject: "VP of Product Offer Letter - Candidate Counter-Proposal",
        bodySnippet: "Elena accepted our base compensation offer but requested an extra 0.25% equity grant...",
        bodyText: `Alex,

Good news: Elena is thrilled about the VP of Product role!

Her only counter-request is an additional 0.25% equity allocation (taking total grant from 1.25% to 1.50%) with a standard 1-year cliff and 4-year vesting. 

The recruiting committee recommends approving this to close her before she considers competing offers. Do I have your green light to issue the final agreement?

Thanks,
David Chen
Head of People`,
        timestamp: "Today at 6:45 AM",
        isUnread: false,
      },
    ],
  },
  {
    id: "thread_04",
    subject: "Weekly All-Hands Deck & Engineering Updates",
    participants: [
      { name: "Elena Rostova", email: "elena@priora.ai" },
    ],
    lastMessageTimestamp: "Yesterday",
    snippet: "Here is the slide deck for Thursday's company update. All quarterly OKR numbers have been populated...",
    isUnread: false,
    isArchived: false,
    isSnoozed: false,
    priority: "normal",
    category: "fyi",
    unreadCount: 0,
    messages: [
      {
        id: "msg_04_1",
        threadId: "thread_04",
        sender: { name: "Elena Rostova", email: "elena@priora.ai" },
        recipients: [{ name: "Alex Mercer", email: "alex.mercer@priora.ai" }],
        subject: "Weekly All-Hands Deck & Engineering Updates",
        bodySnippet: "Here is the slide deck for Thursday's company update...",
        bodyText: `Hi Team,

Attached is the finalized draft deck for this Thursday's All-Hands. 

Engineering progress is on track for the v1.2 release. No action required from you unless you wish to add executive closing remarks on slide 14.

Best,
Elena`,
        timestamp: "Yesterday at 4:15 PM",
        isUnread: false,
      },
    ],
  },
];

export const MOCK_AI_SUMMARIES: Record<string, AISummary> = {
  thread_01: {
    threadId: "thread_01",
    executiveBrief: "Sarah Lin (Sequoia Capital) requires your signature on clause 4.2 of the Series B term sheet before 3:00 PM EST today for the board deck.",
    bulletPoints: [
      "Clause 4.2 regarding option pool dilution has been revised per yesterday's discussion.",
      "Hard deadline: 3:00 PM EST today to meet board deck distribution schedule.",
      "Decision required: Approve revised clause or request 5-minute legal sync.",
    ],
    keyDecisionRequired: "Approve Series B Clause 4.2 or request legal sync before 3:00 PM EST.",
    urgencyScore: 95,
  },
  thread_02: {
    threadId: "thread_02",
    executiveBrief: "AWS secured your requested 18% EDP discount with a $400k annual commit. Agreement expires at midnight tonight.",
    bulletPoints: [
      "Secured 18% baseline discount for 2-year commit.",
      "Expires tonight at midnight.",
      "Action required: Confirm approval to trigger DocuSign issuance.",
    ],
    keyDecisionRequired: "Confirm approval to lock in 18% AWS EDP discount.",
    urgencyScore: 82,
  },
  thread_03: {
    threadId: "thread_03",
    executiveBrief: "VP Candidate Elena counter-offered for +0.25% equity (total 1.50%). HR recommends approval to close candidate today.",
    bulletPoints: [
      "Candidate accepted base compensation salary.",
      "Requested 0.25% additional equity with standard 4-year vesting.",
      "Head of People recommends immediate green light.",
    ],
    keyDecisionRequired: "Approve 0.25% equity increase for VP candidate.",
    urgencyScore: 75,
  },
  thread_04: {
    threadId: "thread_04",
    executiveBrief: "Thursday All-Hands slide deck is ready with updated OKR metrics. No immediate action required.",
    bulletPoints: [
      "Engineering v1.2 release on track.",
      "Slide deck finalized.",
      "Optional: Add closing remarks on slide 14.",
    ],
    urgencyScore: 20,
  },
};

export const MOCK_AI_DRAFTS: Record<string, AIDraftResponse> = {
  thread_01: {
    threadId: "thread_01",
    intentStrategy: "Strategy: Confirming approval of revised Clause 4.2 and requesting final DocuSign link immediately.",
    draftText: `Hi Sarah,

Thanks for following up. The revised Clause 4.2 looks good and accurately reflects our discussion from yesterday. 

Please send over the DocuSign link right away and I will sign it before 3:00 PM EST today.

Best,
Alex Mercer`,
    suggestedTone: "concise",
    lastUpdated: "Just now",
  },
  thread_02: {
    threadId: "thread_02",
    intentStrategy: "Strategy: Approving 18% EDP discount terms and requesting DocuSign link.",
    draftText: `Hi Marcus,

Appreciate you securing the 18% discount threshold. The terms look great—please send the DocuSign link to my email and I'll review and execute it today.

Best,
Alex Mercer`,
    suggestedTone: "concise",
    lastUpdated: "5 mins ago",
  },
  thread_03: {
    threadId: "thread_03",
    intentStrategy: "Strategy: Giving green light for 1.50% total equity counter-proposal.",
    draftText: `Hi David,

Great work bringing Elena along. I give the green light for the additional 0.25% equity grant to close her. Please issue the revised offer letter right away.

Best,
Alex`,
    suggestedTone: "direct_refusal",
    lastUpdated: "10 mins ago",
  },
};

export const MOCK_EXECUTIVE_BRIEFING: ExecutiveBriefing = {
  date: "Tuesday, July 28, 2026",
  digestSummary: "You have 2 high-urgency decisions pending today: Series B term sheet sign-off (due 3 PM) and AWS EDP renewal (expires midnight).",
  urgentItemCount: 2,
  waitingOnCount: 1,
  topActionItems: [
    {
      id: "task_01",
      threadId: "thread_01",
      title: "Sign Series B Term Sheet (Clause 4.2)",
      deadline: "Today by 3:00 PM EST",
      isCompleted: false,
      priority: "high",
      assigneeName: "Sarah Lin (Sequoia)",
    },
    {
      id: "task_02",
      threadId: "thread_02",
      title: "Approve AWS EDP 18% Discount Agreement",
      deadline: "Today by Midnight",
      isCompleted: false,
      priority: "high",
      assigneeName: "Marcus Vance (AWS)",
    },
    {
      id: "task_03",
      threadId: "thread_03",
      title: "Greenlight VP of Product Equity Counter (+0.25%)",
      deadline: "End of Day",
      isCompleted: false,
      priority: "medium",
      assigneeName: "David Chen (HR)",
    },
  ],
};
