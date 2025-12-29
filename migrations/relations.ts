import { relations } from "drizzle-orm/relations";
import { merchants, assignments, roles, agencies, monthlyData, processors, users, auditLogs, jobQueue, notifications, onboardingSteps, organizations, onboardingProgress, userActivations, organizationVendors, documentIntegrations, dashboardTours, fileUploads, masterDataset, masterLeadSheets, midRoleAssignments, agencyOauthCredentials, roleAssignmentWorkflow, uploadProgress, auditIssues, noMidDeclarations, userAgencies, passwordResetTokens, mtAgencies, mtMonthlyData, mtSubaccounts, mtMerchants, mtProcessors, mtAuditLogs, mtUsers } from "./schema";

export const assignmentsRelations = relations(assignments, ({one}) => ({
	merchant: one(merchants, {
		fields: [assignments.merchantId],
		references: [merchants.id]
	}),
	role: one(roles, {
		fields: [assignments.roleId],
		references: [roles.id]
	}),
	agency: one(agencies, {
		fields: [assignments.agencyId],
		references: [agencies.id]
	}),
}));

export const merchantsRelations = relations(merchants, ({one, many}) => ({
	assignments: many(assignments),
	agency: one(agencies, {
		fields: [merchants.agencyId],
		references: [agencies.id]
	}),
	monthlyData: many(monthlyData),
	auditIssues: many(auditIssues),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	assignments: many(assignments),
}));

export const agenciesRelations = relations(agencies, ({many}) => ({
	assignments: many(assignments),
	merchants: many(merchants),
	monthlyData: many(monthlyData),
	fileUploads: many(fileUploads),
	masterDatasets: many(masterDataset),
	midRoleAssignments: many(midRoleAssignments),
	agencyOauthCredentials: many(agencyOauthCredentials),
	roleAssignmentWorkflows: many(roleAssignmentWorkflow),
	uploadProgresses: many(uploadProgress),
	auditIssues: many(auditIssues),
	noMidDeclarations: many(noMidDeclarations),
	userAgencies: many(userAgencies),
}));

export const monthlyDataRelations = relations(monthlyData, ({one}) => ({
	merchant: one(merchants, {
		fields: [monthlyData.merchantId],
		references: [merchants.id]
	}),
	processor: one(processors, {
		fields: [monthlyData.processorId],
		references: [processors.id]
	}),
	agency: one(agencies, {
		fields: [monthlyData.agencyId],
		references: [agencies.id]
	}),
}));

export const processorsRelations = relations(processors, ({many}) => ({
	monthlyData: many(monthlyData),
	fileUploads: many(fileUploads),
	uploadProgresses: many(uploadProgress),
	noMidDeclarations: many(noMidDeclarations),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	auditLogs: many(auditLogs),
	jobQueues: many(jobQueue),
	notifications: many(notifications),
	onboardingSteps: many(onboardingSteps),
	masterLeadSheets: many(masterLeadSheets),
	userAgencies: many(userAgencies),
	passwordResetTokens: many(passwordResetTokens),
}));

