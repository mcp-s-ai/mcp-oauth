// Core connectors
export { githubConnector } from "./github.js"
export { googleConnector } from "./google.js"
export { 
  createGenericOAuth2Connector,
  discordConnector,
  spotifyConnector,
  twitterConnector
} from "./generic-oauth2.js"

// Communication & Collaboration
export { slackConnector } from "./slack.js"
export { gmailConnector } from "./gmail.js"
export { googleCalendarConnector } from "./google-calendar.js"

// Project & Task Management
export { jiraConnector } from "./jira.js"
export { trelloConnector } from "./trello.js"
export { asanaConnector } from "./asana.js"
export { notionConnector } from "./notion.js"
export { mondayConnector } from "./monday.js"

// Code Management & DevOps
export { gitlabConnector } from "./gitlab.js"

// File Storage & Docs
export { googleWorkspaceConnector } from "./google-workspace.js"
export { googleDriveConnector } from "./google-drive.js"
export { googleSheetsConnector } from "./google-sheets.js"
export { googleFormsConnector } from "./google-forms.js"
export { googleSlidesConnector } from "./google-slides.js"

// CRM & Sales
export { salesforceConnector } from "./salesforce.js"

// Design & Prototyping
export { figmaConnector } from "./figma.js"
export { zeplinConnector } from "./zeplin.js"

// Analytics & Product Insights
export { amplitudeConnector } from "./amplitude.js"
export { googleAnalyticsConnector } from "./google-analytics.js"

// Maps & Location
export { googleMapsConnector } from "./google-maps.js"
