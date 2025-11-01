'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Play, Tabs } from 'lucide-react'
import { Workflow, WorkflowNode, WorkflowSimulation } from '@/services/workflow-designer.service'
import { NodeLibrary } from './NodeLibrary'
import { WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowSimulator } from './WorkflowSimulator'
import { WorkflowAnalytics } from './WorkflowAnalytics'

interface WorkflowDesignerProps {
  initialWorkflow?: Workflow
  onSave?: (workflow: Workflow) => Promise<void>
  onPublish?: (workflow: Workflow) => Promise<void>
  onTest?: (workflow: Workflow, testData?: Record<string, any>) => Promise<WorkflowSimulation>
}

export function WorkflowDesigner({
  initialWorkflow,
  onSave,
  onPublish,
  onTest
}: WorkflowDesignerProps) {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || createBlankWorkflow())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('designer')

  const handleAddNode = (type: any) => {
    const nodeCount = workflow.nodes.length
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      x: 50 + (nodeCount % 5) * 120,
      y: 50 + Math.floor(nodeCount / 5) * 80,
      config: {}
    }
    setWorkflow({ ...workflow, nodes: [...workflow.nodes, newNode] })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(workflow)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestRun = async () => {
    setIsTestRunning(true)
    try {
      const result = await onTest?.(workflow)
      if (result) {
        setTestResult(result)
      }
    } finally {
      setIsTestRunning(false)
    }
  }

  const validationErrors = workflow.validation.missingConfiguration
  const validationWarnings = workflow.validation.unreachableNodes.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{workflow.name}</h2>
          <p className="text-sm text-muted-foreground">{workflow.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestRun} disabled={isTestRunning}>
            <Play className="w-4 h-4 mr-2" />
            {isTestRunning ? 'Testing...' : 'Test Workflow'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={() => onPublish?.(workflow)} disabled={!workflow.validation.isValid}>
            Publish
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validationErrors.length} configuration error{validationErrors.length !== 1 ? 's' : ''} detected
          </AlertDescription>
        </Alert>
      )}

      {!workflow.validation.isValid && validationErrors.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Workflow has validation issues. Fix before publishing.
          </AlertDescription>
        </Alert>
      )}

      {workflow.validation.isValid && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Workflow is valid and ready to publish
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Canvas</CardTitle>
          <CardDescription>Drag nodes from the palette to build your workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Node Palette */}
            <div className="border rounded p-4 bg-gray-50">
              <h4 className="font-semibold mb-3">Node Types</h4>
              <div className="space-y-2">
                {(['trigger', 'action', 'decision', 'approval', 'integration', 'notification', 'delay', 'parallel'] as const).map(
                  type => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleAddNode(type)}
                    >
                      {type === 'trigger' && '🎯'}
                      {type === 'action' && '⚡'}
                      {type === 'decision' && '❓'}
                      {type === 'approval' && '✅'}
                      {type === 'integration' && '🔗'}
                      {type === 'notification' && '📧'}
                      {type === 'delay' && '⏱️'}
                      {type === 'parallel' && '⚡'}
                      {' '}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="border rounded bg-white p-4 relative h-96 overflow-auto">
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Edges */}
                {workflow.edges.map(edge => {
                  const fromNode = workflow.nodes.find(n => n.id === edge.from)
                  const toNode = workflow.nodes.find(n => n.id === edge.to)
                  if (!fromNode || !toNode) return null

                  return (
                    <line
                      key={edge.id}
                      x1={fromNode.x + 60}
                      y1={fromNode.y + 30}
                      x2={toNode.x + 60}
                      y2={toNode.y + 30}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                  </marker>
                </defs>
              </svg>

              {/* Nodes */}
              <div className="absolute inset-0 p-4">
                {workflow.nodes.map(node => (
                  <NodeComponent
                    key={node.id}
                    node={node}
                    isSelected={selectedNode === node.id}
                    onSelect={() => setSelectedNode(node.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4">
          <MetricBox label="Estimated Duration" value={`${workflow.performance.estimatedDuration}s`} />
          <MetricBox label="Parallel Paths" value={workflow.performance.parallelPaths} />
          <MetricBox label="Throughput" value={`${workflow.performance.throughput}/min`} />
          <MetricBox label="Bottlenecks" value={workflow.performance.bottlenecks.length} />
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <MetricBox label="Status" value={testResult.success ? '✅ Success' : '❌ Failed'} />
              <MetricBox label="Total Duration" value={`${testResult.totalDuration}s`} />
              <MetricBox label="Steps Executed" value={testResult.executionPath.length} />
            </div>

            {testResult.errors.length > 0 && (
              <div className="bg-red-50 p-3 rounded">
                <p className="font-semibold text-red-900 mb-2">Errors:</p>
                {testResult.errors.map((err, idx) => (
                  <p key={idx} className="text-sm text-red-800">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Node Component
 */
function NodeComponent({
  node,
  isSelected,
  onSelect
}: {
  node: WorkflowNode
  isSelected: boolean
  onSelect: () => void
}) {
  const icons: Record<string, string> = {
    trigger: '🎯',
    action: '⚡',
    decision: '❓',
    approval: '✅',
    integration: '🔗',
    notification: '📧',
    delay: '⏱️',
    parallel: '⚡'
  }

  return (
    <div
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      className={`absolute w-28 rounded border-2 p-2 text-center cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <div className="text-2xl mb-1">{icons[node.type]}</div>
      <div className="text-xs font-semibold line-clamp-2">{node.label}</div>
    </div>
  )
}

/**
 * Metric Box Component
 */
function MetricBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}

/**
 * Create blank workflow
 */
function createBlankWorkflow(): Workflow {
  return {
    id: Math.random().toString(),
    name: 'New Workflow',
    description: 'Build your workflow here',
    version: 1,
    status: 'DRAFT',
    nodes: [],
    edges: [],
    validation: {
      isValid: false,
      syntaxErrors: [],
      cyclicDependencies: [],
      unreachableNodes: [],
      missingConfiguration: []
    },
    performance: {
      estimatedDuration: 0,
      parallelPaths: 0,
      bottlenecks: [],
      throughput: 0
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  }
}