export const jobQueueRelations = relations(jobQueue, ({one}) => ({
	user: one(users, {
		fields: [jobQueue.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const onboardingStepsRelations = relations(onboardingSteps, ({one}) => ({
	user: one(users, {
		fields: [onboardingSteps.completedByUserId],
		references: [users.id]
	}),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({one}) => ({
	organization: one(organizations, {
		fields: [onboardingProgress.organizationId],
		references: [organizations.organizationId]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	onboardingProgresses: many(onboardingProgress),
	userActivations: many(userActivations),
	organizationVendors: many(organizationVendors),
	documentIntegrations: many(documentIntegrations),
	dashboardTours: many(dashboardTours),
}));

export const userActivationsRelations = relations(userActivations, ({one}) => ({
	organization: one(organizations, {
		fields: [userActivations.organizationId],
		references: [organizations.organizationId]
	}),
}));

export const organizationVendorsRelations = relations(organizationVendors, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationVendors.organizationId],
		references: [organizations.organizationId]
	}),
}));

export const documentIntegrationsRelations = relations(documentIntegrations, ({one}) => ({
	organization: one(organizations, {
		fields: [documentIntegrations.organizationId],
		references: [organizations.organizationId]
	}),
}));

export const dashboardToursRelations = relations(dashboardTours, ({one}) => ({
	organization: one(organizations, {
		fields: [dashboardTours.organizationId],
		references: [organizations.organizationId]
	}),
}));

export const fileUploadsRelations = relations(fileUploads, ({one}) => ({
	processor: one(processors, {
		fields: [fileUploads.processorId],
		references: [processors.id]
	}),
	agency: one(agencies, {
		fields: [fileUploads.agencyId],
		references: [agencies.id]
	}),
}));

export const masterDatasetRelations = relations(masterDataset, ({one}) => ({
	agency: one(agencies, {
		fields: [masterDataset.agencyId],
		references: [agencies.id]
	}),
}));

export const masterLeadSheetsRelations = relations(masterLeadSheets, ({one}) => ({
	user: one(users, {
		fields: [masterLeadSheets.processedBy],
		references: [users.id]
	}),
}));

export const midRoleAssignmentsRelations = relations(midRoleAssignments, ({one}) => ({
	agency: one(agencies, {
		fields: [midRoleAssignments.agencyId],
		references: [agencies.id]
	}),
}));

export const agencyOauthCredentialsRelations = relations(agencyOauthCredentials, ({one}) => ({
	agency: one(agencies, {
		fields: [agencyOauthCredentials.agencyId],
		references: [agencies.id]
	}),
}));

export const roleAssignmentWorkflowRelations = relations(roleAssignmentWorkflow, ({one}) => ({
	agency: one(agencies, {
		fields: [roleAssignmentWorkflow.agencyId],
		references: [agencies.id]
	}),
}));

export const uploadProgressRelations = relations(uploadProgress, ({one}) => ({
	processor: one(processors, {
		fields: [uploadProgress.processorId],
		references: [processors.id]
	}),
	agency: one(agencies, {
		fields: [uploadProgress.agencyId],
		references: [agencies.id]
	}),
}));

export const auditIssuesRelations = relations(auditIssues, ({one}) => ({
	merchant: one(merchants, {
		fields: [auditIssues.merchantId],
		references: [merchants.id]
	}),
	agency: one(agencies, {
		fields: [auditIssues.agencyId],
		references: [agencies.id]
	}),
}));

export const noMidDeclarationsRelations = relations(noMidDeclarations, ({one}) => ({
	processor: one(processors, {
		fields: [noMidDeclarations.processorId],
		references: [processors.id]
	}),
	agency: one(agencies, {
		fields: [noMidDeclarations.agencyId],
		references: [agencies.id]
	}),
}));

export const userAgenciesRelations = relations(userAgencies, ({one}) => ({
	user: one(users, {
		fields: [userAgencies.userId],
		references: [users.id]
	}),
	agency: one(agencies, {
		fields: [userAgencies.agencyId],
		references: [agencies.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const mtMonthlyDataRelations = relations(mtMonthlyData, ({one}) => ({
	mtAgency: one(mtAgencies, {
		fields: [mtMonthlyData.agencyId],
		references: [mtAgencies.id]
	}),
	mtSubaccount: one(mtSubaccounts, {
		fields: [mtMonthlyData.subaccountId],
		references: [mtSubaccounts.id]
	}),
	mtMerchant: one(mtMerchants, {
		fields: [mtMonthlyData.merchantId],
		references: [mtMerchants.id]
	}),
	mtProcessor: one(mtProcessors, {
		fields: [mtMonthlyData.processorId],
		references: [mtProcessors.id]
	}),
}));

export const mtAgenciesRelations = relations(mtAgencies, ({many}) => ({
	mtMonthlyData: many(mtMonthlyData),
	mtAuditLogs: many(mtAuditLogs),
	mtSubaccounts: many(mtSubaccounts),
	mtUsers: many(mtUsers),
	mtProcessors: many(mtProcessors),
	mtMerchants: many(mtMerchants),
}));

export const mtSubaccountsRelations = relations(mtSubaccounts, ({one, many}) => ({
	mtMonthlyData: many(mtMonthlyData),
	mtAuditLogs: many(mtAuditLogs),
	mtAgency: one(mtAgencies, {
		fields: [mtSubaccounts.agencyId],
		references: [mtAgencies.id]
	}),
	mtUsers: many(mtUsers),
	mtProcessors: many(mtProcessors),
	mtMerchants: many(mtMerchants),
}));

export const mtMerchantsRelations = relations(mtMerchants, ({one, many}) => ({
	mtMonthlyData: many(mtMonthlyData),
	mtAgency: one(mtAgencies, {
		fields: [mtMerchants.agencyId],
		references: [mtAgencies.id]
	}),
	mtSubaccount: one(mtSubaccounts, {
		fields: [mtMerchants.subaccountId],
		references: [mtSubaccounts.id]
	}),
	mtProcessor: one(mtProcessors, {
		fields: [mtMerchants.processorId],
		references: [mtProcessors.id]
	}),
}));

export const mtProcessorsRelations = relations(mtProcessors, ({one, many}) => ({
	mtMonthlyData: many(mtMonthlyData),
	mtAgency: one(mtAgencies, {
		fields: [mtProcessors.agencyId],
		references: [mtAgencies.id]
	}),
	mtSubaccount: one(mtSubaccounts, {
		fields: [mtProcessors.subaccountId],
		references: [mtSubaccounts.id]
	}),
	mtMerchants: many(mtMerchants),
}));

export const mtAuditLogsRelations = relations(mtAuditLogs, ({one}) => ({
	mtAgency: one(mtAgencies, {
		fields: [mtAuditLogs.agencyId],
		references: [mtAgencies.id]
	}),
	mtSubaccount: one(mtSubaccounts, {
		fields: [mtAuditLogs.subaccountId],
		references: [mtSubaccounts.id]
	}),
}));

export const mtUsersRelations = relations(mtUsers, ({one}) => ({
	mtAgency: one(mtAgencies, {
		fields: [mtUsers.agencyId],
		references: [mtAgencies.id]
	}),
	mtSubaccount: one(mtSubaccounts, {
		fields: [mtUsers.subaccountId],
		references: [mtSubaccounts.id]
	}),
}));