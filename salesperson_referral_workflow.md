# Dynamic Salesperson Referral System for `/iigprojects`

## Implementation Prompt

Implement a dynamic salesperson referral system **only for the `/iigprojects` page** within the existing project.

Integrate it into the current architecture, database, authentication system, and CMS without affecting other pages.

---

# Objective

Each salesperson should have a unique referral URL that they can share on social media, advertisements, or directly with clients.

Examples:
/ref/ahmed
/ref/sara
/ref/john

When a visitor opens one of these URLs:

1. Find the salesperson using the slug.
2. Verify that the salesperson is active.
3. Store the salesperson in a secure cookie (30-day expiry).
4. Redirect the visitor to `/iigprojects`.
5. Every Contact Now on `/iigprojects` should automatically use the assigned salesperson's WhatsApp number.
6. Any inquiry/contact form submitted from `/iigprojects` should automatically include salesperson information.
7. If another referral URL is opened later, replace the previous salesperson assignment.
8. If the slug is invalid or inactive, use the default company contact.

---

# CMS Integration

The project already has a CMS.

Do not create a separate admin panel.

Add a new **Salespersons Management** section inside the existing CMS.

Only users with the **Administrator role** can access this section.

Other CMS users should not see or access salesperson management.

Administrators should be able to:

- Add salesperson
- Edit salesperson
- Delete salesperson
- Activate/deactivate salesperson
- Change referral slug
- Update WhatsApp number
- Update email
- Manage profile image if media upload exists

The system should support unlimited salespeople without code changes.

---

# Salesperson Database

Create or use an existing salesperson model/table:

Fields:
id
name
slug (unique)
phone
email
profileImage
active
createdAt
updatedAt

---

# Referral Route

Create:
GET /ref/:slug


Flow:
Visitor opens referral URL
|
v
Find salesperson by slug
|
v
Check salesperson status
|
+----+----+
| |
Active Inactive
| |
v v
Save cookie Default contact
|
v
Redirect to /iigprojects

---

# Middleware

Create middleware that:

- Reads salesperson cookie.
- Loads salesperson information.
- Makes salesperson available on `/iigprojects`.
- Uses default company contact if no salesperson exists.

---

# WhatsApp Integration

Remove hardcoded contact now button link `/iigprojects`.
replace it with contact link which
Generate WhatsApp links dynamically for each salesperson

Example:
https://wa.me/971501111111?text=Hi Ahmed, I'm interested in one of the Invest in Georgia projects.


The message should automatically include the salesperson name.

---

# Contact Form Attribution

Every inquiry from `/iigprojects` should automatically store:
salesperson_id
salesperson_name
salesperson_slug

The customer should never manually select a salesperson.

---

# Cookie Behaviour

Cookie duration:
30 days


Example:

Visitor opens:
/ref/ahmed


Cookie:
salesperson = ahmed


Later opens:
/ref/sara


Cookie updates:
salesperson = sara


---

# Workflow Chart
                                ADMIN
                                  |
                                  |
                   +--------------v--------------+
                   | Existing CMS (Admin Only)   |
                   +--------------+--------------+
                                  |
                     Manage Salespersons (CRUD)
                                  |
      +---------------------------+---------------------------+
      |                           |                           |
  Add Salesperson            Edit Salesperson          Delete/Disable
      |                           |                           |
      +---------------------------+---------------------------+
                                  |
                                  v
                     Salesperson Database
          (Name, Slug, WhatsApp, Email, Active)
                                  |
                 SALESPERSON SHARES LINK

             /ref/ahmed
             /ref/sara
             /ref/john
                      |
                      v
            GET /ref/:slug Route
                      |
                      v
      Does salesperson exist and active?
                |                 |
               Yes                No
                |                 |
                v                 v
   Store salesperson cookie   Use default company
          (30 Days)               contact
                |
                v
          Redirect to
         /iigprojects
                |
                v
       Middleware loads
      salesperson information
                |
      +---------+---------+
      |                   |
      v                   v
Dynamic WhatsApp Contact Form
Button Attribution
| |
+---------+---------+
|
v
Lead Saved
|
v
Lead linked to salesperson

---

# Future Expansion

The system should be ready for:

- UTM tracking
- Facebook Ads attribution
- Google Ads attribution
- QR code campaigns
- Referral analytics
- Click tracking
- Lead conversion reports
- Salesperson performance dashboard

---

# Technical Requirements

- Reuse existing project structure.
- Use existing CMS authentication and permissions.
- Administrator-only access.
- Use existing database and ORM.
- Follow current coding standards.
- Use async/await.
- Validate inputs.
- Handle errors properly.
- Avoid hardcoded salesperson data.
- Keep implementation modular and scalable.

The feature should only affect `/iigprojects` currently but should be designed so it can easily expand to other pages in the future.