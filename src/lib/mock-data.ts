import { EmailThread } from "@/types/email";
import { AISummary, AIDraftResponse, ExecutiveBriefing } from "@/types/ai";

export const MOCK_EXECUTIVE_USER = {
  id: "usr_exec_001",
  name: "Dr. Aris Thorne",
  email: "program.director@university.edu.in",
  title: "Program Director & Executive Dean",
  company: "School of Computer Science & Engineering",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
};

export const MOCK_THREADS: EmailThread[] = [
  {
    id: "thread_outing_01",
    subject: "Request for Emergency Outing Approval – Family Medical Emergency",
    participants: [
      { name: "Md Aali Rahman", email: "aali.rahman@university.edu.in", isVIP: true },
      { name: "Dr. Aris Thorne", email: "program.director@university.edu.in" },
    ],
    lastMessageTimestamp: "5 minutes ago",
    snippet: "Respected Director, I request emergency outing approval from 29 July to 31 July 2026 due to my mother's sudden hospitalization in Ranchi...",
    isUnread: true,
    isArchived: false,
    isSnoozed: false,
    priority: "urgent",
    category: "deadline_today",
    unreadCount: 1,
    messages: [
      {
        id: "msg_outing_1",
        threadId: "thread_outing_01",
        sender: {
          name: "Md Aali Rahman",
          email: "aali.rahman@university.edu.in",
          isVIP: true,
          avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
        },
        recipients: [{ name: "Dr. Aris Thorne", email: "program.director@university.edu.in" }],
        ccRecipients: [
          { name: "Father Rahman", email: "father.rahman@gmail.com" },
          { name: "Mother Rahman", email: "mother.rahman@gmail.com" },
        ],
        subject: "Request for Emergency Outing Approval – Family Medical Emergency",
        bodySnippet: "Respected Director, I request emergency outing approval from 29 July to 31 July 2026...",
        bodyText: `Respected Program Director,

I am writing to formally request emergency outing approval due to an unforeseen family medical emergency. 

My mother, who resides in Ranchi, suffered a sudden cardiac episode earlier this morning and has been admitted to Apollo Hospital, Ranchi for urgent medical attention and observation. As my father is currently working abroad in Dubai, UAE, I am the primary family member available locally to travel to Ranchi to assist with her medical admission, consent procedures, and care.

I request approval to leave campus starting from Wednesday, 29 July 2026 at 08:00 AM and return on Friday, 31 July 2026 by 08:00 PM. 

I have CC'd both my parents on this email for your verification and record. Attached with this email is the official medical prescription and hospital admission notice issued by Apollo Hospital, Ranchi.

I assure you that I will catch up on all missed lectures and complete lab submissions immediately upon my return. I kindly request you to grant me permission and issue the necessary clearance for Campus Security and The Gateway.

Thanking you.

Yours sincerely,
Md Aali Rahman
Student ID: 25WU0102156
Course: B.Tech CSE (AI & ML) - Semester 5
Hostel: Block B, Room 402`,
        timestamp: "Today at 10:15 AM",
        isUnread: true,
        attachments: [
          {
            name: "Medical_Prescription_Ranchi_Hospital.pdf",
            size: "1.2 MB",
            type: "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "thread_01",
    subject: "URGENT: Final Sign-off on Series B Term Sheet & Board Deck",
    participants: [
      { name: "Sarah Lin", email: "sarah.lin@sequoiacap.com", isVIP: true },
      { name: "Dr. Aris Thorne", email: "program.director@university.edu.in" },
    ],
    lastMessageTimestamp: "25 minutes ago",
    snippet: "Aris, we need your signature on the updated term sheet clause 4.2 before 3:00 PM EST to finalize the allocation...",
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
        recipients: [{ name: "Dr. Aris Thorne", email: "program.director@university.edu.in" }],
        subject: "URGENT: Final Sign-off on Series B Term Sheet & Board Deck",
        bodySnippet: "Aris, we need your signature on the updated term sheet clause 4.2 before 3:00 PM EST...",
        bodyText: `Hi Aris,

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
      { name: "Dr. Aris Thorne", email: "program.director@university.edu.in" },
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
        recipients: [{ name: "Dr. Aris Thorne", email: "program.director@university.edu.in" }],
        subject: "Action Required: AWS Enterprise Discount Agreement Renewal",
        bodySnippet: "Our EDP renewal proposal expires at midnight...",
        bodyText: `Dr. Thorne,

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
      { name: "Dr. Aris Thorne", email: "program.director@university.edu.in" },
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
        recipients: [{ name: "Dr. Aris Thorne", email: "program.director@university.edu.in" }],
        subject: "VP of Product Offer Letter - Candidate Counter-Proposal",
        bodySnippet: "Elena accepted our base compensation offer but requested an extra 0.25% equity grant...",
        bodyText: `Dr. Thorne,

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
        recipients: [{ name: "Dr. Aris Thorne", email: "program.director@university.edu.in" }],
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
  thread_outing_01: {
    threadId: "thread_outing_01",
    executiveBrief: "Student Md Aali Rahman (25WU0102156, B.Tech CSE AI & ML) requests emergency outing (29 Jul – 31 Jul 2026) for his mother's urgent cardiac hospitalization in Ranchi.",
    readingTimeSaved: "Original email read time: 45s • AI synthesis: 8s",
    bulletPoints: [
      "Student's mother admitted to Apollo Hospital Ranchi for urgent cardiac care.",
      "Father currently stationed in Dubai; student is primary local caregiver.",
      "Outing requested: 29 July 2026 (08:00 AM) to 31 July 2026 (08:00 PM).",
      "Parents verified on CC; hospital prescription attached (PDF 1.2 MB).",
    ],
    keyDecisionRequired: "Approve 3-day emergency outing permit for Md Aali Rahman.",
    urgencyScore: 98,
    keyInformation: {
      studentName: "Md Aali Rahman",
      studentId: "25WU0102156",
      program: "B.Tech CSE (AI & ML)",
      reason: "Mother's Medical Emergency (Apollo Hospital, Ranchi)",
      requestedDates: "29 Jul 2026 – 31 Jul 2026",
      parentsCCd: "Verified (Father & Mother on CC)",
      attachments: ["Medical_Prescription_Ranchi_Hospital.pdf (1.2 MB)"],
      urgency: "Critical (Decision Needed Today)",
      approvalNeeded: "Program Director Approval",
      confidenceScore: 98,
    },
    aiInsights: [
      "✓ Both parents verified via CC (father.rahman@gmail.com, mother.rahman@gmail.com).",
      "✓ Clear travel dates detected (29 Jul 2026 – 31 Jul 2026).",
      "✓ Medical emergency identified with official hospital prescription PDF attachment.",
      "✓ No conflicting academic mid-term exams or lab evaluations found.",
      "✓ High confidence automated extraction (98%).",
    ],
    recommendedAction: {
      actionTitle: "Approve Emergency Outing",
      confidenceScore: 95,
      reasoning: "Medical emergency verified. Parents included in CC. Requested 3-day duration is reasonable.",
    },
  },
  thread_01: {
    threadId: "thread_01",
    executiveBrief: "Sarah Lin (Sequoia Capital) requires your signature on clause 4.2 of the Series B term sheet before 3:00 PM EST today for the board deck.",
    readingTimeSaved: "Original email read time: 35s • AI synthesis: 6s",
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
    readingTimeSaved: "Original email read time: 30s • AI synthesis: 5s",
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
    readingTimeSaved: "Original email read time: 40s • AI synthesis: 7s",
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
    readingTimeSaved: "Original email read time: 25s • AI synthesis: 4s",
    bulletPoints: [
      "Engineering v1.2 release on track.",
      "Slide deck finalized.",
      "Optional: Add closing remarks on slide 14.",
    ],
    urgencyScore: 20,
  },
};

export const MOCK_AI_DRAFTS: Record<string, AIDraftResponse> = {
  thread_outing_01: {
    threadId: "thread_outing_01",
    intentStrategy: "Strategy: Approving 3-day emergency outing (29-31 Jul), instructing student to present clearance at The Gateway & Security, and wishing mother a swift recovery.",
    draftText: `Dear Md Aali Rahman,

Your request for emergency outing approval for the period of 29 July 2026 to 31 July 2026 is APPROVED.

Please ensure you coordinate immediately with The Gateway office and present your student ID (25WU0102156) to Campus Security upon departure.

We extend our sincere thoughts to your family and wish your mother a speedy and complete recovery. Please keep your academic mentor informed if you require any extension.

Warm regards,
Dr. Aris Thorne
Program Director, Department of Computer Science & Engineering`,
    suggestedTone: "formal",
    lastUpdated: "Just now",
  },
  thread_01: {
    threadId: "thread_01",
    intentStrategy: "Strategy: Confirming approval of revised Clause 4.2 and requesting final DocuSign link immediately.",
    draftText: `Hi Sarah,

Thanks for following up. The revised Clause 4.2 looks good and accurately reflects our discussion from yesterday. 

Please send over the DocuSign link right away and I will sign it before 3:00 PM EST today.

Best,
Aris Thorne`,
    suggestedTone: "concise",
    lastUpdated: "Just now",
  },
  thread_02: {
    threadId: "thread_02",
    intentStrategy: "Strategy: Approving 18% EDP discount terms and requesting DocuSign link.",
    draftText: `Hi Marcus,

Appreciate you securing the 18% discount threshold. The terms look great—please send the DocuSign link to my email and I'll review and execute it today.

Best,
Aris Thorne`,
    suggestedTone: "concise",
    lastUpdated: "5 mins ago",
  },
  thread_03: {
    threadId: "thread_03",
    intentStrategy: "Strategy: Giving green light for 1.50% total equity counter-proposal.",
    draftText: `Hi David,

Great work bringing Elena along. I give the green light for the additional 0.25% equity grant to close her. Please issue the revised offer letter right away.

Best,
Aris`,
    suggestedTone: "direct_refusal",
    lastUpdated: "10 mins ago",
  },
};

export const MOCK_EXECUTIVE_BRIEFING: ExecutiveBriefing = {
  date: "Wednesday, July 29, 2026",
  digestSummary: "You have 1 critical emergency outing request (Md Aali Rahman - Mother Hospitalization) and 2 high-urgency corporate approvals pending today.",
  urgentItemCount: 3,
  waitingOnCount: 1,
  topActionItems: [
    {
      id: "task_outing_01",
      threadId: "thread_outing_01",
      title: "🚨 Emergency Outing Approval (Md Aali Rahman - 25WU0102156)",
      deadline: "Needs Decision Today",
      isCompleted: false,
      priority: "high",
      assigneeName: "Md Aali Rahman (B.Tech CSE)",
    },
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
  ],
};
