/**
 * Workflow Executor Service
 * 
 * Core service for executing, managing, and tracking user workflows.
 * Handles step execution, approval routing, error handling, and progress tracking.
 */

import prisma from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'
import { notificationManager } from './notification-manager.service'

export type WorkflowStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type WorkflowStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
export type WorkflowType = 'ONBOARDING' | 'OFFBOARDING' | 'ROLE_CHANGE'
export type StepActionType = 'CREATE_ACCOUNT' | 'PROVISION_ACCESS' | 'SEND_EMAIL' | 'ASSIGN_ROLE' | 'DISABLE_ACCOUNT' | 'ARCHIVE_DATA' | 'REQUEST_APPROVAL' | 'SYNC_PERMISSIONS'

export interface WorkflowStep {
  id: string
  stepNumber: number
  name: string
  description?: string
  actionType: StepActionType
  status: WorkflowStepStatus
  config?: Record<string, any>
  requiresApproval: boolean
  completedAt?: Date
  errorMessage?: string
}

export interface WorkflowContext {
  workflowId: string
  tenantId: string
  userId: string
  triggeredBy: string
  workflowType: WorkflowType
  currentStepNumber: number
  totalSteps: number
  metadata?: Record<string, any>
}

/**
 * Execute workflow and all its steps
 */
