'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            {this.state.error?.message || 'Halaman tidak dapat dimuat. Coba muat ulang halaman.'}
          </p>
          <Button
            variant="outline"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}