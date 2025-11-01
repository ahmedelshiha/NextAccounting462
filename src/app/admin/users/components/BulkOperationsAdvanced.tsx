'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Loader2, TrendingUp } from 'lucide-react'
import {
  BulkOperationRequest,
  BulkOperationImpact,
  BulkOperationResult,
  RiskAssessment
} from '@/services/bulk-operations-advanced.service'

interface BulkOperationsAdvancedProps {
  initialRequest?: BulkOperationRequest
  onExecute?: (request: BulkOperationRequest) => Promise<void>
  onRollback?: (operationId: string) => Promise<void>
}

type Step = 'select' | 'preview' | 'review' | 'execute' | 'complete'

export function BulkOperationsAdvanced({
  initialRequest,
  onExecute,
  onRollback
}: BulkOperationsAdvancedProps) {
  const [step, setStep] = useState<Step>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [request, setRequest] = useState<BulkOperationRequest | null>(initialRequest || null)
  const [dryRunResult, setDryRunResult] = useState<BulkOperationResult | null>(null)
  const [executionResult, setExecutionResult] = useState<BulkOperationResult | null>(null)
  const [impact, setImpact] = useState<BulkOperationImpact | null>(null)

  const handleDryRun = async () => {
    if (!request) return
    setIsLoading(true)
    try {
      // Mock dry-run - in real implementation, call API
      const succeeded = request.userIds.length - 2
      const failed = 2
      const warnings = 1
      const result: BulkOperationResult = {
        id: request.id,
        status: (failed as number) > 0 ? 'PARTIAL' : 'SUCCESS',
        processedCount: request.userIds.length,
        failedCount: failed,
        succeeded,
        failed,
        warnings,
        details: [
          `✓ ${succeeded} users would be processed successfully`,
          `✗ ${failed} users would fail processing`,
          `⚠ ${warnings} users with warnings`
        ],
        results: request.userIds.map((uid, idx) => ({
          userId: uid,
          status: idx < succeeded ? 'SUCCESS' : idx < succeeded + failed ? 'FAILED' : 'WARNING',
          message: 'Preview message'
        })),
        timestamp: new Date()
      }
      setDryRunResult(result)
      setStep('review')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!request) return
    setIsLoading(true)
    try {
      // Call API to execute
      await onExecute?.(request)

      // Mock execution result
      const succeeded = request.userIds.length - 1
      const failed = 1
      const result: BulkOperationResult = {
        id: request.id,
        status: (failed as number) > 0 ? 'PARTIAL' : 'SUCCESS',
        processedCount: request.userIds.length,
        failedCount: failed,
        succeeded,
        failed,
        warnings: 0,
        details: [
          `✓ ${succeeded} users processed successfully`,
          `✗ ${failed} user failed processing`
        ],
        results: request.userIds.map((uid, idx) => ({
          userId: uid,
          status: idx === request.userIds.length - 1 ? 'FAILED' : 'SUCCESS',
          message: idx === request.userIds.length - 1 ? 'Operation failed' : 'Operation applied'
        })),
        timestamp: new Date()
      }
      setExecutionResult(result)
      setStep('complete')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollback = async () => {
    if (!executionResult) return
    setIsLoading(true)
    try {
      await onRollback?.(executionResult.id)
      setStep('select')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={step} />

      {/* Step 1: Select Operation */}
      {step === 'select' && (
        <SelectOperationStep
          initialRequest={request}
          onNext={(req) => {
            setRequest(req)
            setStep('preview')
          }}
        />
      )}

      {/* Step 2: Preview/Dry-Run */}
      {step === 'preview' && request && (
        <PreviewStep
          request={request}
          isLoading={isLoading}
          dryRunResult={dryRunResult}
          onDryRun={handleDryRun}
          onNext={() => setStep('review')}
          onBack={() => setStep('select')}
        />
      )}

      {/* Step 3: Review Impact */}
      {step === 'review' && request && dryRunResult && (
        <ReviewStep
          request={request}
          dryRunResult={dryRunResult}
          onNext={() => setStep('execute')}
          onBack={() => setStep('preview')}
        />
      )}

      {/* Step 4: Execute */}
      {step === 'execute' && request && (
        <ExecuteStep
          request={request}
          isLoading={isLoading}
          onExecute={handleExecute}
          onBack={() => setStep('review')}
        />
      )}

      {/* Step 5: Completion */}
      {step === 'complete' && executionResult && (
        <CompletionStep
          request={request!}
          result={executionResult}
          onRollback={handleRollback}
          onNewOperation={() => {
            setRequest(null)
            setDryRunResult(null)
            setExecutionResult(null)
            setStep('select')
          }}
        />
      )}
    </div>
  )
}

/**
 * Progress Indicator
 */
function ProgressIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'select', label: 'Select' },
    { id: 'preview', label: 'Preview' },
    { id: 'review', label: 'Review' },
    { id: 'execute', label: 'Execute' },
    { id: 'complete', label: 'Complete' }
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              idx <= currentIndex
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {idx + 1}
          </div>
          <div className={`text-xs font-medium ml-2 ${
            idx <= currentIndex ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {step.label}
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${
              idx < currentIndex ? 'bg-blue-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Select Operation Step
 */
function SelectOperationStep({
  initialRequest,
  onNext
}: {
  initialRequest: BulkOperationRequest | null
  onNext: (request: BulkOperationRequest) => void
}) {
  const [operationType, setOperationType] = useState<string>('ROLE_CHANGE')
  const [targetValue, setTargetValue] = useState<string>('')
  const [selectedCount, setSelectedCount] = useState<number>(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Select Operation</CardTitle>
        <CardDescription>Choose the bulk operation type and target value</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Operation Type</label>
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="ROLE_CHANGE">Change User Role</option>
            <option value="STATUS_CHANGE">Change User Status</option>
            <option value="TEAM_ASSIGNMENT">Assign to Team</option>
            <option value="PERMISSION_GRANT">Grant Permission</option>
            <option value="PERMISSION_REVOKE">Revoke Permission</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Target Value</label>
          <input
            type="text"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="e.g., ADMIN, TEAM_LEAD, ACTIVE"
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Selected Users: {selectedCount}</label>
          <div className="mt-1 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected for operation
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            onNext({
              id: Math.random().toString(),
              type: operationType as any,
              userIds: Array.from({ length: selectedCount }, (_, i) => `user-${i}`),
              targetValue,
              description: `Bulk ${operationType.toLowerCase()}`,
              createdBy: 'admin@example.com',
              createdAt: new Date()
            })
          }}
          className="w-full"
        >
          Continue to Preview
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Preview Step
 */
function PreviewStep({
  request,
  isLoading,
  dryRunResult,
  onDryRun,
  onNext,
  onBack
}: {
  request: BulkOperationRequest
  isLoading: boolean
  dryRunResult: BulkOperationResult | null
  onDryRun: () => Promise<void>
  onNext: () => void
  onBack: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Preview Changes</CardTitle>
        <CardDescription>Execute a dry-run to preview changes without applying them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Operation Summary</h4>
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
            <p>Type: {request.type}</p>
            <p>Target: {request.targetValue}</p>
            <p>Affected Users: {request.userIds.length}</p>
          </div>
        </div>

        {dryRunResult && (
          <div>
            <h4 className="font-semibold mb-2">Dry-Run Results</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{dryRunResult.succeeded}</div>
                <div className="text-xs text-gray-600">Would Succeed</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{dryRunResult.failed}</div>
                <div className="text-xs text-gray-600">Would Fail</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">{dryRunResult.warnings}</div>
                <div className="text-xs text-gray-600">Warnings</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Back
          </Button>
          <Button
            onClick={onDryRun}
            disabled={isLoading}
            variant={dryRunResult ? 'default' : 'outline'}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Dry-Run...
              </>
            ) : (
              '▶️ Run Dry-Run'
            )}
          </Button>
          <Button
            onClick={onNext}
            disabled={!dryRunResult || isLoading}
            className="ml-auto"
          >
            Continue to Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Review Step
 */
function ReviewStep({
  request,
  dryRunResult,
  onNext,
  onBack
}: {
  request: BulkOperationRequest
  dryRunResult: BulkOperationResult
  onNext: () => void
  onBack: () => void
}) {
  const succeeded = dryRunResult.succeeded ?? 0
  const failed = dryRunResult.failed ?? 0
  const total = succeeded + failed || 1
  const successRate = (succeeded / total) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Review Impact</CardTitle>
        <CardDescription>Review the impact analysis before execution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Impact Analysis</AlertTitle>
          <AlertDescription>
            Operation will affect {request.userIds.length} users with estimated {successRate.toFixed(1)}% success rate
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-1">Success Rate</div>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-1">Estimated Cost</div>
            <div className="text-2xl font-bold">$250</div>
          </div>
        </div>

        <div className="border rounded p-3">
          <div className="text-sm font-medium mb-2">Key Risks</div>
          <ul className="text-sm space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              Some users already have this role
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              May trigger 150+ workflows
            </li>
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} className="ml-auto">
            Continue to Execute
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Execute Step
 */
function ExecuteStep({
  request,
  isLoading,
  onExecute,
  onBack
}: {
  request: BulkOperationRequest
  isLoading: boolean
  onExecute: () => Promise<void>
  onBack: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Execute Operation</CardTitle>
        <CardDescription>Ready to execute the bulk operation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Confirm Execution</AlertTitle>
          <AlertDescription>
            You are about to execute a bulk operation affecting {request.userIds.length} users. This action can be rolled back.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium mb-2">Operation Details</p>
          <p className="text-sm text-gray-600">Type: {request.type}</p>
          <p className="text-sm text-gray-600">Users: {request.userIds.length}</p>
          <p className="text-sm text-gray-600">Target: {request.targetValue}</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Back
          </Button>
          <Button
            onClick={onExecute}
            disabled={isLoading}
            className="ml-auto"
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              '🚀 Execute Operation'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Completion Step
 */
function CompletionStep({
  request,
  result,
  onRollback,
  onNewOperation
}: {
  request: BulkOperationRequest
  result: BulkOperationResult
  onRollback: () => Promise<void>
  onNewOperation: () => void
}) {
  const successRate = (result.succeeded / (result.succeeded + result.failed)) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Operation Complete</CardTitle>
        <CardDescription>Bulk operation has been executed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Operation Completed</AlertTitle>
          <AlertDescription>
            {result.succeeded} users updated successfully, {result.failed} failed
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">{result.succeeded}</div>
            <div className="text-xs text-gray-600">Succeeded</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-2xl font-bold text-red-600">{result.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{successRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onRollback}>
            ↶ Rollback Operation
          </Button>
          <Button onClick={onNewOperation} className="ml-auto">
            ➕ New Operation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
