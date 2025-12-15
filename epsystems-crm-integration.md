# EPSystems CRM Integration - Complete Field Mapping

## API Endpoints
- **CRM URL**: `https://epsystems.synthetic.jp`
- **API Key**: Set in Cloudflare Pages env var `CRM_API_KEY`

---

## 1. Create Person (`POST /rest/people`)

```json
{
  "name": {
    "firstName": "{{ form.name.split(' ')[0] }}",
    "lastName": "{{ form.name.split(' ').slice(1).join(' ') || '' }}"
  },
  "emails": {
    "primaryEmail": "{{ form.email.toLowerCase() }}"
  },
  "jobTitle": "{{ form.business_type }}",

  // === VISITOR IDENTIFICATION ===
  "visitorId": "{{ tracking.visitor_id }}",
  "sessionId": "{{ tracking.session_id }}",

  // === FIRST TOUCH ATTRIBUTION ===
  "firstTouchDate": "{{ tracking.first_visit_at }}",
  "firstLandingPage": "{{ tracking.first_landing_page }}",
  "firstReferrer": "{{ tracking.first_referrer }}",
  "firstReferrerDomain": "{{ tracking.first_referrer_domain }}",
  "firstReferrerType": "{{ tracking.first_referrer_type }}",
  "firstRef": "{{ tracking.first_ref }}",

  // First Touch UTMs
  "utmSource": "{{ tracking.first_utm_source }}",
  "utmMedium": "{{ tracking.first_utm_medium }}",
  "utmCampaign": "{{ tracking.first_utm_campaign }}",
  "utmTerm": "{{ tracking.first_utm_term }}",
  "utmContent": "{{ tracking.first_utm_content }}",

  // First Touch Ad Click IDs
  "firstGclid": "{{ tracking.first_gclid }}",
  "firstFbclid": "{{ tracking.first_fbclid }}",
  "firstMsclkid": "{{ tracking.first_msclkid }}",
  "firstTtclid": "{{ tracking.first_ttclid }}",
  "firstLiFatId": "{{ tracking.first_li_fat_id }}",

  // === LAST TOUCH ATTRIBUTION ===
  "lastUtmSource": "{{ tracking.last_utm_source }}",
  "lastUtmMedium": "{{ tracking.last_utm_medium }}",
  "lastUtmCampaign": "{{ tracking.last_utm_campaign }}",
  "lastUtmTerm": "{{ tracking.last_utm_term }}",
  "lastUtmContent": "{{ tracking.last_utm_content }}",
  "lastGclid": "{{ tracking.last_gclid }}",
  "lastFbclid": "{{ tracking.last_fbclid }}",
  "lastMsclkid": "{{ tracking.last_msclkid }}",
  "lastTtclid": "{{ tracking.last_ttclid }}",
  "lastLiFatId": "{{ tracking.last_li_fat_id }}",
  "lastRef": "{{ tracking.last_ref }}",

  // === ENGAGEMENT METRICS ===
  "totalVisits": {{ tracking.total_visits }},
  "totalPageviews": {{ tracking.total_pageviews }},

  // === DEVICE INFO ===
  "deviceType": "{{ tracking.device_type }}",
  "browser": "{{ tracking.browser }}",
  "operatingSystem": "{{ tracking.operating_system }}",
  "timezone": "{{ tracking.timezone }}",
  "language": "{{ tracking.language }}",
  "screenWidth": {{ tracking.screen_width }},
  "screenHeight": {{ tracking.screen_height }},
  "viewportWidth": {{ tracking.viewport_width }},
  "viewportHeight": {{ tracking.viewport_height }},

  // === FORM DATA ===
  "formMessage": "{{ form.message }}"
}
```

---

## 2. Create Opportunity (`POST /rest/opportunities`)

```json
{
  "name": "{{ form.name }} - {{ form.business_type }} [{{ tracking.last_utm_source || 'direct' }}]",
  "stage": "LEAD_IN",
  "pointOfContactId": "{{ person.id }}",

  // === SESSION ATTRIBUTION ===
  "sessionLandingPage": "{{ tracking.session_landing_page }}",
  "sessionReferrer": "{{ tracking.session_referrer }}",
  "sessionReferrerType": "{{ tracking.session_referrer_type }}",
  "formPage": "{{ submission.form_page }}",

  // === ENGAGEMENT METRICS ===
  "timeOnPageSeconds": {{ tracking.time_on_page_seconds }},
  "sessionDurationSeconds": {{ tracking.session_duration_seconds }},
  "pagesViewedCount": {{ tracking.pages_viewed_count }},
  "maxScrollDepth": {{ tracking.max_scroll_depth_percent }},

  // === AD CLICK IDs (last touch) ===
  "gclid": "{{ tracking.last_gclid }}",
  "fbclid": "{{ tracking.last_fbclid }}",
  "msclkid": "{{ tracking.last_msclkid }}",
  "ttclid": "{{ tracking.last_ttclid }}",
  "liFatId": "{{ tracking.last_li_fat_id }}"
}
```

