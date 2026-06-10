export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;

    const results = await Promise.allSettled([
        sendToGHL(payload),
        sendToOntraport(payload),
    ]);

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`[KBL] ${i === 0 ? 'GHL' : 'Ontraport'} failed:`, r.reason);
        }
    });

    return res.status(200).json({ success: true });
}

async function sendToGHL(payload) {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, val]) => {
        params.append(key, Array.isArray(val) ? val.join(', ') : (val ?? ''));
    });

    const res = await fetch(process.env.GHL_WEBHOOK_URL, {
        method: 'POST',
        body: params,
    });

    if (!res.ok) throw new Error(`GHL responded ${res.status}`);
}

async function sendToOntraport(payload) {
    const headers = {
        'Content-Type': 'application/json',
        'Api-Appid':    process.env.ONTRAPORT_APP_ID,
        'Api-Key':      process.env.ONTRAPORT_API_KEY,
    };

    // Step 1 — create/update contact
    const contactBody = {
        firstname:  payload.firstName,
        lastname:   payload.lastName,
        email:      payload.email,
        sms_number: payload.mobile,
        company:    payload.company,
        title:      payload.role,
        city:       payload.city,
        f3667:      payload.heard_about,
        f3668:      payload.date_attending,
        f3669:      payload.bringingGuest,
        f3670:      payload.guest1Name,
        f3671:      payload.guest1Email,
        f3673:      payload.guest2Name,
        f3672:      payload.guest2Email,
    };

    const createRes = await fetch('https://api.ontraport.com/1/Contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify(contactBody),
    });

    if (!createRes.ok) throw new Error(`Ontraport create responded ${createRes.status}`);

    const createData = await createRes.json();
    const contactId = createData?.data?.id;
    console.log('[KBL] Ontraport contact created, ID:', contactId);
    console.log('[KBL] Ontraport response:', JSON.stringify(createData));

    // Step 2 — get or create kbl-rsvp tag, then apply it
    if (contactId) {
        await new Promise(r => setTimeout(r, 500));
        try {
            // Search specifically for kbl-rsvp
            const searchRes = await fetch(
                `https://api.ontraport.com/1/Tags?search=kbl-rsvp&searchNotes=false`,
                { headers }
            );
            const searchData = await searchRes.json();
            let tagId = searchData?.data?.find(t => t.tag_name === 'kbl-rsvp')?.tag_id;
            console.log('[KBL] Found tag ID:', tagId);

            // Create tag if it doesn't exist
            if (!tagId) {
                const createTagRes = await fetch('https://api.ontraport.com/1/Tags', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ tag_name: 'kbl-rsvp' }),
                });
                const createTagData = await createTagRes.json();
                tagId = createTagData?.data?.tag_id;
                console.log('[KBL] Created tag ID:', tagId);
            }

            // Apply tag to contact
            if (tagId) {
                const tagRes = await fetch('https://api.ontraport.com/1/Contacts/tag', {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ ids: String(contactId), add_list: String(tagId) }),
                });
                const tagData = await tagRes.json();
                console.log('[KBL] Tag applied:', JSON.stringify(tagData));
            }
        } catch (tagErr) {
            console.error('[KBL] Tag update failed:', tagErr.message);
        }
    }
}
