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

    const rules = await AutomationService.getRules(session.user.id);
    return NextResponse.json({ success: true, data: rules });
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
    const { name, description, conditions, actions, priorityOrder, isActive } = body;

    if (!name || !conditions || !actions) {
      return NextResponse.json(
        { error: "Missing required fields: name, conditions, actions" },
        { status: 400 }
      );
    }

    const rule = await AutomationService.createRule(session.user.id, {
      name,
      description,
      conditions,
      actions,
      priorityOrder: priorityOrder ? Number(priorityOrder) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/automation/rules] Error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
