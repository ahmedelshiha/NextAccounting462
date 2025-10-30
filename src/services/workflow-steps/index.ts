export { BaseStepHandler, type WorkflowContext, type StepHandlerResult } from './base-handler'
export { CreateAccountStepHandler, createAccountHandler } from './create-account'
export { ProvisionAccessStepHandler, provisionAccessHandler } from './provision-access'
export { SendEmailStepHandler, sendEmailHandler } from './send-email'
export { AssignRoleStepHandler, assignRoleHandler } from './assign-role'
export { DisableAccountStepHandler, disableAccountHandler } from './disable-account'
export { ArchiveDataStepHandler, archiveDataHandler } from './archive-data'
export { RequestApprovalStepHandler, requestApprovalHandler } from './request-approval'
export { SyncPermissionsStepHandler, syncPermissionsHandler } from './sync-permissions'

export const stepHandlersMap: Record<string, any> = {
  CREATE_ACCOUNT: createAccountHandler,
  PROVISION_ACCESS: provisionAccessHandler,
  SEND_EMAIL: sendEmailHandler,
  ASSIGN_ROLE: assignRoleHandler,
  DISABLE_ACCOUNT: disableAccountHandler,
  ARCHIVE_DATA: archiveDataHandler,
  REQUEST_APPROVAL: requestApprovalHandler,
  SYNC_PERMISSIONS: syncPermissionsHandler
}

export function getStepHandler(actionType: string) {
  return stepHandlersMap[actionType] || null
}
