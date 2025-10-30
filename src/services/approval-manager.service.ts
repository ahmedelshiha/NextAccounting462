import prisma from '@/lib/prisma'

export class ApprovalManagerService {
  async requestApproval(stepId: string, approverEmails: string[]) {
    try {
      const step = await prisma.workflowStep.findUnique({ where: { id: stepId }, include: { workflow: true } })
      if (!step) return { success: false }
      const notifications = await Promise.all(
        approverEmails.map(email =>
          prisma.workflowNotification.create({
            data: {
              workflowId: step.workflowId,
              emailTo: email,
              emailSubject: `Approval requested: ${step.name}`,
              emailBody: `Please approve step ${step.stepNumber}: ${step.name}`
            }
          })
        )
      )
      return { success: true, notifications: notifications.length }
    } catch {
      return { success: false }
    }
  }

  async approveStep(stepId: string, approverUserId: string) {
    try {
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: { approvedAt: new Date(), approvedBy: approverUserId }
      })
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  async getApprovalStatus(stepId: string) {
    try {
      const step = await prisma.workflowStep.findUnique({ where: { id: stepId } })
      if (!step) return { approved: false }
      return { approved: !!step.approvedAt }
    } catch {
      return { approved: false }
    }
  }
}

export const approvalManager = new ApprovalManagerService()