export async function executeWorkflow(
  workflowId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch workflow
    const workflow = await prisma.userWorkflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    if (workflow.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update workflow status to IN_PROGRESS
    await prisma.userWorkflow.update({
      where: { id: workflowId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })

    // Build context
    const context: WorkflowContext = {
      workflowId,
      tenantId,
      userId: workflow.userId,
      triggeredBy: workflow.triggeredBy,
      workflowType: workflow.workflowType as WorkflowType,
      currentStepNumber: 1,
      totalSteps: workflow.totalSteps
    }

    // Execute each step
    for (const step of workflow.steps) {
      const stepResult = await executeStep(step.id, context)

      if (!stepResult.success) {
        // Update workflow as failed
        await prisma.userWorkflow.update({
          where: { id: workflowId },
          data: {
            status: 'FAILED',
            errorMessage: stepResult.error,
            lastErrorAt: new Date()
          }
        })

        // Send failure notification
        await notificationManager.sendWorkflowFailedNotification(
          workflowId,
          workflow.userId,
          stepResult.error || 'Unknown error'
        )

        return { success: false, error: stepResult.error || 'Workflow step failed' }
      }

      context.currentStepNumber++
    }

    // Mark workflow as completed
    await prisma.userWorkflow.update({
      where: { id: workflowId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercent: 100,
        completedSteps: workflow.totalSteps
      }
    })

    // Send completion notification
    await notificationManager.sendWorkflowCompletedNotification(
      workflowId,
      workflow.userId
    )

    return { success: true }
  } catch (error) {
    console.error('Error executing workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Execute a single workflow step
 */
export async function executeStep(
  stepId: string,
  context: WorkflowContext
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch step
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId }
    })

    if (!step) {
      return { success: false, error: 'Step not found' }
    }

    // Check if approval is required
    if (step.requiresApproval && !step.approvedAt) {
      // Update step status to waiting for approval
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'PENDING',
          startedAt: new Date()
        }
      })

      // Send approval request
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: context.workflowId }
      })

      if (workflow) {
        await notificationManager.sendApprovalRequestNotification(
          stepId,
          context.workflowId,
          step.name,
          context.userId
        )
      }

      return { success: false, error: 'Awaiting approval' }
    }

    // Update step status to IN_PROGRESS
    await prisma.workflowStep.update({
      where: { id: stepId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() }
    })

    // Execute step based on action type
    const stepStartTime = Date.now()

    try {
      switch (step.actionType) {
        case 'CREATE_ACCOUNT':
          await executeCreateAccount(context)
          break
        case 'PROVISION_ACCESS':
          await executeProvisionAccess(context, step.config)
          break
        case 'SEND_EMAIL':
          await executeSendEmail(context, step.config)
          break
        case 'ASSIGN_ROLE':
          await executeAssignRole(context, step.config)
          break
        case 'DISABLE_ACCOUNT':
          await executeDisableAccount(context, step.config)
          break
        case 'ARCHIVE_DATA':
          await executeArchiveData(context, step.config)
          break
        case 'SYNC_PERMISSIONS':
          await executeSyncPermissions(context)
          break
        default:
          return { success: false, error: `Unknown action type: ${step.actionType}` }
      }

      // Update step as completed
      const duration = Date.now() - stepStartTime
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs: duration
        }
      })

      // Update workflow progress
      const workflow = await prisma.userWorkflow.findUnique({
        where: { id: context.workflowId },
        include: { steps: true }
      })

      if (workflow) {
        const completedSteps = workflow.steps.filter(s => s.status === 'COMPLETED').length
        const progressPercent = Math.round((completedSteps / workflow.totalSteps) * 100)

        await prisma.userWorkflow.update({
          where: { id: context.workflowId },
          data: {
            completedSteps,
            progressPercent
          }
        })
      }

      return { success: true }
    } catch (stepError) {
      // Mark step as failed
      const errorMessage = stepError instanceof Error ? stepError.message : 'Unknown error'
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'FAILED',
          errorMessage
        }
      })

      return { success: false, error: errorMessage }
    }
  } catch (error) {
    console.error('Error executing step:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Pause workflow execution
 */
export async function pauseWorkflow(
  workflowId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const workflow = await prisma.userWorkflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    if (workflow.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.userWorkflow.update({
      where: { id: workflowId },
      data: { status: 'PAUSED' }
    })

    return { success: true }
  } catch (error) {
    console.error('Error pausing workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Resume paused workflow
 */
export async function resumeWorkflow(
  workflowId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const workflow = await prisma.userWorkflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    if (workflow.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (workflow.status !== 'PAUSED') {
      return { success: false, error: 'Workflow is not paused' }
    }

    // Resume execution
    await executeWorkflow(workflowId, tenantId)

    return { success: true }
  } catch (error) {
    console.error('Error resuming workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Cancel workflow
 */
export async function cancelWorkflow(
  workflowId: string,
  tenantId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const workflow = await prisma.userWorkflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    if (workflow.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.userWorkflow.update({
      where: { id: workflowId },
      data: {
        status: 'CANCELLED',
        errorMessage: reason || 'Workflow cancelled by user'
      }
    })

    // Send cancellation notification
    await notificationManager.sendWorkflowCancelledNotification(
      workflowId,
      workflow.userId,
      reason
    )

    return { success: true }
  } catch (error) {
    console.error('Error cancelling workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get workflow progress
 */
export async function getWorkflowProgress(
  workflowId: string,
  tenantId: string
): Promise<{
  success: boolean
  progress?: number
  status?: WorkflowStatus
  completedSteps?: number
  totalSteps?: number
  error?: string
}> {
  try {
    const workflow = await prisma.userWorkflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    if (workflow.tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' }
    }

    return {
      success: true,
      progress: workflow.progressPercent,
      status: workflow.status as WorkflowStatus,
      completedSteps: workflow.completedSteps,
      totalSteps: workflow.totalSteps
    }
  } catch (error) {
    console.error('Error getting workflow progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Step action implementations

async function executeCreateAccount(context: WorkflowContext): Promise<void> {
  // In real implementation, would create user account
  // For now, this is a placeholder
  console.log(`Creating account for user ${context.userId} in workflow ${context.workflowId}`)
}

async function executeProvisionAccess(
  context: WorkflowContext,
  config?: Record<string, any>
): Promise<void> {
  console.log(`Provisioning access for user ${context.userId}`, config)
}

async function executeSendEmail(
  context: WorkflowContext,
  config?: Record<string, any>
): Promise<void> {
  console.log(`Sending email for workflow ${context.workflowId}`, config)
}

async function executeAssignRole(
  context: WorkflowContext,
  config?: Record<string, any>
): Promise<void> {
  if (!config?.role) {
    throw new Error('Role not specified in step configuration')
  }
  console.log(`Assigning role ${config.role} to user ${context.userId}`)
}

async function executeDisableAccount(
  context: WorkflowContext,
  config?: Record<string, any>
): Promise<void> {
  console.log(`Disabling account for user ${context.userId}`)
}

async function executeArchiveData(
  context: WorkflowContext,
  config?: Record<string, any>
): Promise<void> {
  console.log(`Archiving data for user ${context.userId}`)
}

async function executeSyncPermissions(context: WorkflowContext): Promise<void> {
  console.log(`Syncing permissions for user ${context.userId}`)
}