---

## 3. Create Note (`POST /rest/notes`) - Optional

```json
{
  "body": "## Form Submission Details\n\n**Submitted**: {{ submission.submitted_at }}\n**Form Page**: {{ submission.form_page }}\n**Message**: {{ form.message || 'No message' }}\n\n## Pages Viewed\n{{ tracking.pages_viewed.map(p => `- ${p.path}`).join('\\n') }}",
  "personId": "{{ person.id }}"
}
```

---

## Complete TypeScript Example for Pages Function

```typescript
// functions/api/submit.ts

interface FormPayload {
  form: {
    name: string;
    email: string;
    business_type: string;
    message?: string;
  };
  submission: {
    submitted_at: string;
    form_id: string;
    form_page: string;
  };
  tracking: {
    // Visitor Identification
    visitor_id: string;
    session_id: string;

    // First Touch Attribution
    first_visit_at: string;
    first_landing_page: string;
    first_referrer: string;
    first_referrer_domain: string;
    first_referrer_type: string;
    first_ref: string;

    // First Touch UTMs
    first_utm_source: string;
    first_utm_medium: string;
    first_utm_campaign: string;
    first_utm_term: string;
    first_utm_content: string;

    // First Touch Ad Click IDs
    first_gclid: string;
    first_fbclid: string;
    first_msclkid: string;
    first_ttclid: string;
    first_li_fat_id: string;

    // Session Attribution
    session_landing_page: string;
    session_referrer: string;
    session_referrer_type: string;

    // Last Touch UTMs
    last_utm_source: string;
    last_utm_medium: string;
    last_utm_campaign: string;
    last_utm_term: string;
    last_utm_content: string;

    // Last Touch Ad Click IDs
    last_gclid: string;
    last_fbclid: string;
    last_msclkid: string;
    last_ttclid: string;
    last_li_fat_id: string;
    last_ref: string;

    // Engagement Metrics
    total_visits: number;
    total_pageviews: number;
    time_on_page_seconds: number;
    session_duration_seconds: number;
    pages_viewed_count: number;
    max_scroll_depth_percent: number;

    // Device Info
    device_type: string;
    browser: string;
    operating_system: string;
    timezone: string;
    language: string;
    screen_width: number;
    screen_height: number;
    viewport_width: number;
    viewport_height: number;
  };
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const payload: FormPayload = await request.json();
  const { form, submission, tracking } = payload;

  const CRM_API_URL = env.CRM_API_URL || 'https://epsystems.synthetic.jp';
  const CRM_API_KEY = env.CRM_API_KEY;

  const headers = {
    'Authorization': `Bearer ${CRM_API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Helper to handle null/undefined values
  const str = (val: any) => val || null;
  const num = (val: any) => (typeof val === 'number' ? val : null);

  // Split name
  const nameParts = form.name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // 1. Create Person with all tracking fields
  const personPayload = {
    name: { firstName, lastName },
    emails: { primaryEmail: form.email.toLowerCase() },
    jobTitle: form.business_type,

    // Visitor Identification
    visitorId: str(tracking.visitor_id),
    sessionId: str(tracking.session_id),

    // First Touch Attribution
    firstTouchDate: str(tracking.first_visit_at),
    firstLandingPage: str(tracking.first_landing_page),
    firstReferrer: str(tracking.first_referrer),
    firstReferrerDomain: str(tracking.first_referrer_domain),
    firstReferrerType: str(tracking.first_referrer_type),
    firstRef: str(tracking.first_ref),

    // First Touch UTMs
    utmSource: str(tracking.first_utm_source),
    utmMedium: str(tracking.first_utm_medium),
    utmCampaign: str(tracking.first_utm_campaign),
    utmTerm: str(tracking.first_utm_term),
    utmContent: str(tracking.first_utm_content),

    // First Touch Ad Click IDs
    firstGclid: str(tracking.first_gclid),
    firstFbclid: str(tracking.first_fbclid),
    firstMsclkid: str(tracking.first_msclkid),
    firstTtclid: str(tracking.first_ttclid),
    firstLiFatId: str(tracking.first_li_fat_id),

    // Last Touch Attribution
    lastUtmSource: str(tracking.last_utm_source),
    lastUtmMedium: str(tracking.last_utm_medium),
    lastUtmCampaign: str(tracking.last_utm_campaign),
    lastUtmTerm: str(tracking.last_utm_term),
    lastUtmContent: str(tracking.last_utm_content),
    lastGclid: str(tracking.last_gclid),
    lastFbclid: str(tracking.last_fbclid),
    lastMsclkid: str(tracking.last_msclkid),
    lastTtclid: str(tracking.last_ttclid),
    lastLiFatId: str(tracking.last_li_fat_id),
    lastRef: str(tracking.last_ref),

    // Engagement Metrics
    totalVisits: num(tracking.total_visits),
    totalPageviews: num(tracking.total_pageviews),

    // Device Info
    deviceType: str(tracking.device_type),
    browser: str(tracking.browser),
    operatingSystem: str(tracking.operating_system),
    timezone: str(tracking.timezone),
    language: str(tracking.language),
    screenWidth: num(tracking.screen_width),
    screenHeight: num(tracking.screen_height),
    viewportWidth: num(tracking.viewport_width),
    viewportHeight: num(tracking.viewport_height),

    // Form Data
    formMessage: str(form.message),
  };

  const personRes = await fetch(`${CRM_API_URL}/rest/people`, {
    method: 'POST',
    headers,
    body: JSON.stringify(personPayload),
  });

  if (!personRes.ok) {
    const error = await personRes.text();
    return new Response(JSON.stringify({ error: 'Failed to create person', details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const person = await personRes.json();

  // 2. Create Opportunity with session tracking
  const source = tracking.last_utm_source || tracking.first_utm_source || 'direct';
  const opportunityPayload = {
    name: `${form.name} - ${form.business_type} [${source}]`,
    stage: 'LEAD_IN',
    pointOfContactId: person.data.id,

    // Session Attribution
    sessionLandingPage: str(tracking.session_landing_page),
    sessionReferrer: str(tracking.session_referrer),
    sessionReferrerType: str(tracking.session_referrer_type),
    formPage: str(submission.form_page),

    // Engagement Metrics
    timeOnPageSeconds: num(tracking.time_on_page_seconds),
    sessionDurationSeconds: num(tracking.session_duration_seconds),
    pagesViewedCount: num(tracking.pages_viewed_count),
    maxScrollDepth: num(tracking.max_scroll_depth_percent),

    // Ad Click IDs
    gclid: str(tracking.last_gclid),
    fbclid: str(tracking.last_fbclid),
    msclkid: str(tracking.last_msclkid),
    ttclid: str(tracking.last_ttclid),
    liFatId: str(tracking.last_li_fat_id),
  };

  const oppRes = await fetch(`${CRM_API_URL}/rest/opportunities`, {
    method: 'POST',
    headers,
    body: JSON.stringify(opportunityPayload),
  });

  if (!oppRes.ok) {
    const error = await oppRes.text();
    return new Response(JSON.stringify({ error: 'Failed to create opportunity', details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const opportunity = await oppRes.json();

  return new Response(JSON.stringify({
    success: true,
    person: { id: person.data.id },
    opportunity: { id: opportunity.data.id },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Field Summary

### Person Fields (37 custom fields)

| Field | Type | Source |
|-------|------|--------|
| **Visitor Identification** |||
| `visitorId` | TEXT | `tracking.visitor_id` |
| `sessionId` | TEXT | `tracking.session_id` |
| **First Touch Attribution** |||
| `firstTouchDate` | DATE | `tracking.first_visit_at` |
| `firstLandingPage` | TEXT | `tracking.first_landing_page` |
| `firstReferrer` | TEXT | `tracking.first_referrer` |
| `firstReferrerDomain` | TEXT | `tracking.first_referrer_domain` |
| `firstReferrerType` | TEXT | `tracking.first_referrer_type` |
| `firstRef` | TEXT | `tracking.first_ref` |
| **First Touch UTMs** |||
| `utmSource` | TEXT | `tracking.first_utm_source` |
| `utmMedium` | TEXT | `tracking.first_utm_medium` |
| `utmCampaign` | TEXT | `tracking.first_utm_campaign` |
| `utmTerm` | TEXT | `tracking.first_utm_term` |
| `utmContent` | TEXT | `tracking.first_utm_content` |
| **First Touch Ad Click IDs** |||
| `firstGclid` | TEXT | `tracking.first_gclid` |
| `firstFbclid` | TEXT | `tracking.first_fbclid` |
| `firstMsclkid` | TEXT | `tracking.first_msclkid` |
| `firstTtclid` | TEXT | `tracking.first_ttclid` |
| `firstLiFatId` | TEXT | `tracking.first_li_fat_id` |
| **Last Touch UTMs** |||
| `lastUtmSource` | TEXT | `tracking.last_utm_source` |
| `lastUtmMedium` | TEXT | `tracking.last_utm_medium` |
| `lastUtmCampaign` | TEXT | `tracking.last_utm_campaign` |
| `lastUtmTerm` | TEXT | `tracking.last_utm_term` |
| `lastUtmContent` | TEXT | `tracking.last_utm_content` |
| **Last Touch Ad Click IDs** |||
| `lastGclid` | TEXT | `tracking.last_gclid` |
| `lastFbclid` | TEXT | `tracking.last_fbclid` |
| `lastMsclkid` | TEXT | `tracking.last_msclkid` |
| `lastTtclid` | TEXT | `tracking.last_ttclid` |
| `lastLiFatId` | TEXT | `tracking.last_li_fat_id` |
| `lastRef` | TEXT | `tracking.last_ref` |
| **Engagement Metrics** |||
| `totalVisits` | NUMBER | `tracking.total_visits` |
| `totalPageviews` | NUMBER | `tracking.total_pageviews` |
| **Device Info** |||
| `deviceType` | TEXT | `tracking.device_type` |
| `browser` | TEXT | `tracking.browser` |
| `operatingSystem` | TEXT | `tracking.operating_system` |
| `timezone` | TEXT | `tracking.timezone` |
| `language` | TEXT | `tracking.language` |
| `screenWidth` | NUMBER | `tracking.screen_width` |
| `screenHeight` | NUMBER | `tracking.screen_height` |
| `viewportWidth` | NUMBER | `tracking.viewport_width` |
| `viewportHeight` | NUMBER | `tracking.viewport_height` |
| **Form Data** |||
| `formMessage` | TEXT | `form.message` |

### Opportunity Fields (13 custom fields)

| Field | Type | Source |
|-------|------|--------|
| **Session Attribution** |||
| `sessionLandingPage` | TEXT | `tracking.session_landing_page` |
| `sessionReferrer` | TEXT | `tracking.session_referrer` |
| `sessionReferrerType` | TEXT | `tracking.session_referrer_type` |
| `formPage` | TEXT | `submission.form_page` |
| **Engagement Metrics** |||
| `timeOnPageSeconds` | NUMBER | `tracking.time_on_page_seconds` |
| `sessionDurationSeconds` | NUMBER | `tracking.session_duration_seconds` |
| `pagesViewedCount` | NUMBER | `tracking.pages_viewed_count` |
| `maxScrollDepth` | NUMBER | `tracking.max_scroll_depth_percent` |
| **Ad Click IDs** |||
| `gclid` | TEXT | `tracking.last_gclid` |
| `fbclid` | TEXT | `tracking.last_fbclid` |
| `msclkid` | TEXT | `tracking.last_msclkid` |
| `ttclid` | TEXT | `tracking.last_ttclid` |
| `liFatId` | TEXT | `tracking.last_li_fat_id` |

---

## Opportunity Stages

Custom pipeline stages configured in CRM:

| Stage | Position | Color |
|-------|----------|-------|
| Lead In | 0 | Blue |
| Initial Contact | 1 | Sky |
| Call Scheduled | 2 | Turquoise |
| Call Completed | 3 | Yellow |
| Proposal | 4 | Orange |
| Invoice | 5 | Pink |
| Won | 6 | Green |
| Lost | 7 | Red |

---

## Testing

After updating the Pages Function, submit a test form and verify in CRM:

1. Go to https://epsystems.synthetic.jp
2. Navigate to People > find the new person
3. Check that all tracking fields are populated
4. Navigate to Opportunities > find the new opportunity
5. Check session/engagement fields

### Verified Test Submission (2024-12-15)

- **Person**: Full Fields Test (fullfields@epsystems.dev)
- **All UTM fields**: Populated correctly
- **Device info**: desktop, Chrome, macOS, 1440x900 screen, 1200x692 viewport
- **Engagement**: 2 visits, 16 pageviews
- **Opportunity**: LEAD_IN stage, 20s time on page, 95% scroll depth

---

## CRM Technical Details

- **Workspace ID**: `f32e7769-f441-4275-98c9-a55ce9473244`
- **Database Schema**: `workspace_eeafckfwr98kpdwn3zmvoza6c`
- **Person Object ID**: `e3c7eb89-3037-41c9-af93-923730bbc041`
- **Opportunity Object ID**: `f5f9e3e4-5f13-4d4c-be29-cf000ca8b446`

---

Last Updated: 2024-12-15
