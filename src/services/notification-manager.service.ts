import prisma from '@/lib/prisma'

export class NotificationManagerService {
  async queueEmail(workflowId: string, to: string, subject: string, body: string) {
    try {
      const n = await prisma.workflowNotification.create({
        data: {
          workflowId,
          emailTo: to,
          emailSubject: subject,
          emailBody: body,
          status: 'PENDING'
        }
      })
      return { success: true, id: n.id }
    } catch {
      return { success: false }
    }
  }

  async markSent(notificationId: string) {
    try {
      await prisma.workflowNotification.update({ where: { id: notificationId }, data: { status: 'SENT', sentAt: new Date() } })
      return { success: true }
    } catch {
      return { success: false }
    }
  }
}

export const notificationManager = new NotificationManagerService()
