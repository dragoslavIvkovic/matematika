import type React from "react";
import type { ComponentType, PropsWithChildren } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { ErrorFallback, type ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  FallbackComponent = ErrorFallback,
  onError,
}) => {
  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <FallbackComponent error={error as Error} resetError={resetErrorBoundary} />
      )}
      onError={(error, info) => {
        if (onError) onError(error as Error, info.componentStack || "");
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
