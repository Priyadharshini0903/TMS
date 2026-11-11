
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2";
import { getSession, getGatePool } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let gatePool;
  let logId: number | undefined;

  try {
    // 1. Get logged-in plant session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 401 }
      );
    }

    // 2. Read and validate form data
    const body = await request.json();

    const shipmentType = String(body.shipmentType ?? "").trim().toUpperCase();
    const truckNo = String(body.truckNo ?? "").trim().toUpperCase();
    const tagNo = String(body.tagNo ?? "").trim();

    if (!["OUTBOUND", "INBOUND"].includes(shipmentType)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid shipment type" },
        { status: 400 }
      );
    }

    if (!truckNo || !tagNo) {
      return NextResponse.json(
        { success: false, message: "Truck No and Tag No are required" },
        { status: 400 }
      );
    }

    // 3. Prepare external API payload
    const payload = {
      plant: session.plantId,
      plantID: session.plantCode,
      tagID: tagNo,
      TruckNo: truckNo,
      shipmentType,
      identifier: "Truck Register",
    };

    const payloadString = JSON.stringify(payload);

    // 4. Read API configuration
    const apiBaseUrl = process.env.TMS_API_URL?.trim();
    const apiKey = process.env.TMS_API_KEY;

    if (!apiBaseUrl || !apiKey) {
      throw new Error("TMS API configuration is missing");
    }

    const apiUrl = `${apiBaseUrl.replace(/\/+$/, "")}/Truck_Registration`;

    // 5. Insert request into plant-specific gaterflogs
    gatePool = await getGatePool(session);

    const [insertResult] = await gatePool.execute<ResultSetHeader>(
      `INSERT INTO gaterflogs
       (PAYLOAD, PLANTCODE, PLANTID, SERVICE_IDENTIFIER)
       VALUES (?, ?, ?, ?)`,
      [
        payloadString,
        session.plantCode,
        session.plantId,
        "Truck Register",
      ]
    );

    logId = insertResult.insertId;

    // 6. Call external TMS API
    let apiResponse: Response;

    try {
      apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          APIKey: apiKey,
        },
        body: payloadString,
        signal: AbortSignal.timeout(100000),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "TMS API request failed";

      await gatePool.execute(
        `UPDATE gaterflogs
         SET RESPONSE = ?, RESLOGTIME = NOW()
         WHERE RECORD_ID = ?`,
        [JSON.stringify({ error: errorMessage }), logId]
      );

      throw new Error(errorMessage);
    }

    // 7. Read external API response
    const responseText = await apiResponse.text();

    let parsedResponse: any;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { rawResponse: responseText };
    }

    // PHP API response uses the "d" property
    const resultData = parsedResponse?.d ?? parsedResponse;

    const apiStatus = resultData?.status ?? null;
    const apiMessage =
      resultData?.message ??
      (apiResponse.ok ? "TMS API response received" : "TMS API request failed");

    // 8. Update response in gaterflogs
    await gatePool.execute(
      `UPDATE gaterflogs
       SET RESPONSE = ?, RESLOGTIME = NOW()
       WHERE RECORD_ID = ?`,
      [responseText, logId]
    );

    // 9. Return result to frontend
    return NextResponse.json({
      success: apiResponse.ok,
      httpStatus: apiResponse.status,
      apiStatus,
      message: String(apiMessage),
      data: resultData?.Data ?? null,
    });
  } catch (error) {
    console.error("Truck Registration API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Truck registration failed",
      },
      { status: 500 }
    );
  }
}
