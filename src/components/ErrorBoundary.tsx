import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
                    <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
                    <p className="text-muted-foreground mb-6">
                        Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Recargar Página
                    </Button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-8 p-4 bg-muted rounded text-left text-xs overflow-auto max-w-full">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
