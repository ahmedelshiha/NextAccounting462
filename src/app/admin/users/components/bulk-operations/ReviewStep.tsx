'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReviewStepProps {
  tenantId: string
  selectedUserIds: string[]
  operationType: string
  operationConfig: Record<string, any>
  dryRunResults?: any
  onDryRun: (results: any) => void
  onNext: () => void
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  tenantId,
  selectedUserIds,
  operationType,
  operationConfig,
  dryRunResults,
  onDryRun,
  onNext
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDryRun = async () => {
    try {
      setLoading(true)
      setError(null)

      // Call dry-run API
      const response = await fetch(
        `/api/admin/bulk-operations/preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            selectedUserIds,
            operationType,
            operationConfig
          })
        }
      )

      if (!response.ok) {
        throw new Error('Dry-run failed')
      }

      const results = await response.json()
      onDryRun(results)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getOperationSummary = () => {
    switch (operationType) {
      case 'ROLE_CHANGE':
        return `Change role from ${operationConfig.fromRole} to ${operationConfig.toRole}`
      case 'STATUS_UPDATE':
        return `Update status to ${operationConfig.toStatus}`
      case 'PERMISSION_GRANT':
        return `Grant ${operationConfig.permissions?.length || 0} permissions`
      case 'PERMISSION_REVOKE':
        return `Revoke ${operationConfig.permissions?.length || 0} permissions`
      case 'SEND_EMAIL':
        return `Send email using template: ${operationConfig.emailTemplate}`
      default:
        return 'Unknown operation'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Preview</h3>
        <p className="text-gray-600 mb-4">
          Review the operation details and run a dry-run preview to see the impact
        </p>
      </div>

      {/* Operation Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <h4 className="font-semibold text-sm mb-3">Operation Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Operation:</span>
            <span className="font-medium">{getOperationSummary()}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Users Affected:</span>
            <Badge variant="secondary">{selectedUserIds.length}</Badge>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-700">Estimated Duration:</span>
            <span className="text-sm">
              {Math.ceil((selectedUserIds.length * 50) / 1000)}s
            </span>
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {operationType === 'ROLE_CHANGE' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800 text-sm">
            <strong>⚠️ Important:</strong> Changing user roles may affect their permissions and access to features. This action can be reviewed in the audit log.
          </AlertDescription>
        </Alert>
      )}

      {/* Dry-run button */}
      <div className="space-y-4">
        <div>
          <Button
            onClick={runDryRun}
            disabled={loading || !!dryRunResults}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Running Dry-Run Preview...
              </>
            ) : dryRunResults ? (
              '✓ Dry-Run Completed'
            ) : (
              'Run Dry-Run Preview'
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Dry-run results */}
      {dryRunResults && (
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Preview of Changes</h4>

          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-xs text-green-700">
              <strong>✓ Preview successful:</strong> {dryRunResults.affectedUserCount || 0} users will be affected
            </p>
          </div>

          {/* Sample changes */}
          {dryRunResults.preview && dryRunResults.preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sample Impact (first 5 users):</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {dryRunResults.preview.map((preview: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded border border-gray-200 text-xs"
                  >
                    <div className="font-medium text-gray-900">
                      {preview.userName}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {Object.entries(preview.changes).map(([key, value]: any) => (
                        <div key={key} className="ml-2">
                          <strong>{key}:</strong>{' '}
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dryRunResults.warnings && dryRunResults.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-700">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {dryRunResults.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-xs text-amber-600">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Information */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800 text-sm">
          <strong>ℹ️ Note:</strong> After reviewing the preview, you can proceed to execute this operation. You&apos;ll have the ability to rollback within 30 days if needed.
        </AlertDescription>
      </Alert>

      {/* Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={onNext}
          disabled={!dryRunResults}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next: Execute
        </Button>
      </div>
    </div>
  )
}
