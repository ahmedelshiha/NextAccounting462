'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelectUsersStep } from './SelectUsersStep'
import { ChooseOperationStep } from './ChooseOperationStep'
import { ConfigureStep } from './ConfigureStep'
import { ReviewStep } from './ReviewStep'
import { ExecuteStep } from './ExecuteStep'

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5
  selectedUserIds: string[]
  operationType: string
  operationConfig: Record<string, any>
  userFilter: Record<string, any>
  operationId?: string
  dryRunResults?: any
  executionProgress?: any
}

interface BulkOperationsWizardProps {
  tenantId: string
  onClose: () => void
}

const steps = [
  { number: 1, title: 'Select Users', description: 'Choose users to affect' },
  { number: 2, title: 'Operation Type', description: 'What action to perform' },
  { number: 3, title: 'Configure', description: 'Configure the operation' },
  { number: 4, title: 'Review', description: 'Preview and dry-run' },
  { number: 5, title: 'Execute', description: 'Run the operation' }
]

export const BulkOperationsWizard: React.FC<BulkOperationsWizardProps> = ({
  tenantId,
  onClose
}) => {
  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedUserIds: [],
    operationType: '',
    operationConfig: {},
    userFilter: {}
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const goToStep = useCallback((step: 1 | 2 | 3 | 4 | 5) => {
    setState(prev => ({ ...prev, step }))
    setError(null)
  }, [])

  const nextStep = useCallback(() => {
    if (state.step < 5) {
      goToStep((state.step + 1) as any)
    }
  }, [state.step, goToStep])

  const prevStep = useCallback(() => {
    if (state.step > 1) {
      goToStep((state.step - 1) as any)
    }
  }, [state.step, goToStep])

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <SelectUsersStep
            tenantId={tenantId}
            filter={state.userFilter}
            onFilterChange={(filter) => updateState({ userFilter: filter })}
            onSelectUsers={(userIds) => updateState({ selectedUserIds: userIds })}
            onNext={nextStep}
          />
        )
      case 2:
        return (
          <ChooseOperationStep
            selected={state.operationType}
            onSelect={(type) => updateState({ operationType: type })}
            onNext={nextStep}
          />
        )
      case 3:
        return (
          <ConfigureStep
            operationType={state.operationType}
            config={state.operationConfig}
            onConfigChange={(config) => updateState({ operationConfig: config })}
            onNext={nextStep}
          />
        )
      case 4:
        return (
          <ReviewStep
            tenantId={tenantId}
            selectedUserIds={state.selectedUserIds}
            operationType={state.operationType}
            operationConfig={state.operationConfig}
            dryRunResults={state.dryRunResults}
            onDryRun={(results) => updateState({ dryRunResults: results })}
            onNext={nextStep}
          />
        )
      case 5:
        return (
          <ExecuteStep
            tenantId={tenantId}
            operationId={state.operationId}
            progress={state.executionProgress}
            onExecute={(id, progress) =>
              updateState({ operationId: id, executionProgress: progress })
            }
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          {steps.map((s) => (
            <button
              key={s.number}
              onClick={() => goToStep(s.number as any)}
              disabled={s.number > state.step && state.step < 5}
              className={`flex flex-col items-center gap-1 text-sm transition-all ${
                s.number === state.step
                  ? 'text-blue-600 font-semibold'
                  : s.number < state.step
                  ? 'text-green-600 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  s.number === state.step
                    ? 'bg-blue-100 text-blue-600'
                    : s.number < state.step
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.number < state.step ? '✓' : s.number}
              </div>
              <span className="hidden sm:inline text-xs">{s.title}</span>
            </button>
          ))}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(state.step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card className="p-6 min-h-96">
        {renderStep()}
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={state.step === 1 || loading}
          className="px-6"
        >
          Back
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {state.step < 5 && (
            <Button
              onClick={nextStep}
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
