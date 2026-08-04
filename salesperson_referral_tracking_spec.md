# Salesperson Referral Tracking & Analytics System

## Objective

The referral link system is already implemented.

Do not modify the existing referral logic.

Implement a tracking and analytics system on top of the existing salesperson referral system.

The goal is to track:

1. How many visitors each salesperson referral link generates.
2. How many unique visitors each salesperson gets.
3. How many visitors click the WhatsApp contact button.
4. Which sources generate traffic (LinkedIn, WhatsApp, Meta, Twitter, etc.).
5. Organize all tracking data inside the existing CMS.
6. Provide salesperson-wise analytics visible to administrators.

---

# Existing Flow

Current system:
Salesperson
|
|
Shares Referral Link
|
v
/ref/:slug
|
v
/iigprojects
|
v
WhatsApp Contact Button

Add tracking without changing this flow.

---

# Tracking Events

The system should track two main events:

## 1. Referral Visit

Triggered when a visitor opens:
/ref/ahmed


Store:

- salesperson ID
- salesperson slug
- visitor IP
- user agent
- browser/device information
- referral URL
- landing page
- UTM source
- UTM medium
- UTM campaign
- timestamp


Example:
Salesperson:
Ahmed
Event:
Referral Visit
Source:
LinkedIn
IP:
185.xxx.xxx.xxx
Date:
2026-08-04

---

## 2. WhatsApp Click

Triggered when a visitor clicks the WhatsApp contact button.

Flow:
User clicks WhatsApp
|
v
Tracking endpoint
|
v
Save event
|
v
Redirect to WhatsApp

Store:

- salesperson ID
- visitor IP
- user agent
- timestamp
- source information

Example:
Salesperson:
Ahmed
Event:
WhatsApp Click
IP:
185.xxx.xxx.xxx
Date:
2026-08-04

---

# Database Design

Create a tracking table.

## salesperson_tracking_events

Fields:
id
salesperson_id
event_type
(page_visit / whatsapp_click)
visitor_ip
user_agent
device_type
browser
country
city
referrer_url
utm_source
utm_medium
utm_campaign
session_id
created_at


---

# Duplicate Visitor Logic

Implement proper visitor identification.

The system should not count every page refresh as a new visitor.

Use a combination of:

- IP address
- User agent
- Cookie/session identifier

Generate a visitor ID:

Example:
visitor_id =
hash(
IP +
browser +
device
)

Store:
visitor_id
first_seen
last_seen

---

# Unique Visitor Tracking

Example:

Same visitor:
IP:
185.xxx.xxx.xxx
Browser:
Chrome
Device:
Desktop

Visits:
10 times


Should count as:
1 unique visitor
10 page visits

---

# Tracking Tables

## Visitors Table
id
visitor_id
ip_address
user_agent
device
first_seen
last_seen


---

## Tracking Events Table
id
visitor_id
salesperson_id
event_type
utm_source
utm_campaign
created_at


---

# CMS Integration

Add a new CMS section:
Analytics

|
|
Salesperson Tracking

Only administrators can access this section.

---

# CMS Dashboard

Create:

## Overall Analytics

Show:
Total Visitors
Total Referral Visits
Total WhatsApp Clicks
Top Performing Salesperson
Top Traffic Source


---

# Salesperson Analytics

Each salesperson should have their own analytics page.

Example:
Ahmed
Referral Link:
/ref/ahmed
Performance:
Total Visits:
1,250
Unique Visitors:
850
WhatsApp Clicks:
180
Conversion Rate:
21%
Traffic Sources:
LinkedIn:
500
WhatsApp:
300
Facebook:
250
Twitter:
200

---

# Date Filters

CMS should support:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Custom date range

---

# Source Tracking

Support UTM parameters:

Example:
/ref/ahmed?
utm_source=linkedin&
utm_campaign=open_house

Track:
utm_source
utm_medium
utm_campaign


---

# Workflow Chart
                     SALESPERSON

                          |
                          |
               Shares Referral Link

                          |
                          v

                /ref/:slug URL

                          |
                          v

             Existing Referral System

                          |
                          v

              Identify Salesperson

                          |
                          |
             +------------+------------+
             |                         |
             v                         v

      Save Visitor Data          Set Attribution
      Tracking Event             Cookie/Session

             |
             |
             v

      Check Existing Visitor

             |
      +------+------+
      |             |
      v             v

 Existing User    New User

      |             |
      v             v
Update Last Seen Create Visitor

             |
             v

          /iigprojects


             |
             v

      Visitor Clicks WhatsApp


             |
             v


      WhatsApp Tracking Route


             |
             v


    Save WhatsApp Click Event


             |
             v


      Redirect to WhatsApp


             |
             v


          CMS Analytics


             |
    +--------+--------+
    |                 |
    v                 v
Salesperson Report Overall Report
Visits Total Visitors
Clicks Total Clicks
Sources Top Salesperson


---

# Security Requirements

- Do not expose visitor IP publicly.
- Only administrators can view analytics.
- Hash or anonymize IP where required.
- Protect tracking endpoints from abuse.
- Avoid counting bots and crawlers.
- Validate all tracking data.

---

# Technical Requirements

- Use existing project architecture.
- Use existing database ORM.
- Use existing CMS authentication.
- Do not rebuild referral functionality.
- Create reusable tracking services.
- Use async/await.
- Write modular code.
- Keep system scalable for hundreds of salespeople.

The final system should allow administrators to clearly see which salesperson generates the most traffic and WhatsApp inquiries from their referral links.
This structure will give your AI IDE enough context to implement the tracking without accidentally rebuilding the referral system you already have.
