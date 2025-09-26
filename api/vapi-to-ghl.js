export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      firstName = "",
      lastName = "",
      phone = "",
      address1 = "",
      city = "",
      state = "",
      postalCode = "",
      serviceNeeded = ""
    } = req.body || {};

    // Quick validation
    if (!firstName || !serviceNeeded) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // Normalize phone (basic cleanup)
    const digits = (phone || "").replace(/\D/g, "");
    const e164 =
      digits.length === 10 ? `+1${digits}` : digits.length > 0 ? `+${digits}` : "";

    // Prepare payload for GoHighLevel
    const ghlPayload = {
      firstName,
      lastName,
      phone: e164 || undefined,
      address1: address1 || undefined,
      city: city || undefined,
      state: state || undefined,
      postalCode: postalCode || undefined,
      tags: ["From_Vapi", "AI_Receptionist"],
      customField: [
        { id: process.env.GHL_SERVICE_NEEDED_FIELD_ID, value: serviceNeeded }
      ]
    };

    // Send to GHL
    const ghlResp = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(ghlPayload)
    });

    const data = await ghlResp.json();

    if (!ghlResp.ok) {
      return res
        .status(502)
        .json({ ok: false, error: "GHL API failed", details: data });
    }

    return res.status(200).json({ ok: true, contactId: data.id || null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
