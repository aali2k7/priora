import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AutomationService } from "@/lib/automation-service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isFrozen = AutomationService.isKillSwitchActive(session.user.id);
    return NextResponse.json({ success: true, isKillSwitchActive: isFrozen });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { freeze } = body;

    AutomationService.setEmergencyKillSwitch(session.user.id, Boolean(freeze));

    return NextResponse.json({
      success: true,
      isKillSwitchActive: Boolean(freeze),
      message: freeze
        ? "Emergency Kill Switch activated: all automated replies frozen immediately."
        : "Emergency Kill Switch deactivated: automation resumed.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/automation/kill-switch] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
